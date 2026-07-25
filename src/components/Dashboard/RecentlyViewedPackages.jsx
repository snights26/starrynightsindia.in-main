import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaClock, FaRegTrashAlt, FaTrash } from "react-icons/fa";
import { BackButton } from "../../common/buttons/AppButton";
import api, { resolveAssetUrl } from "../../utils/api";
import "./RecentlyViewedPackages.css";

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

  const goBack = () => {
    const historyIndex = window.history.state?.idx;
    let hasSameAppReferrer = false;

    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      hasSameAppReferrer = Boolean(
        referrer
        && referrer.origin === window.location.origin
        && referrer.pathname !== window.location.pathname
      );
    } catch {
      hasSameAppReferrer = false;
    }

    if ((typeof historyIndex === "number" && historyIndex > 0) || hasSameAppReferrer) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  const loadHistory = () => {
    setLoading(true);
    setActionError("");
    api.get("/package-views/me")
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {
        setHistory([]);
        setActionError("Unable to load your recently viewed packages. Please try again.");
      })
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
      <div className="recently-viewed-page__topbar">
        <BackButton className="recently-viewed-page__back" onClick={goBack}>
          <FaArrowLeft aria-hidden="true" /> Back
        </BackButton>
      </div>
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
          <div className="recently-viewed-empty">
            {history.length === 0
              ? "No recently viewed packages yet."
              : "No recently viewed packages match your search."}
          </div>
        )}
        {!loading && filteredHistory.map((item) => {
          const image = resolveAssetUrl(item.image || item.thumbnailUrl);
          const packageName = item.name || item.title || item.packageCode;
          return (
            <article
              className="recently-viewed-card"
              key={item.id || item.packageCode}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/package/${item.packageCode}`)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
                event.preventDefault();
                navigate(`/package/${item.packageCode}`);
              }}
            >
              <div className="recently-viewed-card__media">
                {image ? <img src={image} alt={packageName || "Package"} /> : <span>{(packageName || "P").charAt(0)}</span>}
                <button
                  type="button"
                  className="recently-viewed-card__remove"
                  onClick={(event) => removeOne(event, item.packageCode)}
                  disabled={busyCode === item.packageCode}
                  aria-label={`Remove ${packageName} from recently viewed`}
                >
                  <FaRegTrashAlt />
                </button>
              </div>
              <div className="recently-viewed-card__content">
                <span className="recently-viewed-card__code">{item.packageCode}</span>
                <h2 title={packageName}>{packageName}</h2>
                <div className="recently-viewed-card__viewed">
                  <span>Last viewed</span>
                  <time dateTime={item.lastViewedAt || undefined}>{formatViewedAt(item.lastViewedAt)}</time>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
