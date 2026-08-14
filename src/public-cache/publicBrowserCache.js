export const BROWSER_CACHE_SCHEMA_VERSION = 1;

const DATABASE_NAME = "starry-public-cache";
const DATABASE_VERSION = BROWSER_CACHE_SCHEMA_VERSION;
const METADATA = "metadata";
const PACKAGE_SUMMARIES = "packageSummaries";
const CATEGORIES = "categories";
const CATEGORY_INDEXES = "categoryIndexes";
const PARENT_CATEGORY_INDEXES = "parentCategoryIndexes";
const BRAND_INDEXES = "brandIndexes";
const FEATURED_ROWS = "featuredRows";
const PUBLIC_CONTENT = "publicContent";
const ALL_STORES = [
  METADATA,
  PACKAGE_SUMMARIES,
  CATEGORIES,
  CATEGORY_INDEXES,
  PARENT_CATEGORY_INDEXES,
  BRAND_INDEXES,
  FEATURED_ROWS,
  PUBLIC_CONTENT,
];

const CATALOG_METADATA_KEY = "catalog";
const CATEGORY_METADATA_KEY = "categories";
const BROWSER_STATE_METADATA_KEY = "browser-state";
const normalize = (value) => String(value || "").trim().toLowerCase();
const packageCodeOf = (value = {}) => String(value.packageCode || value.code || "").trim();
const categoryCodeOf = (value = {}) => String(value.code || value.categoryCode || "").trim();

function requestAsPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function transactionAsPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
  });
}

function createStores(database) {
  if (!database.objectStoreNames.contains(METADATA)) database.createObjectStore(METADATA, { keyPath: "key" });
  if (!database.objectStoreNames.contains(PACKAGE_SUMMARIES)) database.createObjectStore(PACKAGE_SUMMARIES, { keyPath: "packageCode" });
  if (!database.objectStoreNames.contains(CATEGORIES)) database.createObjectStore(CATEGORIES, { keyPath: "code" });
  if (!database.objectStoreNames.contains(CATEGORY_INDEXES)) database.createObjectStore(CATEGORY_INDEXES, { keyPath: "key" });
  if (!database.objectStoreNames.contains(PARENT_CATEGORY_INDEXES)) database.createObjectStore(PARENT_CATEGORY_INDEXES, { keyPath: "key" });
  if (!database.objectStoreNames.contains(BRAND_INDEXES)) database.createObjectStore(BRAND_INDEXES, { keyPath: "key" });
  if (!database.objectStoreNames.contains(FEATURED_ROWS)) database.createObjectStore(FEATURED_ROWS, { keyPath: "key" });
  if (!database.objectStoreNames.contains(PUBLIC_CONTENT)) database.createObjectStore(PUBLIC_CONTENT, { keyPath: "key" });
}

function matchesVersion(record, manifest, versionKey) {
  return Boolean(record)
    && record.schemaVersion === BROWSER_CACHE_SCHEMA_VERSION
    && record.epoch === manifest.browserCacheEpoch
    && record.version === manifest[versionKey];
}

function validatePackages(packages) {
  if (!Array.isArray(packages)) throw new Error("Public package catalog is not an array");
  const seen = new Set();
  packages.forEach((item) => {
    const code = packageCodeOf(item);
    if (!code || seen.has(normalize(code))) throw new Error("Public package catalog has an invalid or duplicate package code");
    seen.add(normalize(code));
  });
}

function validateCategories(categories) {
  if (!Array.isArray(categories)) throw new Error("Public category list is not an array");
  const seen = new Set();
  categories.forEach((item) => {
    const code = categoryCodeOf(item);
    if (!code || seen.has(normalize(code))) throw new Error("Public category list has an invalid or duplicate category code");
    seen.add(normalize(code));
  });
}

function buildIndexes(packages) {
  const categoryIndexes = new Map();
  const parentCategoryIndexes = new Map();
  const brandIndexes = new Map();
  packages.forEach((pkg) => {
    const packageCode = packageCodeOf(pkg);
    const add = (index, rawKey) => {
      const key = normalize(rawKey);
      if (!key) return;
      const values = index.get(key) || [];
      if (!values.includes(packageCode)) values.push(packageCode);
      index.set(key, values);
    };
    (Array.isArray(pkg.categoryCodes) ? pkg.categoryCodes : []).forEach((code) => add(categoryIndexes, code));
    (Array.isArray(pkg.parentCategoryCodes) ? pkg.parentCategoryCodes : []).forEach((code) => {
      add(categoryIndexes, code);
      add(parentCategoryIndexes, code);
    });
    add(brandIndexes, pkg.brandName || pkg.brand);
  });
  return { categoryIndexes, parentCategoryIndexes, brandIndexes };
}

