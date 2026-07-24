import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaClock, FaRegTrashAlt, FaTrash } from "react-icons/fa";
import api, { resolveAssetUrl } from "../../utils/api";
import "./RecentlyViewedPackages.css";

const categoryNames = (pkg = {}, type) => Array.from(new Set((pkg.categories || [])
  .filter((category) => type === "parent" || category.isSubcategory)
  .map((category) => type === "parent" ? category.parentName : category.name)
  .filter(Boolean))).join(", ") || "Not assigned";

const formatViewedAt = (value) => value ? new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium", timeStyle: "short"
}).format(new Date(value)) : "Not available";

export default function RecentlyViewedPackages() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyCode, setBusyCode] = useState("");
  const [actionError, setActionError] = useState("");

  const loadHistory = () => {
    setLoading(true);
    api.get("/package-views/me")
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) => [item.name, item.title, item.packageCode, item.code]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [history, search]);

  const removeOne = async (event, packageCode) => {
    event.stopPropagation();
    setBusyCode(packageCode);
    setActionError("");
    try {
      await api.delete(`/package-views/me/${encodeURIComponent(packageCode)}`);
      setHistory((items) => items.filter((item) => item.packageCode !== packageCode));
    } catch {
      setActionError("Unable to remove this package from your recently viewed history. Please try again.");
    } finally {
      setBusyCode("");
    }
  };

  const clearAll = async () => {
    if (history.length === 0 || !window.confirm("Clear all recently viewed packages?")) return;
    setBusyCode("all");
    setActionError("");
    try {
      await api.delete("/package-views/me");
      setHistory([]);
    } catch {
      setActionError("Unable to clear your recently viewed history. Please try again.");
    } finally {
      setBusyCode("");
    }
  };

  return (
    <main className="recently-viewed-page">
      <header className="recently-viewed-page__header">
        <div>
          <span className="recently-viewed-page__eyebrow"><FaClock /> Your travel activity</span>
          <h1>Recently Viewed Packages</h1>
          <p>Pick up where you left off. Revisited packages stay at the top of the list.</p>
        </div>
        <div className="recently-viewed-page__actions">
          <label className="recently-viewed-page__search">
            <span>Search packages</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by package name or code"
            />
          </label>
          <button type="button" className="recently-viewed-page__clear" onClick={clearAll} disabled={busyCode === "all" || history.length === 0}>
            <FaTrash /> {busyCode === "all" ? "Clearing..." : "Clear history"}
          </button>
        </div>
      </header>

      <section className="recently-viewed-list" aria-live="polite">
        {actionError && <div className="recently-viewed-error" role="alert">{actionError}</div>}
        {loading && <div className="recently-viewed-empty">Loading your recently viewed packages...</div>}
        {!loading && filteredHistory.length === 0 && (
          <div className="recently-viewed-empty">No recently viewed packages match your search.</div>
        )}
        {!loading && filteredHistory.map((item) => {
          const image = resolveAssetUrl(item.image || item.thumbnailUrl);
          return (
            <article className="recently-viewed-card" key={item.id || item.packageCode} onClick={() => navigate(`/package/${item.packageCode}`)}>
              <div className="recently-viewed-card__media">
                {image ? <img src={image} alt={item.name || "Package"} /> : <span>{(item.name || "P").charAt(0)}</span>}
              </div>
              <div className="recently-viewed-card__content">
                <div>
                  <span className="recently-viewed-card__code">{item.packageCode}</span>
                  <h2>{item.name || item.title || item.packageCode}</h2>
                </div>
                <dl>
                  <div><dt>Parent category</dt><dd>{categoryNames(item, "parent")}</dd></div>
                  <div><dt>Last viewed</dt><dd>{formatViewedAt(item.lastViewedAt)}</dd></div>
                </dl>
              </div>
              <button type="button" className="recently-viewed-card__remove" onClick={(event) => removeOne(event, item.packageCode)} disabled={busyCode === item.packageCode} aria-label={`Remove ${item.name || item.packageCode} from history`}>
                <FaRegTrashAlt />
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
