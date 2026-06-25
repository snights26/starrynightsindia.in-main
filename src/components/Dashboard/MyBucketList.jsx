import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import api from "../../utils/api";
import PackageCard from "../Common/PackageCard";
import "./MyBucketList.css";

export default function MyBucketList() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [packages, setPackages] = useState([]);

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
  }, [packages.length]);

  return (
    <div className="bucketlist-row">
      {showLeft && (
        <button className="bucketlist-row__btn bucketlist-row__btn--left" type="button" aria-label="Scroll left" onClick={() => scroll("left")}>
          <MdChevronLeft />
        </button>
      )}

      <div className="bucketlist-row__header">
        <h2 className="bucketlist-row__title">My Bucket List</h2>
        <button className="bucketlist-row__view-all" onClick={() => navigate("/all-packages", { state: { title: "My Bucket List" } })}>
          View All
        </button>
      </div>

      <div className="bucketlist-row__scroll" ref={scrollRef} onScroll={handleScroll}>
        {packages.map((pkg, idx) => (
          <PackageCard key={pkg.packageCode || idx} image={pkg.image} name={pkg.name} packageCode={pkg.packageCode} />
        ))}
      </div>

      {showRight && (
        <button className="bucketlist-row__btn bucketlist-row__btn--right" type="button" aria-label="Scroll right" onClick={() => scroll("right")}>
          <MdChevronRight />
        </button>
      )}
    </div>
  );
}
