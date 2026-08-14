import api from "../utils/api";
import {
  BROWSER_CACHE_SCHEMA_VERSION,
  buildCategoryTree,
  normalize,
  publicBrowserCache,
} from "./publicBrowserCache";

export const PUBLIC_BROWSER_CACHE_ENABLED = import.meta.env.VITE_PUBLIC_BROWSER_CACHE_ENABLED !== "false";

const inFlight = new Map();
let cacheDisabledForSession = false;

function dedupe(key, loader) {
  if (!inFlight.has(key)) {
    const request = Promise.resolve().then(loader).finally(() => inFlight.delete(key));
    inFlight.set(key, request);
  }
  return inFlight.get(key);
}

function cacheAvailable() {
  return PUBLIC_BROWSER_CACHE_ENABLED && !cacheDisabledForSession && publicBrowserCache.supported();
}

function safeCacheWarning(action, error) {
  // IndexedDB is strictly optional. Keep diagnostics safe and avoid turning a
  // storage restriction/quota failure into a public-site failure.
  console.warn(`[Public browser cache] ${action}; continuing with the HTTP API.`, error?.name || "unavailable");
}

function markCacheUnavailable(action, error) {
  cacheDisabledForSession = true;
  safeCacheWarning(action, error);
}

function manifestIsUsable(manifest) {
  return Boolean(manifest)
    && manifest.schemaCompatibilityVersion === BROWSER_CACHE_SCHEMA_VERSION
    && manifest.browserCacheEnabled === true
    && typeof manifest.browserCacheEpoch === "string"
    && typeof manifest.catalogVersion === "string"
    && manifest.catalogVersion.length > 0;
}

async function getManifest() {
  return dedupe("manifest", async () => {
    const manifest = await api.get("/public-cache/manifest");
    if (!manifest || manifest.schemaCompatibilityVersion !== BROWSER_CACHE_SCHEMA_VERSION) {
      throw new Error("Public cache manifest is incompatible with this application build");
    }
    return manifest;
  });
}