function buildCategoryTree(categories) {
  const byCode = new Map(categories.map((category) => [normalize(categoryCodeOf(category)), category]));
  const childrenByParent = new Map();
  const roots = [];

  categories.forEach((category) => {
    const parent = normalize(category.parent);
    if (!parent || parent === "-" || !byCode.has(parent)) {
      roots.push(category);
      return;
    }
    const children = childrenByParent.get(parent) || [];
    children.push(category);
    childrenByParent.set(parent, children);
  });

  const node = (category, ancestors = new Set()) => {
    const code = normalize(categoryCodeOf(category));
    if (ancestors.has(code)) throw new Error("Public category cache has a cyclic relationship");
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(code);
    return {
      ...category,
      children: (childrenByParent.get(code) || []).map((child) => node(child, nextAncestors)),
    };
  };

  return roots.map((category) => node(category));
}

function normalizeFeaturedRows(rows) {
  if (!Array.isArray(rows)) throw new Error("Featured Rows response is not an array");
  const packages = new Map();
  const normalizedRows = rows.map((row) => {
    if (!row || typeof row !== "object") throw new Error("Featured Row is invalid");
    const rowType = normalize(row.rowType || row.type);
    const items = Array.isArray(row.items) ? row.items : [];
    const itemRefs = items.map((item, index) => {
      const code = String(item?.code || item?.packageCode || item?.id || "").trim();
      if (!code) throw new Error("Featured Row item is missing a code");
      const sequence = item?.sequence ?? index + 1;
      if (rowType === "category") {
        return { kind: "category", code, sequence, item: { ...item } };
      }
      const packageItem = { ...item };
      packages.set(normalize(code), { ...packageItem, packageCode: packageCodeOf(packageItem) || code, code });
      return { kind: "package", code, sequence };
    });
    const metadata = { ...row };
    delete metadata.items;
    delete metadata.codes;
    return { metadata, itemRefs };
  });
  return { normalizedRows, packages: [...packages.values()] };
}

function hydrateFeaturedRows(normalizedRows, packagesByCode) {
  return normalizedRows.map(({ metadata, itemRefs }) => {
    const items = itemRefs.map((reference) => {
      if (reference.kind === "category") return { ...reference.item };
      const packageSummary = packagesByCode.get(normalize(reference.code));
      if (!packageSummary) throw new Error("Featured Row package reference is not available in the browser cache");
      return {
        ...packageSummary,
        id: reference.code,
        code: reference.code,
        packageCode: packageCodeOf(packageSummary) || reference.code,
        type: "package",
        sequence: reference.sequence,
      };
    });
    return { ...metadata, items, codes: items.map((item) => item.code || item.packageCode || item.id) };
  });
}

export class IndexedDbPublicBrowserCache {
  constructor() {
    this.openPromise = null;
  }

  supported() {
    return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
  }

