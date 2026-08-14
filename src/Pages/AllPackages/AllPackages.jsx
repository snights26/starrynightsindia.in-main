import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { publicCatalogService } from "../../public-cache/publicData";
import PackageCard from "../../components/Common/PackageCard";
import Pagination, { usePagination } from "../../components/Common/Pagination";
import { brandBySlug } from "../../config/brands";
import "./AllPackages.css";

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

function packageCodeOf(item = {}) {
  return item.packageCode || item.code || item.id;
}

function itemToPackage(item = {}) {
  const code = packageCodeOf(item);
  const title = item.name || item.title || code || "Travel Package";
  return {
    ...item,
    code,
    packageCode: code,
    name: title,
    title,
    image: item.image || item.thumbnailUrl,
  };
}

function packagesFromState(items = []) {
  return items
    .map(itemToPackage)
    .filter((item) => item.packageCode);
}

function exactRowPackages(apiPackages = [], packageCodes = [], stateItems = []) {
  const orderedCodes = packageCodes.map(normalizeCode).filter(Boolean);
  if (!orderedCodes.length) {
    return Array.isArray(apiPackages) ? apiPackages : [];
  }

  const fallbackByCode = new Map(
    packagesFromState(stateItems).map((pkg) => [normalizeCode(pkg.packageCode), pkg])
  );
  const apiByCode = new Map(
    (Array.isArray(apiPackages) ? apiPackages : [])
      .map(itemToPackage)
      .filter((pkg) => orderedCodes.includes(normalizeCode(pkg.packageCode)))
      .map((pkg) => [normalizeCode(pkg.packageCode), pkg])
  );

  return orderedCodes
    .map((code) => apiByCode.get(code) || fallbackByCode.get(code))
    .filter(Boolean);
}

export default function AllPackages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandSlug } = useParams();
  const rowId = location.state?.rowId;
  const categoryCode = location.state?.categoryCode;
  const selectedBrand = brandBySlug(brandSlug);
  const selectedBrandName = selectedBrand?.brandName || "";
  const isBrandRoute = Boolean(brandSlug);
  const pageTitle = isBrandRoute
    ? selectedBrand?.title || "Brand Packages"
    : location.state?.title || "All Packages";
  const stateItems = Array.isArray(location.state?.items) ? location.state.items : [];
  const statePackageCodes = Array.isArray(location.state?.packageCodes)
    ? location.state.packageCodes
    : stateItems.map(packageCodeOf).filter(Boolean);
  const [packages, setPackages] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return packages;
    return packages.filter((pkg) => JSON.stringify(pkg).toLowerCase().includes(query));
  }, [packages, searchQuery]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredPackages, 12);

  useEffect(() => setPage(1), [searchQuery, setPage]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isBrandRoute && !selectedBrand) {
      setPackages([]);
      return;
    }

    publicCatalogService.getPackages({
      brand: selectedBrandName || undefined,
      category: categoryCode || undefined,
      rowId: rowId || undefined,
    })
      .then((data) => setPackages(exactRowPackages(data, statePackageCodes, stateItems)))
      .catch(() => setPackages(packagesFromState(stateItems)));
  }, [rowId, categoryCode, brandSlug, selectedBrandName, location.key]);

  return (
    <div className="all-packages-page">
      <div className="all-packages-topbar">
        <h1 className="page-title">{pageTitle}</h1>
        <div className="catalogue-actions">
          <form
            className="catalogue-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchQuery(searchInput);
            }}
          >
            <label className="catalogue-search__label" htmlFor="package-search">Search packages</label>
            <input
              id="package-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, code, destination…"
            />
            <button type="submit">Search</button>
            {searchQuery && <button type="button" className="catalogue-search__clear" onClick={() => { setSearchInput(""); setSearchQuery(""); }}>Clear</button>}
          </form>
          <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {filteredPackages.length > 0 ? (
        <div className="packages-grid">
          {pageItems.map((pkg, idx) => (
            <PackageCard
              key={pkg.packageCode || idx}
              image={pkg.image}
              name={pkg.name || pkg.title}
              packageCode={pkg.packageCode}
            />
          ))}
        </div>
      ) : (
        <div className="packages-empty-state" role="status">
          {isBrandRoute
            ? "No packages available for this brand."
            : searchQuery
              ? "No packages match your search."
              : "No packages are available right now."}
        </div>
      )}
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredPackages.length} label="packages" />
    </div>
  );
}
