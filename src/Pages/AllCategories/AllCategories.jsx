import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import CategoryCard from "../../components/Common/CategoryCard";
import Pagination, { usePagination } from "../../components/Common/Pagination";
import "./AllCategories.css";

export default function AllCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = location.state?.title || "All Categories";
  const [categories, setCategories] = useState([]);
  const { page, pageCount, pageItems, setPage } = usePagination(categories, 12);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (location.state?.items?.length) {
      setCategories(location.state.items.map((item) => ({
        title: item.title || item.name || item.categoryName,
        code: item.code || item.id,
        image: item.image || item.thumbnailUrl,
      })));
      return;
    }
    api.get("/categories").then(setCategories).catch(() => setCategories([]));
  }, [location.state]);

  return (
    <div className="all-categories-page">
      <div className="all-categories-topbar">
        <h1 className="page-title">{pageTitle}</h1>
        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="categories-grid">
        {pageItems.map((cat, idx) => {
          const title = cat.title || cat.name || cat.categoryName;
          const code = cat.code || cat.categoryCode;
          return (
            <CategoryCard
              key={code || idx}
              title={title}
              image={cat.image || cat.thumbnailUrl}
              onClick={() => navigate("/all-packages", { state: { title, categoryCode: code } })}
            />
          );
        })}
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={categories.length} label="categories" />
    </div>
  );
}
