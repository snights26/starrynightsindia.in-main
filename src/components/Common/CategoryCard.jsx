import "./CategoryCard.css";
import { useState } from "react";
import { resolveAssetUrl } from "../../utils/api";

export default function CategoryCard({ title, image, onClick }) {
  const resolvedImage = resolveAssetUrl(image);
  const [imageAvailable, setImageAvailable] = useState(
    Boolean(resolvedImage) && !resolvedImage.includes("CategoryFallback")
  );
  const initial = (title || "Travel").trim().charAt(0).toUpperCase();

  return (
    <div className="category-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}>
      <div className="category-image-wrapper">
        <img
          src="/Starry Nights Holidays.png"
          alt="Starry Nights Holidays"
          className="category-corner-logo"
        />

        {imageAvailable ? (
          <img
            src={resolvedImage}
            alt={title}
            className="category-image"
            loading="lazy"
            onError={() => setImageAvailable(false)}
          />
        ) : (
          <div className="category-placeholder" aria-hidden="true">
            <span>{initial}</span>
          </div>
        )}
      </div>

      <div className="category-title">{title}</div>
    </div>
  );
}
