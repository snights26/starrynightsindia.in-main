import { useEffect, useMemo, useState } from "react";
import { MdChevronLeft, MdChevronRight, MdLocationOn, MdPublic, MdTravelExplore } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../common";
import Pagination, { usePagination } from "../../components/Common/Pagination";
import { resolveAssetUrl } from "../../utils/api";
import { publicCatalogService } from "../../public-cache/publicData";
import "./Click2Explore.css";

const MAPS = [
  {
    key: "domestic",
    label: "Domestic",
    parentCode: "DOM",
    defaultRegionCode: "DOM-HP",
    title: "Explore India",
    eyebrow: "Domestic Explorer",
    description: "Select a state on the map to discover curated tour packages.",
    assetUrl: "/maps/india-states.geojson",
    coordinateMode: "geo",
    viewBox: "0 0 202 258",
    backdrop: { x: 1, y: 1, width: 200, height: 256, rx: 18 },
    background: "#f8fafc",
    landmassPath: "",
    annotations: [],
  },
  {
    key: "international",
    label: "International",
    parentCode: "INT",
    defaultRegionCode: "INT-SINGAPORE",
    title: "Explore the World",
    eyebrow: "International Explorer",
    description: "Select a country on the map to discover curated international packages.",
    assetUrl: "/maps/world-countries.geojson",
    coordinateMode: "geo",
    viewBox: "0 0 248 168",
    backdrop: { x: 1, y: 1, width: 246, height: 166, rx: 18 },
    background: "#28abc2",
    landmassPath: "M13 14 L55 10 L76 21 L78 49 L66 63 L72 77 L57 84 L64 94 L80 108 L94 115 L91 136 L80 146 L72 127 L76 111 L64 94 L39 76 L14 55 L13 14 Z M99 59 L104 30 L130 12 L207 9 L222 27 L211 48 L222 63 L214 85 L231 126 L243 143 L232 160 L202 161 L185 148 L180 114 L154 78 L123 66 L112 82 L120 113 L153 128 L140 142 L121 137 L114 124 L116 93 L95 69 L99 59 Z",
    annotations: [
      { label: "ARCTIC OCEAN", x: 33, y: 13 },
      { label: "NORTH PACIFIC OCEAN", x: 34, y: 91 },
      { label: "SOUTH ATLANTIC OCEAN", x: 92, y: 136 },
      { label: "INDIAN OCEAN", x: 162, y: 128 },
      { label: "ARABIAN SEA", x: 147, y: 97 }
    ],
  }
];

const REGION_COLOR_FALLBACKS = [
  "#ef646f",
  "#f59f3d",
  "#fae93f",
  "#63b85f",
  "#9d75b8",
  "#17a398",
  "#ec9aa0",
  "#61539a",
  "#d94f70",
  "#9aa04e"
];

const REGION_NAME_ALIASES = {
  "andaman and nicobar": "andaman and nicobar islands",
  "andaman & nicobar": "andaman and nicobar islands",
  "orissa": "odisha",
  "pondicherry": "puducherry",
  "uttaranchal": "uttarakhand",
  "nct of delhi": "delhi",
  "national capital territory of delhi": "delhi",
  "united states of america": "united states",
  "usa": "united states",
  "uae": "dubai",
  "united arab emirates": "dubai"
};

