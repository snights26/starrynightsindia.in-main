import "./CategoryCard.css";
import { resolveAssetUrl } from "../../utils/api";

export default function CategoryCard({ title, image, onClick }) {
  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-image-wrapper">
        <img
          src="/Starry Nights Holidays.png"
          alt="Starry Nights Holidays"
          className="category-corner-logo"
        />

        <img
          src={resolveAssetUrl(image) || "/CategoryFallback.png"}
          alt={title}
          className="category-image"
          loading="lazy"
        />
      </div>

      <div className="category-title">{title}</div>
    </div>
  );
}
