import { useEffect, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import api from "../../utils/api";
import PackageCard from "../Common/PackageCard";
import "./TopTen.css";

export default function TopTen({ row = null }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [topTenPackages, setTopTenPackages] = useState([]);
  const gap = 160;

  const checkScrollPosition = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.querySelector(".topten-card-wrapper");
    const scrollAmount = (card?.offsetWidth || 240) + gap;
    container.scrollBy({ left: direction === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
  };

  const handleMouseDown = (e) => {
    const slider = scrollRef.current;
    setIsDragging(true);
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const slider = scrollRef.current;
    const x = e.pageX - slider.offsetLeft;
    slider.scrollLeft = scrollLeft - (x - startX) * 1.2;
  };

  useEffect(() => {
    if (row) {
      setTopTenPackages(Array.isArray(row.items) ? row.items : []);
      return undefined;
    }

    api.get("/top10/public")
      .then((rows) => setTopTenPackages(rows.map((row) => row.package)))
      .catch(() => setTopTenPackages([]))
      .finally(checkScrollPosition);
    return undefined;
  }, [row]);

  useEffect(() => {
    const update = () => checkScrollPosition();
    const timer = window.setTimeout(update, 0);
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [topTenPackages.length]);

  return (
    <div className="topten-container">
      <h2 className="topten-title">{row?.rowTitle || row?.title || "Top 10 Destinations in India"}</h2>

      {showLeft && (
        <button className="topten-scroll-btn left" type="button" aria-label="Scroll left" onClick={() => scroll("left")}>
          <MdChevronLeft />
        </button>
      )}

      <div
        className="topten-scroll"
        ref={scrollRef}
        onScroll={checkScrollPosition}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => setIsDragging(false)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
      >
        {topTenPackages.map((pkg, idx) => (
          <div className="topten-card-wrapper" key={pkg.packageCode || idx}>
            <div className={`topten-index ${idx + 1 >= 10 ? "double-digit" : ""}`}>{idx + 1}</div>
            <PackageCard image={pkg.image} name={pkg.name || pkg.title} packageCode={pkg.packageCode} />
          </div>
        ))}
      </div>

      {showRight && (
        <button className="topten-scroll-btn right" type="button" aria-label="Scroll right" onClick={() => scroll("right")}>
          <MdChevronRight />
        </button>
      )}
    </div>
  );
}