const DOMESTIC_REGION_CODES_BY_NAME = {
  "andaman and nicobar": "DOM-AN",
  "andaman and nicobar islands": "DOM-AN",
  "andhra pradesh": "DOM-AP",
  "arunachal pradesh": "DOM-AR",
  "assam": "DOM-AS",
  "bihar": "DOM-BR",
  "chandigarh": "DOM-CH",
  "chhattisgarh": "DOM-CG",
  "dadra and nagar haveli": "DOM-DN",
  "dadra and nagar haveli and daman and diu": "DOM-DN",
  "daman and diu": "DOM-DD",
  "delhi": "DOM-DL",
  "goa": "DOM-GA",
  "gujarat": "DOM-GJ",
  "haryana": "DOM-HR",
  "himachal pradesh": "DOM-HP",
  "jammu and kashmir": "DOM-JK",
  "jammu & kashmir": "DOM-JK",
  "kashmir": "DOM-JK",
  "ladakh": "DOM-LA",
  "jharkhand": "DOM-JH",
  "karnataka": "DOM-KA",
  "kerala": "DOM-KL",
  "lakshadweep": "DOM-LK",
  "madhya pradesh": "DOM-MP",
  "maharashtra": "DOM-MH",
  "manipur": "DOM-MN",
  "meghalaya": "DOM-MG",
  "mizoram": "DOM-MZ",
  "nagaland": "DOM-NL",
  "odisha": "DOM-OD",
  "orissa": "DOM-OD",
  "puducherry": "DOM-PY",
  "pondicherry": "DOM-PY",
  "punjab": "DOM-PB",
  "rajasthan": "DOM-RJ",
  "sikkim": "DOM-SK",
  "tamil nadu": "DOM-TN",
  "telangana": "DOM-TS",
  "tripura": "DOM-TR",
  "uttar pradesh": "DOM-UP",
  "uttarakhand": "DOM-UK",
  "uttaranchal": "DOM-UK",
  "west bengal": "DOM-WB"
};

const INTERNATIONAL_REGION_CODES_BY_NAME = {
  "argentina": "INT-ARGENTINA",
  "australia": "INT-AUSTRALIA",
  "bali": "INT-BALI",
  "brazil": "INT-BRAZIL",
  "canada": "INT-CANADA",
  "china": "INT-CHINA",
  "dubai": "INT-DUBAI",
  "egypt": "INT-EGYPT",
  "france": "INT-FRANCE",
  "india": "INT-INDIA",
  "malaysia": "INT-MALAYSIA",
  "maldives": "INT-MALDIVES",
  "mexico": "INT-MEXICO",
  "russia": "INT-RUSSIA",
  "singapore": "INT-SINGAPORE",
  "south africa": "INT-SOUTH-AFRICA",
  "spain": "INT-SPAIN",
  "switzerland": "INT-SWITZERLAND",
  "thailand": "INT-THAILAND",
  "turkey": "INT-TURKEY",
  "uae": "INT-DUBAI",
  "united arab emirates": "INT-DUBAI",
  "united kingdom": "INT-UK",
  "united states": "INT-USA",
  "united states of america": "INT-USA",
  "usa": "INT-USA",
  "vietnam": "INT-VIETNAM"
};

const SMALL_DOMESTIC_REGION_CODES = new Set([
  "DOM-AN",
  "DOM-CH",
  "DOM-DD",
  "DOM-DL",
  "DOM-DN",
  "DOM-GA",
  "DOM-LK",
  "DOM-PY",
  "DOM-SK"
]);

const REGION_FALLBACK_COORDINATES = {
  "DOM-LK": [72.75, 10.57]
};

const STATIC_REGION_NAMES_BY_CODE = {
  ...Object.fromEntries(Object.entries(DOMESTIC_REGION_CODES_BY_NAME).map(([name, code]) => [code, name])),
  ...Object.fromEntries(Object.entries(INTERNATIONAL_REGION_CODES_BY_NAME).map(([name, code]) => [code, name]))
};

