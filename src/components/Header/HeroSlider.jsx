import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveAssetUrl } from "../../utils/api";
import { publicContentService } from "../../public-cache/publicData";
import "./HeroSlider.css";

export default function HeroSlider() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const pointerStart = useRef(null);

  const changeSlide = (nextIndex) => {
    if (!slides.length) return;
    setIndex((nextIndex + slides.length) % slides.length);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    // Do not capture pointers that belong to the slide's controls. Native
    // button/link clicks must remain available for indicators and CTAs.
    if (event.target.closest("button, a")) return;
    pointerStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    setIsInteracting(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const finishPointerInteraction = (event) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    setIsInteracting(false);

    if (!start || start.id !== event.pointerId || !slides.length) return;

    const horizontalDistance = event.clientX - start.x;
    const verticalDistance = event.clientY - start.y;
    const minimumSwipeDistance = Math.max(50, event.currentTarget.clientWidth * 0.08);

    if (Math.abs(horizontalDistance) >= minimumSwipeDistance && Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
      changeSlide(index + (horizontalDistance < 0 ? 1 : -1));
    }
  };

  const cancelPointerInteraction = () => {
    pointerStart.current = null;
    setIsInteracting(false);
  };

  useEffect(() => {
    publicContentService.getHero()
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
    if (!slides.length || isInteracting) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length, isInteracting]);

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
      className={`hero-slider ${isInteracting ? "is-dragging" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerUp={finishPointerInteraction}
      onPointerCancel={cancelPointerInteraction}
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
          <button
            key={i}
            type="button"
            className={i === index ? "active" : ""}
            onClick={() => changeSlide(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
