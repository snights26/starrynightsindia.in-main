import { MdMap, MdTravelExplore } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./GlobalExplorerPromo.css";

export default function GlobalExplorerPromo() {
  const navigate = useNavigate();

  return (
    <section className="global-explorer-promo">
      <div className="global-explorer-promo__icon" aria-hidden="true">
        <MdMap />
      </div>
      <div className="global-explorer-promo__copy">
        <span>Curated travel atlas</span>
        <h2>Starry Nights Global Explorer</h2>
        <p>Discover handpicked journeys across India and the world, then explore packages refined for your chosen region.</p>
      </div>
      <button type="button" onClick={() => navigate("/global-explorer")}>
        <MdTravelExplore />
        Begin Exploring
      </button>
    </section>
  );
}