Object.assign(STATIC_REGION_NAMES_BY_CODE, {
  "DOM-AN": "Andaman and Nicobar",
  "DOM-AP": "Andhra Pradesh",
  "DOM-AR": "Arunachal Pradesh",
  "DOM-AS": "Assam",
  "DOM-BR": "Bihar",
  "DOM-CH": "Chandigarh",
  "DOM-CG": "Chhattisgarh",
  "DOM-DD": "Daman and Diu",
  "DOM-DL": "Delhi",
  "DOM-DN": "Dadra and Nagar Haveli",
  "DOM-GA": "Goa",
  "DOM-GJ": "Gujarat",
  "DOM-HP": "Himachal Pradesh",
  "DOM-HR": "Haryana",
  "DOM-JH": "Jharkhand",
  "DOM-JK": "Jammu and Kashmir",
  "DOM-KA": "Karnataka",
  "DOM-KL": "Kerala",
  "DOM-LA": "Ladakh",
  "DOM-LK": "Lakshadweep",
  "DOM-MG": "Meghalaya",
  "DOM-MH": "Maharashtra",
  "DOM-MN": "Manipur",
  "DOM-MP": "Madhya Pradesh",
  "DOM-MZ": "Mizoram",
  "DOM-NL": "Nagaland",
  "DOM-OD": "Odisha",
  "DOM-PB": "Punjab",
  "DOM-PY": "Puducherry",
  "DOM-RJ": "Rajasthan",
  "DOM-SK": "Sikkim",
  "DOM-TN": "Tamil Nadu",
  "DOM-TR": "Tripura",
  "DOM-TS": "Telangana",
  "DOM-UK": "Uttarakhand",
  "DOM-UP": "Uttar Pradesh",
  "DOM-WB": "West Bengal",
  "INT-DUBAI": "Dubai",
  "INT-SOUTH-AFRICA": "South Africa",
  "INT-UK": "United Kingdom",
  "INT-USA": "United States"
});

function parseViewBox(viewBox) {
  const [x, y, width, height] = viewBox.split(/\s+/).map(Number);
  return { x, y, width, height };
}

function polygonRings(feature) {
  const geometry = feature?.geometry;
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function collectRings(feature) {
  return polygonRings(feature).flat();
}

function isValidRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return false;
  const first = ring[0];
  const last = ring[ring.length - 1];
  return ring.every((point) => Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(point[0])
    && Number.isFinite(point[1]))
    && first[0] === last[0]
    && first[1] === last[1];
}

function validateMapFeature(feature, map) {
  const geometry = feature?.geometry;
  const stableId = featureCode(feature) || featureTitle(feature);
  const regionCode = featureCode(feature) || resolveStaticRegionCode(map, feature);
  const valid = Boolean(stableId)
    && Boolean(regionCode)
    && (geometry?.type === "Polygon" || geometry?.type === "MultiPolygon")
    && collectRings(feature).length > 0
    && collectRings(feature).every(isValidRing);

  if (!valid) {
    console.warn(`[GlobalExplorer] Invalid geometry for ${featureTitle(feature) || "unknown region"}`, feature);
  }
  return valid;
}

function collectPoints(geoJson, coordinateMode) {
  return (geoJson.features || [])
    .flatMap((feature) => collectRings(feature).flat())
    .map(([x, y]) => coordinateMode === "geo" ? [x, -y] : [x, y]);
}

function createProjection(geoJson, viewBox, coordinateMode) {
  if (coordinateMode !== "geo") {
    return ([x, y]) => [x, y];
  }

  const points = collectPoints(geoJson, coordinateMode);
  if (!points.length) return ([x, y]) => [x, -y];

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const boundsWidth = Math.max(maxX - minX, 1);
  const boundsHeight = Math.max(maxY - minY, 1);
  const box = parseViewBox(viewBox);
  const padding = Math.min(box.width, box.height) * 0.04;
  const scale = Math.min((box.width - padding * 2) / boundsWidth, (box.height - padding * 2) / boundsHeight);
  const offsetX = box.x + (box.width - boundsWidth * scale) / 2;
  const offsetY = box.y + (box.height - boundsHeight * scale) / 2;

  return ([x, y]) => {
    const projectedY = -y;
    return [
      offsetX + (x - minX) * scale,
      offsetY + (projectedY - minY) * scale
    ];
  };
}

