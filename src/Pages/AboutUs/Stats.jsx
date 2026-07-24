import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./Stats.css";

export default function Stats() {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(false);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;
    api.get("/homepage-statistics/public")
      .then((data) => {
        if (isCurrent) {
          setStats(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        console.error("Failed to load homepage statistics", error);
        if (isCurrent) {
          setStats([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const elements = sectionRef.current?.querySelectorAll(".stat-number") || [];
    const intervals = [];

    elements.forEach((el) => {
      const targetText = el.dataset.value;
      const num = parseFloat(targetText);
      const suffix = targetText.replace(/[0-9.]/g, "");

      if (!Number.isFinite(num)) {
        el.innerText = targetText;
        return;
      }

      let start = 0;
      const duration = 1500;
      const step = num / (duration / 20);

      const interval = setInterval(() => {
        start += step;
        if (start >= num) {
          el.innerText = targetText;
          clearInterval(interval);
        } else {
          el.innerText = Math.floor(start) + suffix;
        }
      }, 20);
      intervals.push(interval);
    });

    return () => intervals.forEach(clearInterval);
  }, [stats]);

  const handleClick = () => {
    setZoom(true);
    setTimeout(() => navigate("/about"), 500);
  };

  if (loading || stats.length === 0) return null;

  return (
    <div ref={sectionRef} className={`stats-section ${zoom ? "zoom-effect" : ""}`}>
      <div className="stats-grid">
        {stats.map((statistic) => (
          <div className="stat-circle" key={statistic.id}>
            <div className="stat-content">
              <h2 className="stat-number" data-value={statistic.value}>0</h2>
              <p>{statistic.title}</p>
            </div>

            {/* Orbit Dot */}
            <span className="dot"></span>
          </div>
        ))}
      </div>

      <button className="about-link-btn" onClick={handleClick}>
        Know More About Us →
      </button>
    </div>
  );
}
