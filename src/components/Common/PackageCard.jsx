import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { resolveAssetUrl } from "../../utils/api";
import "./PackageCard.css";

export default function PackageCard({ image, name, packageCode, onPackageOpen }) {
  const navigate = useNavigate();
  const { user, likedPackageCodes, likedPackagesLoading, pendingLikeCodes, toggleLikedPackage } = useAuth();
  const normalizedPackageCode = String(packageCode || "").trim().toUpperCase();
  const isFav = likedPackageCodes.includes(normalizedPackageCode);
  const isPending = pendingLikeCodes.includes(normalizedPackageCode);

  const handleClick = () => {
    if (!packageCode) return;
    navigate(`/package/${packageCode}`);
    onPackageOpen?.();
  };

  const handleFavorite = async (e) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to add favourites");
      return;
    }

    if (likedPackagesLoading || isPending) return;

    try {
      await toggleLikedPackage(packageCode, {
        packageCode,
        code: packageCode,
        name,
        title: name,
        image,
      });
    } catch {
      toast.error("Unable to update favourites");
    }
  };

  return (
    <div className="package-card" onClick={handleClick}>
      <div className="package-image-wrapper">
        <img src="/Starry Nights Holidays.png" alt="logo" className="package-corner-logo" />

        <button
          type="button"
          className="package-card__favorite"
          onClick={handleFavorite}
          disabled={Boolean(user && (likedPackagesLoading || isPending))}
          aria-label={isFav ? "Remove from liked packages" : "Add to liked packages"}
          title={isFav ? "Remove from liked packages" : "Add to liked packages"}
        >
          {user && likedPackagesLoading ? <FaSpinner className="package-card__favorite-icon package-card__favorite-icon--loading" /> : isFav ? <FaHeart className="package-card__favorite-icon package-card__favorite-icon--active" /> : <FaRegHeart className="package-card__favorite-icon" />}
        </button>

        <img
          src={resolveAssetUrl(image) || "/PackagecardFallback.png"}
          alt={name || "Travel Package"}
          className="package-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/PackagecardFallback.png";
          }}
        />
      </div>

      <div className="package-name">{name || "Travel Package"}</div>
    </div>
  );
}
