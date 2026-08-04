import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import CategoryCard from "../../components/Common/CategoryCard";
import Pagination, { usePagination } from "../../components/Common/Pagination";
import "./AllCategories.css";

export default function AllCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const drilldownCategoryCode = location.state?.drilldownCategoryCode;
  const pageTitle = location.state?.title || "All Categories";
  const stateItems = location.state?.items;
  const [categories, setCategories] = useState([]);
  const rowCategories = useMemo(() => (
    Array.isArray(stateItems)
      ? stateItems.map((item) => ({
        title: item.title || item.name || item.categoryName,
        code: item.code || item.id,
        image: item.image || item.thumbnailUrl,
      }))
      : []
  ), [stateItems]);
  const displayedCategories = !drilldownCategoryCode && rowCategories.length
    ? rowCategories
    : categories;
  const [resolvedDrilldownCode, setResolvedDrilldownCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const isResolvingDrilldown = Boolean(
    drilldownCategoryCode && resolvedDrilldownCode !== drilldownCategoryCode
  );
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displayedCategories;
    return displayedCategories.filter((category) => JSON.stringify(category).toLowerCase().includes(query));
  }, [displayedCategories, searchQuery]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredCategories, 12);

  useEffect(() => setPage(1), [searchQuery, setPage]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (drilldownCategoryCode) {
      let isCurrent = true;

      api.get("/categories/tree")
        .then((tree) => {
          if (!isCurrent) return;
          const parent = (Array.isArray(tree) ? tree : []).find(
            (category) => (category.code || category.categoryCode) === drilldownCategoryCode
          );

          if (parent) {
            setCategories((parent.children || []).map((item) => ({
              title: item.title || item.name || item.categoryName,
              code: item.code || item.categoryCode || item.id,
              image: item.image || item.thumbnailUrl,
            })));
            setResolvedDrilldownCode(drilldownCategoryCode);
            return;
          }

          navigate("/all-packages", {
            replace: true,
            state: { title: pageTitle, categoryCode: drilldownCategoryCode },
          });
        })
        .catch(() => {
          if (isCurrent) {
            setCategories([]);
            setResolvedDrilldownCode(drilldownCategoryCode);
          }
        });

      return () => {
        isCurrent = false;
      };
    }

    if (rowCategories.length) return;
    api.get("/categories").then(setCategories).catch(() => setCategories([]));
  }, [drilldownCategoryCode, location.key, navigate, pageTitle, rowCategories]);

  return (
    <div className="all-categories-page">
      <div className="all-categories-topbar">
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
            <label className="catalogue-search__label" htmlFor="category-search">Search categories</label>
            <input
              id="category-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name or category code…"
            />
            <button type="submit">Search</button>
            {searchQuery && <button type="button" className="catalogue-search__clear" onClick={() => { setSearchInput(""); setSearchQuery(""); }}>Clear</button>}
          </form>
          <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {isResolvingDrilldown ? (
        <div className="categories-empty-state" role="status">Loading subcategories...</div>
      ) : (
        <>
          <div className="categories-grid">
            {pageItems.map((cat, idx) => {
              const title = cat.title || cat.name || cat.categoryName;
              const code = cat.code || cat.categoryCode;
              return (
                <CategoryCard
                  key={code || idx}
                  title={title}
                  image={cat.image || cat.thumbnailUrl}
                  onClick={() => navigate("/all-categories", {
                    state: { title, drilldownCategoryCode: code },
                  })}
                />
              );
            })}
          </div>
          {filteredCategories.length === 0 && <div className="categories-empty-state">{searchQuery ? "No categories match your search." : "No subcategories are available."}</div>}
          <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredCategories.length} label="categories" />
        </>
      )}
    </div>
  );
}
