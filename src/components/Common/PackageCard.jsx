import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api, { resolveAssetUrl } from "../../utils/api";
import "./PackageCard.css";

export default function PackageCard({ image, name, packageCode }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  const handleClick = () => {
    if (!packageCode) return;
    navigate(`/package/${packageCode}`);
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add favourites");
      return;
    }

    try {
      await api.post(`/users/me/bucket-list/${packageCode}`);
      setIsFav((prev) => !prev);
    } catch {
      toast.error("Unable to update favourites");
    }
  };

  return (
    <div className="package-card" onClick={handleClick}>
      <div className="package-image-wrapper">
        <img src="/Starry Nights Holidays.png" alt="logo" className="package-corner-logo" />

        <div className="favorite-btn" onClick={handleFavorite}>
          {isFav ? <FaHeart className="heart active" /> : <FaRegHeart className="heart" />}
        </div>

        <img
          src={resolveAssetUrl(image) || "/PackagecardFallback.png"}
          alt={name || "Travel Package"}
          className="package-image"
          loading="lazy"
        />
      </div>

      <div className="package-name">{name || "Travel Package"}</div>
    </div>
  );
}
