import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveAssetUrl } from "../../utils/api";
import "./HeroSlider.css";

export default function HeroSlider() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const handleTouchStart = (e) => {
    setIsSwiping(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    setIsSwiping(false);
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !slides.length) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      setIndex((prev) => diff > 0 ? (prev + 1) % slides.length : (prev - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    api.get("/hero-sliders/public")
      .then((data) => {
        const mappedSlides = Array.isArray(data)
          ? data
            .map((item) => ({
              id: item.imageId || item.id,
              image: resolveAssetUrl(item.image || item.imageUrl),
              title: item.title,
              subtitle: item.subtitle || "",
              link: item.linkUrl || item.link || "/global-explorer",
            }))
            .filter((item) => item.image)
          : [];
        setSlides(mappedSlides);
      })
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (index >= slides.length) {
      setIndex(0);
    }
  }, [index, slides.length]);

  useEffect(() => {
    if (!slides.length || isSwiping) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides, isSwiping]);

  const openSlideLink = (link) => {
    if (!link) {
      navigate("/global-explorer");
      return;
    }

    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
      return;
    }

    navigate(link.startsWith("/") ? link : `/${link}`);
  };

  return (
    <div
      className="hero-slider"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img src="/Starry Nights Holidays.png" alt="Starry Nights Holidays" className="hero-corner-logo" />

      {slides.length === 0 && (
        <div className="hero-slider-empty-state">
          <div className="overlay"></div>
          <div className="hero-text">
            <h1>Curated Journeys, Crafted Around You</h1>
            <p>Explore domestic escapes and international experiences with Starry Nights.</p>
            <button type="button" onClick={() => navigate("/global-explorer")}>Explore Now</button>
          </div>
        </div>
      )}

      {slides.map((slide, i) => (
        <div key={slide.id || slide.image || i} className={`slide ${i === index ? "active" : ""}`}>
          <img src={slide.image} alt={slide.title || ""} />
          <div className="overlay"></div>

          {i === index && (
            <div className="hero-text">
              <h1>{slide.title}</h1>
              {slide.subtitle && <p>{slide.subtitle}</p>}
              <button type="button" onClick={() => openSlideLink(slide.link)}>Explore Now</button>
            </div>
          )}
        </div>
      ))}

      <div className="slider-indicators">
        {slides.map((_, i) => (
          <span key={i} className={i === index ? "active" : ""} onClick={() => setIndex(i)}></span>
        ))}
      </div>
    </div>
  );
}