function formatPoint([x, y]) {
  return `${Number(x).toFixed(2)},${Number(y).toFixed(2)}`;
}

function featureProperties(feature) {
  return feature?.properties || {};
}

function featureCode(feature) {
  const properties = featureProperties(feature);
  return properties.code
    || properties.regionCode
    || properties.REGION_CODE
    || properties.categoryCode
    || properties.id
    || properties.ISO_A3
    || properties.ADM1_PCODE
    || properties.ST_CODE
    || properties.name
    || properties.NAME
    || properties.ST_NM;
}

function featureTitle(feature) {
  const properties = featureProperties(feature);
  return properties.name
    || properties.label
    || properties.NAME
    || properties.ADMIN
    || properties.admin
    || properties.ST_NM
    || properties.NAME_1
    || properties.STATE
    || featureCode(feature);
}

function normalizeLookup(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return REGION_NAME_ALIASES[normalized] || normalized;
}

function slugRegionName(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveStaticRegionCode(map, feature) {
  const name = normalizeLookup(featureTitle(feature));
  if (map.key === "domestic") {
    return DOMESTIC_REGION_CODES_BY_NAME[name] || `DOM-${slugRegionName(name)}`;
  }
  if (map.key === "international") {
    return INTERNATIONAL_REGION_CODES_BY_NAME[name] || `INT-${slugRegionName(name)}`;
  }
  return undefined;
}

function formatRegionName(value) {
  return String(value || "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function featurePath(feature, projection) {
  return polygonRings(feature)
    .flatMap((polygon) => polygon.filter(isValidRing))
    .map((ring) => `M ${ring.map((point) => formatPoint(projection(point))).join(" L ")} Z`)
    .join(" ");
}

function featureCenter(feature, projection) {
  const points = collectRings(feature).flat();
  if (!points.length) return null;
  const projected = points.map((point) => projection(point));
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2
  ];
}

function fallbackRegionCenter(code, projection) {
  const coordinate = REGION_FALLBACK_COORDINATES[code];
  return coordinate ? projection(coordinate) : null;
}

function featureLabelPoint(feature, projection) {
  const configuredPoint = featureProperties(feature).labelPoint;
  if (Array.isArray(configuredPoint) && configuredPoint.length >= 2) {
    return projection(configuredPoint);
  }
  return featureCenter(feature, projection);
}

function flattenCategories(items = []) {
  return items.flatMap((item) => [item, ...flattenCategories(item.children || [])]);
}

export default function Click2Explore() {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const [geoDataByMap, setGeoDataByMap] = useState(() => (
    Object.fromEntries(MAPS.map((map) => [map.key, { geoJson: null, coordinateMode: "geo" }]))
  ));
  const [categoryTree, setCategoryTree] = useState([]);
  const [categoryLoadFailed, setCategoryLoadFailed] = useState(false);
  const [selectedByMap, setSelectedByMap] = useState({
    domestic: MAPS[0].defaultRegionCode,
    international: MAPS[1].defaultRegionCode
  });
  const [packagesByRegion, setPackagesByRegion] = useState({});
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packageLoadFailed, setPackageLoadFailed] = useState(false);

  const activeMap = MAPS[slideIndex];
  const activeGeoData = geoDataByMap[activeMap.key] || { geoJson: null, coordinateMode: "geo" };
  const activeGeoJson = activeGeoData.geoJson;
  const mapReady = Boolean(activeGeoJson?.features?.length);
  const showLandmass = Boolean(activeMap.landmassPath) && activeGeoData.coordinateMode !== "geo";
  const mapProjection = useMemo(
    () => createProjection(activeGeoJson || { features: [] }, activeMap.viewBox, activeGeoData.coordinateMode),
    [activeGeoJson, activeMap.viewBox, activeGeoData.coordinateMode]
  );
  const selectedRegionCode = selectedByMap[activeMap.key] || activeMap.defaultRegionCode;

  const categoriesByCode = useMemo(() => {
    return new Map(flattenCategories(categoryTree).map((category) => [category.code || category.categoryCode, category]));
  }, [categoryTree]);

  const categoriesByName = useMemo(() => {
    return new Map(
      flattenCategories(categoryTree)
        .filter((category) => category.name)
        .map((category) => [normalizeLookup(category.name), category])
    );
  }, [categoryTree]);

  const resolveFeatureCode = (feature) => {
    const directCode = featureCode(feature);
    if (directCode && categoriesByCode.has(directCode)) return directCode;
    if (typeof directCode === "string" && /^(DOM|INT)-/.test(directCode)) return directCode;

    const matchedByName = categoriesByName.get(normalizeLookup(featureTitle(feature)));
    if (matchedByName) return matchedByName.code || matchedByName.categoryCode;

    return resolveStaticRegionCode(activeMap, feature) || directCode;
  };

  const resolveFeatureName = (feature) => {
    const code = resolveFeatureCode(feature);
    return STATIC_REGION_NAMES_BY_CODE[code] || categoriesByCode.get(code)?.name || formatRegionName(featureTitle(feature));
  };

  const selectedFeature = useMemo(() => {
    return activeGeoJson?.features?.find((feature) => resolveFeatureCode(feature) === selectedRegionCode)
      || activeGeoJson?.features?.[0];
  }, [activeGeoJson, selectedRegionCode, categoriesByCode, categoriesByName]);

  const selectedRegionName = selectedFeature ? resolveFeatureName(selectedFeature) : activeMap.label;
  const packages = packagesByRegion[selectedRegionCode] || [];
  const { page, pageCount, pageItems, setPage } = usePagination(packages, 2);

  useEffect(() => {
    MAPS.forEach((map) => {
      if (!map.assetUrl) return;
      fetch(map.assetUrl, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("Map asset not found");
          return response.json();
        })
        .then((geoJson) => {
          if (!geoJson?.features?.length) return;
          const validFeatures = geoJson.features.filter((feature) => validateMapFeature(feature, map));
          if (!validFeatures.length) return;
          setGeoDataByMap((previous) => ({
            ...previous,
            [map.key]: {
              geoJson: { ...geoJson, features: validFeatures },
              coordinateMode: "geo"
            }
          }));
        })
        .catch(() => {
          console.warn(`[GlobalExplorer] Unable to load ${map.key} GeoJSON asset.`);
        });
    });
  }, []);

  useEffect(() => {
    publicCatalogService.getCategoryTree()
      .then((data) => {
        setCategoryTree(Array.isArray(data) ? data : []);
        setCategoryLoadFailed(false);
      })
      .catch(() => {
        setCategoryTree([]);
        setCategoryLoadFailed(true);
      });
  }, []);

  useEffect(() => {
    if (!selectedRegionCode) return;
    if (packagesByRegion[selectedRegionCode]) {
      setPackageLoadFailed(false);
      return;
    }

    let active = true;
    setLoadingPackages(true);
    setPackageLoadFailed(false);

    publicCatalogService.getPackages({ regionCode: selectedRegionCode })
      .then((data) => {
        if (!active) return;
        setPackagesByRegion((previous) => ({
          ...previous,
          [selectedRegionCode]: Array.isArray(data) ? data : []
        }));
      })
      .catch(() => {
        if (!active) return;
        setPackagesByRegion((previous) => ({ ...previous, [selectedRegionCode]: [] }));
        setPackageLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoadingPackages(false);
      });

    return () => {
      active = false;
    };
  }, [selectedRegionCode, packagesByRegion]);

  const changeSlide = (nextIndex) => {
    setSlideIndex((nextIndex + MAPS.length) % MAPS.length);
  };

  const selectRegion = (feature, mapKey = activeMap.key) => {
    const code = resolveFeatureCode(feature);
    if (!code) return;
    setSelectedByMap((previous) => ({
      ...previous,
      [mapKey]: code
    }));
  };

  return (
    <main className="global-explorer-page">
      <section className="explorer-hero">
        <div>
          <p className="explorer-eyebrow"><MdTravelExplore /> Curated travel atlas</p>
          <h1>Starry Nights Global Explorer</h1>
          <p>
            Navigate India and the world by region, then open a refined collection of journeys tailored to the place you select.
          </p>
        </div>
        <button type="button" className="explorer-back-btn" onClick={() => navigate(-1)}>Back</button>
      </section>

      <section className="explorer-workspace">
        <div className="explorer-map-panel">
          <div className="explorer-slider-header">
            <div className="explorer-mode-tabs" aria-label="Explorer map type">
              {MAPS.map((map, index) => (
                <button
                  type="button"
                  key={map.key}
                  className={index === slideIndex ? "active" : ""}
                  onClick={() => changeSlide(index)}
                >
                  <MdPublic />
                  {map.label}
                </button>
              ))}
            </div>

            <div className="explorer-arrows">
              <button type="button" onClick={() => changeSlide(slideIndex - 1)} aria-label="Previous map">
                <MdChevronLeft />
              </button>
              <button type="button" onClick={() => changeSlide(slideIndex + 1)} aria-label="Next map">
                <MdChevronRight />
              </button>
            </div>
          </div>

          <div className="explorer-slider-viewport">
            <article className="explorer-slide" key={activeMap.key}>
              <div className="explorer-map-copy">
                <span>{activeMap.eyebrow}</span>
                <h2>{activeMap.title}</h2>
                <p>{activeMap.description}</p>
              </div>

              <svg
                className={`explorer-map explorer-map--${activeMap.key}`}
                viewBox={activeMap.viewBox}
                role="img"
                aria-label={`${activeMap.label} region map`}
                preserveAspectRatio="xMidYMid meet"
              >
                <rect {...activeMap.backdrop} className="map-backdrop" style={{ "--map-bg": activeMap.background }} />
                {showLandmass && (
                  <path
                    className={`map-landmass map-landmass--${activeMap.key}`}
                    d={activeMap.landmassPath}
                  />
                )}
                {mapReady ? (
                <g className="map-regions-layer">
                  {activeGeoJson.features.map((feature, index) => {
                    const properties = featureProperties(feature);
                    const code = resolveFeatureCode(feature) || `${activeMap.key}-${index}`;
                    const isSelected = selectedByMap[activeMap.key] === code;
                    const name = resolveFeatureName(feature);
                    const useAssistedHitTarget = activeMap.key === "domestic" && SMALL_DOMESTIC_REGION_CODES.has(code);

                    return (
                      <g key={code} className="geo-region-group">
                        <path
                          d={featurePath(feature, mapProjection)}
                          className={`geo-region ${isSelected ? "selected" : ""}`}
                          style={{ "--region-fill": properties.color || REGION_COLOR_FALLBACKS[index % REGION_COLOR_FALLBACKS.length] }}
                          fillRule="evenodd"
                          clipRule="evenodd"
                          onClick={() => selectRegion(feature, activeMap.key)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectRegion(feature, activeMap.key);
                            }
                          }}
                          role={useAssistedHitTarget ? undefined : "button"}
                          tabIndex={useAssistedHitTarget ? undefined : 0}
                          aria-label={useAssistedHitTarget ? undefined : `Show packages for ${name}`}
                          aria-hidden={useAssistedHitTarget ? "true" : undefined}
                        />
                      </g>
                    );
                  })}
                  <g className="map-hit-targets-layer">
                    {activeGeoJson.features.map((feature, index) => {
                      const code = resolveFeatureCode(feature) || `${activeMap.key}-${index}`;
                      if (!(activeMap.key === "domestic" && SMALL_DOMESTIC_REGION_CODES.has(code))) return null;
                      const center =
                        featureCenter(feature, mapProjection) || fallbackRegionCenter(code, mapProjection);
                      if (!center) return null;
                      const name = resolveFeatureName(feature);
                      return (
                        <circle
                          key={`${code}-hit`}
                          className="geo-region-hit"
                          cx={center[0]}
                          cy={center[1]}
                          r={4.6}
                          onClick={() => selectRegion(feature, activeMap.key)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectRegion(feature, activeMap.key);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Show packages for ${name}`}
                        />
                      );
                    })}
                  </g>
                  <g className="india-label-layer" aria-hidden="true">
                    {activeMap.key === "domestic" && activeGeoJson.features.map((feature) => {
                      const point = featureLabelPoint(feature, mapProjection);
                      if (!point) return null;
                      return (
                        <text key={`${resolveFeatureCode(feature)}-label`} x={point[0]} y={point[1]}>
                          {resolveFeatureName(feature)}
                        </text>
                      );
                    })}
                  </g>
                </g>
                ) : (
                  <text className="map-loading-label" x="50%" y="50%">Loading map…</text>
                )}
              </svg>
            </article>
          </div>

          <div className="explorer-region-strip" aria-label={`${activeMap.label} regions`}>
            {(activeGeoJson?.features || []).map((feature) => {
              const code = resolveFeatureCode(feature);
              if (!code) return null;
              const isSelected = selectedRegionCode === code;
              return (
                <button
                  type="button"
                  key={code}
                  className={isSelected ? "active" : ""}
                  onClick={() => selectRegion(feature)}
                >
                  {resolveFeatureName(feature)}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="explorer-results-panel">
          <div className="explorer-results-header">
            <span>{activeMap.label}</span>
            <h2>{selectedRegionName}</h2>
            <p><MdLocationOn /> Region code: {selectedRegionCode}</p>
          </div>

          {categoryLoadFailed && (
            <div className="explorer-inline-note">
              Category tree could not be loaded. Static map regions are still available.
            </div>
          )}

          {packageLoadFailed && (
            <div className="explorer-inline-note">
              Packages could not be loaded for this region right now.
            </div>
          )}

          {loadingPackages ? (
            <div className="explorer-skeleton-grid" aria-label="Loading packages">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="explorer-skeleton-card" key={index} />
              ))}
            </div>
          ) : packages.length > 0 ? (
            <>
            <div className="explorer-package-grid">
              {pageItems.map((pkg) => {
                const packageCode = pkg.packageCode || pkg.code;
                return (
                  <article
                    className="explorer-package-card"
                    key={packageCode || pkg.id}
                    onClick={() => packageCode && navigate(`/package/${packageCode}`)}
                  >
                    <img
                      src={resolveAssetUrl(pkg.image || pkg.thumbnailUrl) || "/PackagecardFallback.png"}
                      alt={pkg.name || pkg.title || "Travel package"}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/PackagecardFallback.png";
                      }}
                    />
                    <div className="explorer-package-body">
                      <h3>{pkg.name || pkg.title || "Travel Package"}</h3>
                      <dl>
                        <div>
                          <dt>Duration</dt>
                          <dd>{pkg.duration || (pkg.days ? `${pkg.days} Days` : "Custom")}</dd>
                        </div>
                        <div>
                          <dt>Starting Price</dt>
                          <dd>{pkg.avgCost || "On request"}</dd>
                        </div>
                        <div>
                          <dt>Location</dt>
                          <dd>{pkg.location || pkg.pickup || selectedRegionName}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (packageCode) navigate(`/package/${packageCode}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={packages.length} label="packages" />
            </>
          ) : (
            <EmptyState
              title="No packages mapped yet"
              message={`No active packages are currently mapped to ${selectedRegionName}.`}
            />
          )}
        </aside>
      </section>
    </main>
  );
}
