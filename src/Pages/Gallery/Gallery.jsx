import { useState, useEffect } from "react";
import "./Gallery.css";
import { resolveAssetUrl } from "../../utils/api";
import { publicContentService } from "../../public-cache/publicData";

const IMAGES_PER_PAGE = 7;
const INITIAL_VISIBLE_IMAGES = IMAGES_PER_PAGE * 3;

export default function Gallery({ images = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_IMAGES);
  const [galleryImages, setGalleryImages] = useState(images);

  useEffect(() => {
    publicContentService.getGallery()
      .then((data) => setGalleryImages(data.map((item) => resolveAssetUrl(item.image || item.url))))
      .catch(() => setGalleryImages(images));
  }, [images]);

  /* Scroll lock */
  useEffect(() => {
    document.body.style.overflow = selectedImage ? "hidden" : "auto";
  }, [selectedImage]);

  /* ESC close */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const loadMore = () => {
    setVisibleCount((prev) => prev + IMAGES_PER_PAGE);
  };

  return (
    <div className="gallery-section">
      <h2 className="gallery-title">
        <span className="brand-red">Starry</span> Nights Gallery
      </h2>

      <div className="gallery-grid">
        {galleryImages.slice(0, visibleCount).map((img, index) => (
          <div
            key={index}
            className="gallery-card"
            onClick={() => setSelectedImage(img)}
          >
            <img src={img} alt="gallery" loading="lazy" />
          </div>
        ))}
      </div>

      {/* Load More */}
      {visibleCount < galleryImages.length && (
        <div className="load-more-wrapper">
          <button className="load-more-btn" onClick={loadMore}>
            Load More
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedImage && (
        <div className="modal-overlay">
          <button
            className="modal-close"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>

          <img
            src={selectedImage}
            alt="expanded"
            className="modal-image"
          />
        </div>
      )}
    </div>
  );
}
