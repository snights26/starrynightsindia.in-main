import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import PackageCard from "../../components/Common/PackageCard";
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
  const rowId = location.state?.rowId;
  const categoryCode = location.state?.categoryCode;
  const pageTitle = location.state?.title || "All Packages";
  const stateItems = Array.isArray(location.state?.items) ? location.state.items : [];
  const statePackageCodes = Array.isArray(location.state?.packageCodes)
    ? location.state.packageCodes
    : stateItems.map(packageCodeOf).filter(Boolean);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const url = categoryCode
      ? `/packages?category=${categoryCode}`
      : rowId
      ? `/packages?rowId=${rowId}`
      : "/packages";
    api.get(url)
      .then((data) => setPackages(exactRowPackages(data, statePackageCodes, stateItems)))
      .catch(() => setPackages(packagesFromState(stateItems)));
  }, [rowId, categoryCode, location.key]);

  return (
    <div className="all-packages-page">
      <div className="all-packages-topbar">
        <h1 className="page-title">{pageTitle}</h1>
        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="packages-grid">
        {packages.map((pkg, idx) => (
          <PackageCard
            key={pkg.packageCode || idx}
            image={pkg.image}
            name={pkg.name || pkg.title}
            packageCode={pkg.packageCode}
          />
        ))}
      </div>
    </div>
  );
}
