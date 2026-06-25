import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import api from "../../utils/api";
import PackageCard from "../Common/PackageCard";
import "./PackagesShow.css";

export default function PackagesShow({ rowTitle = "Featured Tours" }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [packages, setPackages] = useState([]);
  const packageCodes = packages.map((pkg) => pkg.packageCode || pkg.code).filter(Boolean);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "right" ? 320 : -320,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    api.get("/first-row-tours/public")
      .then((rows) => setPackages(rows.map((row) => row.package)))
      .catch(() => setPackages([]));
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
    <div className="packages-show-container">
      {showLeft && (
        <button className="scroll-btn left" type="button" aria-label="Scroll left" onClick={() => scroll("left")}>
          <MdChevronLeft />
        </button>
      )}

      <div className="packages-header">
        <h2 className="row-title">{rowTitle}</h2>
        <button
          className="view-all-btn"
          onClick={() => navigate("/all-packages", {
            state: {
              title: rowTitle,
              items: packages,
              packageCodes,
            },
          })}
        >
          View All
        </button>
      </div>

      <div className="packages-scroll" ref={scrollRef} onScroll={handleScroll}>
        {packages.map((pkg, idx) => (
          <PackageCard
            key={pkg.packageCode || idx}
            image={pkg.image}
            name={pkg.name || pkg.title}
            packageCode={pkg.packageCode}
          />
        ))}
      </div>

      {showRight && (
        <button className="scroll-btn right" type="button" aria-label="Scroll right" onClick={() => scroll("right")}>
          <MdChevronRight />
        </button>
      )}
    </div>
  );
}