function appendBodyRefresh(url, version) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}__publicCacheRefresh=${encodeURIComponent(version || Date.now())}`;
}

async function fetchBody(url, bodyVersion) {
  try {
    return await api.get(url);
  } catch (error) {
    // Axios may surface a raw 304 when IndexedDB needs a body after browser
    // HTTP revalidation. A unique same-representation URL safely requests one
    // body without disabling Phase 2 ETag support for ordinary requests.
    if (error?.response?.status === 304) {
      return api.get(appendBodyRefresh(url, bodyVersion), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    throw error;
  }
}

async function discardOnEpochMismatch(manifest) {
  try {
    if (await publicBrowserCache.needsDiscard(manifest)) {
      await publicBrowserCache.discard();
    }
  } catch (error) {
    markCacheUnavailable("could not inspect browser cache", error);
  }
}

async function readCatalog(manifest) {
  try {
    return await publicBrowserCache.readCatalog(manifest);
  } catch (error) {
    markCacheUnavailable("catalog read failed", error);
    return null;
  }
}

async function readCategories(manifest) {
  try {
    return await publicBrowserCache.readCategories(manifest);
  } catch (error) {
    markCacheUnavailable("category read failed", error);
    return null;
  }
}

async function currentManifestAfterDownload(initialManifest) {
  const current = await getManifest();
  if (!manifestIsUsable(current)) return current;
  const sameGeneration = current.browserCacheEpoch === initialManifest.browserCacheEpoch
    && current.catalogVersion === initialManifest.catalogVersion;
  return sameGeneration ? current : null;
}

async function synchronizeCatalog(manifest) {
  return dedupe(`catalog:${manifest.browserCacheEpoch}:${manifest.catalogVersion}`, async () => {
    const [packages, categories] = await Promise.all([
      fetchBody("/packages", manifest.catalogVersion),
      fetchBody("/categories", manifest.catalogVersion),
    ]);
    const current = await currentManifestAfterDownload(manifest);
    if (!current) {
      const refreshed = await getManifest();
      if (manifestIsUsable(refreshed)) return synchronizeCatalog(refreshed);
      return packages;
    }
    try {
      await publicBrowserCache.writeCatalog(current, packages, categories);
    } catch (error) {
      markCacheUnavailable("catalog write failed", error);
    }
    return packages;
  });
}

function selectIndexedPackages(catalog, filters) {
  const category = normalize(filters.category || filters.regionCode);
  const brand = normalize(filters.brand);
  if (!category && !brand) return catalog.packages;
  const selectedCodes = category
    ? catalog.categoryIndexes.get(category)
    : catalog.brandIndexes.get(brand);
  if (!selectedCodes) return [];
  const byCode = new Map(catalog.packages.map((item) => [normalize(item.packageCode || item.code), item]));
  return selectedCodes.map((code) => byCode.get(normalize(code))).filter(Boolean);
}

function selectPackagesFromList(packages, filters) {
  const category = normalize(filters.category || filters.regionCode);
  const brand = normalize(filters.brand);
  if (!category && !brand) return packages;
  return packages.filter((item) => {
    if (brand) return normalize(item.brandName || item.brand) === brand;
    const categoryCodes = Array.isArray(item.categoryCodes) ? item.categoryCodes : [];
    const parentCodes = Array.isArray(item.parentCategoryCodes) ? item.parentCategoryCodes : [];
    return [...categoryCodes, ...parentCodes].some((code) => normalize(code) === category);
  });
}

function packagesUrl({ category, regionCode, rowId, brand } = {}) {
  if (rowId) return `/packages?rowId=${encodeURIComponent(rowId)}`;
  if (category) return `/packages?category=${encodeURIComponent(category)}`;
  if (regionCode) return `/packages?regionCode=${encodeURIComponent(regionCode)}`;
  if (brand) return `/packages?brand=${encodeURIComponent(brand)}`;
  return "/packages";
}

async function withManifest(cacheReader, networkLoader) {
  if (!cacheAvailable()) return networkLoader();
  let manifest;
  try {
    manifest = await getManifest();
  } catch (error) {
    // A manifest outage never gives arbitrarily old persistent data authority.
    safeCacheWarning("manifest request failed", error);
    return networkLoader();
  }
  if (!manifestIsUsable(manifest)) return networkLoader();
  await discardOnEpochMismatch(manifest);
  if (!cacheAvailable()) return networkLoader();
  return cacheReader(manifest, networkLoader);
}

export const publicCatalogService = {
  async getPackages(filters = {}) {
    const url = packagesUrl(filters);
    // A row ID represents server-defined membership/order. Retain the
    // authoritative route until an exact, independently validated row index is
    // needed by a later phase.
    if (filters.rowId) return api.get(url);
    return withManifest(async (manifest) => {
      const catalog = await readCatalog(manifest);
      if (catalog) return selectIndexedPackages(catalog, filters);
      return selectPackagesFromList(await synchronizeCatalog(manifest), filters);
    }, () => api.get(url));
  },

  async getCategories() {
    return withManifest(async (manifest) => {
      const stored = await readCategories(manifest);
      if (stored) return stored;
      const categories = await fetchBody("/categories", manifest.catalogVersion);
      const current = await currentManifestAfterDownload(manifest);
      if (!current) return categories;
      try {
        await publicBrowserCache.writeCategories(current, categories);
      } catch (error) {
        markCacheUnavailable("category write failed", error);
      }
      return categories;
    }, () => api.get("/categories"));
  },

  async getCategoryTree() {
    const categories = await this.getCategories();
    try {
      return buildCategoryTree(categories);
    } catch (error) {
      // The original authoritative endpoint remains the conservative fallback
      // if a category relationship cannot be reconstructed exactly.
      safeCacheWarning("category tree reconstruction failed", error);
      return api.get("/categories/tree");
    }
  },
};

async function featuredRows(visibleOn) {
  const key = normalize(visibleOn) || "home";
  return withManifest(async (manifest) => {
    try {
      const cached = await publicBrowserCache.readFeaturedRows(manifest, key);
      if (cached) return cached;
    } catch (error) {
      markCacheUnavailable("Featured Rows read failed", error);
    }
    const rows = await fetchBody(`/featured-rows/public?visibleOn=${encodeURIComponent(key)}`, manifest.featuredRowsVersion);
    const current = await getManifest();
    if (!manifestIsUsable(current) || current.browserCacheEpoch !== manifest.browserCacheEpoch
        || current.featuredRowsVersion !== manifest.featuredRowsVersion) {
      return rows;
    }
    try {
      await publicBrowserCache.writeFeaturedRows(current, key, rows);
    } catch (error) {
      markCacheUnavailable("Featured Rows write failed", error);
    }
    return rows;
  }, () => api.get(`/featured-rows/public?visibleOn=${encodeURIComponent(key)}`));
}

async function publicContent(key, url, versionKey) {
  return withManifest(async (manifest) => {
    try {
      const cached = await publicBrowserCache.readPublicContent(manifest, key, versionKey);
      if (cached !== null && cached !== undefined) return cached;
    } catch (error) {
      markCacheUnavailable(`${key} read failed`, error);
    }
    const payload = await fetchBody(url, manifest[versionKey]);
    const current = await getManifest();
    if (!manifestIsUsable(current) || current.browserCacheEpoch !== manifest.browserCacheEpoch
        || current[versionKey] !== manifest[versionKey]) {
      return payload;
    }
    try {
      await publicBrowserCache.writePublicContent(current, key, versionKey, payload);
    } catch (error) {
      markCacheUnavailable(`${key} write failed`, error);
    }
    return payload;
  }, () => api.get(url));
}

export const publicFeaturedRowsService = { getRows: featuredRows };
export const publicContentService = {
  getHero: () => publicContent("hero", "/hero-sliders/public", "heroVersion"),
  getStatistics: () => publicContent("statistics", "/homepage-statistics/public", "statisticsVersion"),
  getGallery: () => publicContent("gallery", "/gallery/public", "galleryVersion"),
};

export const publicBrowserCacheDiagnostics = {
  enabled: () => cacheAvailable(),
  storageSummary: () => publicBrowserCache.storageSummary(),
};
