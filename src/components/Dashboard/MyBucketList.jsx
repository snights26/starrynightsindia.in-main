import { useEffect, useMemo, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import api from "../../utils/api";
import PackageCard from "../Common/PackageCard";
import PackageCategoryFilters, { packageMatchesCategoryFilters } from "./PackageCategoryFilters";
import "./MyBucketList.css";

export default function MyBucketList() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [packages, setPackages] = useState([]);
  const [filters, setFilters] = useState({ parentCode: "", subcategoryCode: "" });

  const filteredPackages = useMemo(() => packages.filter((pkg) => packageMatchesCategoryFilters(
    pkg, filters.parentCode, filters.subcategoryCode
  )), [filters, packages]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction === "right" ? 320 : -320, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    api.get("/users/me/bucket-list").then(setPackages).catch(() => setPackages([]));
  }, []);

  useEffect(() => {
    const update = () => handleScroll();
    const timer = window.setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [filteredPackages.length]);

  return (
    <div className="bucketlist-row">
      {showLeft && (
        <button className="bucketlist-row__btn bucketlist-row__btn--left" type="button" aria-label="Scroll left" onClick={() => scroll("left")}>
          <MdChevronLeft />
        </button>
      )}

      <div className="bucketlist-row__header">
        <div>
          <h2 className="bucketlist-row__title">My Bucket List</h2>
          <p className="bucketlist-row__subtitle">Filter packages by the categories you care about.</p>
        </div>
        <PackageCategoryFilters {...filters} onChange={setFilters} />
      </div>

      <div className="bucketlist-row__scroll" ref={scrollRef} onScroll={handleScroll}>
        {filteredPackages.map((pkg, idx) => (
          <PackageCard key={pkg.packageCode || idx} image={pkg.image} name={pkg.name} packageCode={pkg.packageCode} />
        ))}
        {filteredPackages.length === 0 && <div className="bucketlist-row__empty">No packages found for the selected filters.</div>}
      </div>

      {showRight && (
        <button className="bucketlist-row__btn bucketlist-row__btn--right" type="button" aria-label="Scroll right" onClick={() => scroll("right")}>
          <MdChevronRight />
        </button>
      )}
    </div>
  );
}
