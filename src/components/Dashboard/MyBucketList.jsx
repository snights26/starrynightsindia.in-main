import { useEffect, useMemo, useRef, useState } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import PackageCard from "../Common/PackageCard";
import "./MyBucketList.css";

export default function MyBucketList() {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [search, setSearch] = useState("");
  const { likedPackages: packages, likedPackagesLoading } = useAuth();

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return packages;
    return packages.filter((pkg) => [pkg.name, pkg.title, pkg.packageCode, pkg.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)));
  }, [packages, search]);

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
          <p className="bucketlist-row__subtitle">Search through the packages you have saved.</p>
        </div>
        <label className="bucketlist-row__search">
          <span>Search saved packages</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by package name or code..."
          />
        </label>
      </div>

      <div className="bucketlist-row__scroll" ref={scrollRef} onScroll={handleScroll}>
        {filteredPackages.map((pkg, idx) => (
          <PackageCard key={pkg.packageCode || idx} image={pkg.image} name={pkg.name} packageCode={pkg.packageCode} />
        ))}
        {likedPackagesLoading && <div className="bucketlist-row__empty">Loading saved packages…</div>}
        {!likedPackagesLoading && filteredPackages.length === 0 && <div className="bucketlist-row__empty">No saved packages match your search.</div>}
      </div>

      {showRight && (
        <button className="bucketlist-row__btn bucketlist-row__btn--right" type="button" aria-label="Scroll right" onClick={() => scroll("right")}>
          <MdChevronRight />
        </button>
      )}
    </div>
  );
}
