import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import CategoryCard from "./CategoryCard";
import PackageCard from "./PackageCard";
import TopTen from "../Rows/TopTen";
import "./DynamicRow.css";

export default function DynamicRow({ row }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const isCategory = row.rowType === "category" || row.type === "category";
  const isTopTen = row.rowType === "top10" || row.type === "top10";
  const items = row.items || [];
  const packageCodes = items
    .map((item) => item.packageCode || item.code || item.id)
    .filter(Boolean);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const update = () => handleScroll();
    const timer = window.setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [items.length]);

  if (isTopTen) {
    return <TopTen row={row} />;
  }

  return (
    <div className="dr-row">
      {showLeft && (
        <button className="dr-btn left" type="button" aria-label="Scroll left" onClick={() => scroll("left")}>
          <MdChevronLeft />
        </button>
      )}

      <div className="dr-header">
        <h2 className="dr-title">{row.rowTitle || row.title}</h2>
        <button
          className="dr-view-all"
          onClick={() => navigate(isCategory ? "/all-categories" : "/all-packages", {
            state: {
              rowId: row.rowId,
              title: row.rowTitle || row.title,
              type: row.rowType || row.type,
              items,
              packageCodes: isCategory ? [] : packageCodes,
            },
          })}
        >
          View All <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="dr-scroll" ref={scrollRef} onScroll={handleScroll}>
        {items.map((item, idx) => {
          const code = item.packageCode || item.code || item.id;
          if (isCategory) {
            return (
              <CategoryCard
                key={code || idx}
                title={item.title || code}
                image={item.image || item.thumbnailUrl}
                onClick={() => navigate("/all-categories", {
                  state: {
                    title: item.title || code,
                    drilldownCategoryCode: code,
                  },
                })}
              />
            );
          }
          return (
            <PackageCard
              key={code || idx}
              name={item.title || `Package ${code}`}
              image={item.image || item.thumbnailUrl}
              packageCode={code}
            />
          );
        })}
      </div>

      {showRight && (
        <button className="dr-btn right" type="button" aria-label="Scroll right" onClick={() => scroll("right")}>
          <MdChevronRight />
        </button>
      )}
    </div>
  );
}