  async open() {
    if (!this.supported()) throw new Error("IndexedDB is not supported by this browser");
    if (!this.openPromise) {
      this.openPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => createStores(request.result);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB could not be opened"));
        request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked by another browser tab"));
      });
    }
    return this.openPromise;
  }

  async readCatalog(manifest) {
    const database = await this.open();
    const metadata = await requestAsPromise(database.transaction(METADATA).objectStore(METADATA).get(CATALOG_METADATA_KEY));
    if (!matchesVersion(metadata, manifest, "catalogVersion") || !metadata.complete) return null;

    const transaction = database.transaction([PACKAGE_SUMMARIES, CATEGORY_INDEXES, BRAND_INDEXES], "readonly");
    const completed = transactionAsPromise(transaction);
    const [packageRecords, categoryIndexes, brandIndexes] = await Promise.all([
      requestAsPromise(transaction.objectStore(PACKAGE_SUMMARIES).getAll()),
      requestAsPromise(transaction.objectStore(CATEGORY_INDEXES).getAll()),
      requestAsPromise(transaction.objectStore(BRAND_INDEXES).getAll()),
    ]);
    await completed;
    const packageMap = new Map(packageRecords.map((record) => [normalize(record.packageCode), record.payload]));
    const packages = metadata.packageOrder.map((code) => packageMap.get(normalize(code))).filter(Boolean);
    if (packages.length !== metadata.packageOrder.length) return null;
    return {
      packages,
      categoryIndexes: new Map(categoryIndexes.map((record) => [record.key, record.packageCodes])),
      brandIndexes: new Map(brandIndexes.map((record) => [record.key, record.packageCodes])),
    };
  }

  async needsDiscard(manifest) {
    const database = await this.open();
    const state = await requestAsPromise(database.transaction(METADATA).objectStore(METADATA).get(BROWSER_STATE_METADATA_KEY));
    return Boolean(state) && (state.schemaVersion !== BROWSER_CACHE_SCHEMA_VERSION || state.epoch !== manifest.browserCacheEpoch);
  }

  async readCategories(manifest) {
    const database = await this.open();
    const metadata = await requestAsPromise(database.transaction(METADATA).objectStore(METADATA).get(CATEGORY_METADATA_KEY));
    if (!matchesVersion(metadata, manifest, "catalogVersion")) return null;
    const transaction = database.transaction(CATEGORIES, "readonly");
    const completed = transactionAsPromise(transaction);
    const records = await requestAsPromise(transaction.objectStore(CATEGORIES).getAll());
    await completed;
    const values = new Map(records.map((record) => [normalize(record.code), record.payload]));
    const categories = metadata.categoryOrder.map((code) => values.get(normalize(code))).filter(Boolean);
    return categories.length === metadata.categoryOrder.length ? categories : null;
  }

  async readFeaturedRows(manifest, visibleOn) {
    const database = await this.open();
    const key = normalize(visibleOn) || "home";
    const record = await requestAsPromise(database.transaction(FEATURED_ROWS).objectStore(FEATURED_ROWS).get(key));
    if (!matchesVersion(record, manifest, "featuredRowsVersion")) return null;
    const transaction = database.transaction(PACKAGE_SUMMARIES, "readonly");
    const completed = transactionAsPromise(transaction);
    const packageRecords = await requestAsPromise(transaction.objectStore(PACKAGE_SUMMARIES).getAll());
    await completed;
    try {
      return hydrateFeaturedRows(record.rows, new Map(packageRecords.map((entry) => [normalize(entry.packageCode), entry.payload])));
    } catch {
      return null;
    }
  }

  async readPublicContent(manifest, key, versionKey) {
    const database = await this.open();
    const record = await requestAsPromise(database.transaction(PUBLIC_CONTENT).objectStore(PUBLIC_CONTENT).get(key));
    return matchesVersion(record, manifest, versionKey) ? record.payload : null;
  }

  async writeCatalog(manifest, packages, categories) {
    validatePackages(packages);
    validateCategories(categories);
    const indexes = buildIndexes(packages);
    const database = await this.open();
    const transaction = database.transaction([
      METADATA, PACKAGE_SUMMARIES, CATEGORIES, CATEGORY_INDEXES, PARENT_CATEGORY_INDEXES, BRAND_INDEXES,
    ], "readwrite");
    const completed = transactionAsPromise(transaction);
    transaction.objectStore(PACKAGE_SUMMARIES).clear();
    transaction.objectStore(CATEGORIES).clear();
    transaction.objectStore(CATEGORY_INDEXES).clear();
    transaction.objectStore(PARENT_CATEGORY_INDEXES).clear();
    transaction.objectStore(BRAND_INDEXES).clear();
    packages.forEach((payload) => transaction.objectStore(PACKAGE_SUMMARIES).put({ packageCode: packageCodeOf(payload), payload }));
    categories.forEach((payload) => transaction.objectStore(CATEGORIES).put({ code: categoryCodeOf(payload), payload }));
    indexes.categoryIndexes.forEach((packageCodes, key) => transaction.objectStore(CATEGORY_INDEXES).put({ key, packageCodes }));
    indexes.parentCategoryIndexes.forEach((packageCodes, key) => transaction.objectStore(PARENT_CATEGORY_INDEXES).put({ key, packageCodes }));
    indexes.brandIndexes.forEach((packageCodes, key) => transaction.objectStore(BRAND_INDEXES).put({ key, packageCodes }));
    const storedAt = new Date().toISOString();
    // Metadata is intentionally issued last in the atomic transaction: readers
    // either see the previous active metadata or the complete new generation.
    transaction.objectStore(METADATA).put({
      key: CATALOG_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      version: manifest.catalogVersion,
      complete: true,
      packageOrder: packages.map(packageCodeOf),
      packageCount: packages.length,
      storedAt,
    });
    transaction.objectStore(METADATA).put({
      key: CATEGORY_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      version: manifest.catalogVersion,
      categoryOrder: categories.map(categoryCodeOf),
      categoryCount: categories.length,
      storedAt,
    });
    transaction.objectStore(METADATA).put({
      key: BROWSER_STATE_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      storedAt,
    });
    await completed;
  }

  async writeCategories(manifest, categories) {
    validateCategories(categories);
    const database = await this.open();
    const transaction = database.transaction([METADATA, CATEGORIES], "readwrite");
    const completed = transactionAsPromise(transaction);
    transaction.objectStore(CATEGORIES).clear();
    categories.forEach((payload) => transaction.objectStore(CATEGORIES).put({ code: categoryCodeOf(payload), payload }));
    transaction.objectStore(METADATA).put({
      key: CATEGORY_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      version: manifest.catalogVersion,
      categoryOrder: categories.map(categoryCodeOf),
      categoryCount: categories.length,
      storedAt: new Date().toISOString(),
    });
    transaction.objectStore(METADATA).put({
      key: BROWSER_STATE_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      storedAt: new Date().toISOString(),
    });
    await completed;
  }

  async writeFeaturedRows(manifest, visibleOn, rows) {
    const { normalizedRows, packages } = normalizeFeaturedRows(rows);
    const database = await this.open();
    const transaction = database.transaction([METADATA, FEATURED_ROWS, PACKAGE_SUMMARIES], "readwrite");
    const completed = transactionAsPromise(transaction);
    packages.forEach((payload) => transaction.objectStore(PACKAGE_SUMMARIES).put({ packageCode: packageCodeOf(payload), payload }));
    transaction.objectStore(FEATURED_ROWS).put({
      key: normalize(visibleOn) || "home",
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      version: manifest.featuredRowsVersion,
      rows: normalizedRows,
      storedAt: new Date().toISOString(),
    });
    transaction.objectStore(METADATA).put({
      key: BROWSER_STATE_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      storedAt: new Date().toISOString(),
    });
    await completed;
  }

  async writePublicContent(manifest, key, versionKey, payload) {
    const database = await this.open();
    const transaction = database.transaction([METADATA, PUBLIC_CONTENT], "readwrite");
    const completed = transactionAsPromise(transaction);
    transaction.objectStore(PUBLIC_CONTENT).put({
      key,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      version: manifest[versionKey],
      payload,
      storedAt: new Date().toISOString(),
    });
    transaction.objectStore(METADATA).put({
      key: BROWSER_STATE_METADATA_KEY,
      schemaVersion: BROWSER_CACHE_SCHEMA_VERSION,
      epoch: manifest.browserCacheEpoch,
      storedAt: new Date().toISOString(),
    });
    await completed;
  }

  async discard() {
    const database = await this.open();
    const transaction = database.transaction(ALL_STORES, "readwrite");
    const completed = transactionAsPromise(transaction);
    ALL_STORES.forEach((store) => transaction.objectStore(store).clear());
    await completed;
  }

  async storageSummary() {
    const database = await this.open();
    const transaction = database.transaction([PACKAGE_SUMMARIES, CATEGORIES, FEATURED_ROWS, PUBLIC_CONTENT], "readonly");
    const completed = transactionAsPromise(transaction);
    const [packages, categories, rows, content] = await Promise.all([
      requestAsPromise(transaction.objectStore(PACKAGE_SUMMARIES).count()),
      requestAsPromise(transaction.objectStore(CATEGORIES).count()),
      requestAsPromise(transaction.objectStore(FEATURED_ROWS).count()),
      requestAsPromise(transaction.objectStore(PUBLIC_CONTENT).count()),
    ]);
    await completed;
    return { packages, categories, featuredRows: rows, publicContent: content };
  }
}

export const publicBrowserCache = new IndexedDbPublicBrowserCache();
export { buildCategoryTree, packageCodeOf, normalize };
