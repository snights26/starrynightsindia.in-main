import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { resolveAssetUrl } from "../../utils/api";
import PackageCard from "./PackageCard";
import "./DetailPage.css";

export default function DetailPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [packageData, setPackageData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!code || code === "undefined") return;
    api.get(`/packages/${code}`).then(setPackageData).catch(() => setPackageData(null));
  }, [code]);

  useEffect(() => {
    if (isPaused || !packageData?.images?.length) return;
    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev === packageData.images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, packageData]);

  if (!code || code === "undefined" || code.trim() === "") {
    return <div className="detail-container"><h2>Package Code Missing</h2></div>;
  }

  if (!packageData) {
    return <div className="detail-container"><h2>Loading package...</h2></div>;
  }

  const images = packageData.images?.length
    ? packageData.images.map(resolveAssetUrl)
    : [resolveAssetUrl(packageData.thumbnailUrl) || "/PackagecardFallback.png"];
  const relatedPackages = packageData.relatedPackages || [];

  return (
    <div className="detail-container">
      <div className="detail-topbar">
        <button className="floating-back" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="detail-left">
        <div className="main-image" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <img key={selectedImage} src={images[selectedImage]} alt="package" className="fade-image" />
        </div>

        <div className="thumbnail-list">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="thumb"
              className={selectedImage === idx ? "active-thumb" : ""}
              onClick={() => setSelectedImage(idx)}
            />
          ))}
        </div>
      </div>

      <div className="detail-content">
        <h1>{packageData.name} - {packageData.code}</h1>
        <p className="region-category">{packageData.region} | {packageData.category}</p>

        <section>
          <h2>Overview</h2>
          <p>{packageData.overview}</p>
        </section>

        <section>
          <h2>Detailed Itinerary</h2>
          <ul>
            {(packageData.itinerary || []).map((day, idx) => (
              <li key={idx}>
                <strong>Day {day.day}: {day.title}</strong> - {day.description || day.desc}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Package Information</h2>
          <table className="info-table">
            <tbody>
              <tr><td>Best Time to Visit</td><td>{packageData.info?.bestTime}</td></tr>
              <tr><td>Average Cost</td><td>{packageData.info?.cost}</td></tr>
              <tr><td>Nearest Pickup</td><td>{packageData.info?.pickup}</td></tr>
              <tr><td>Climate</td><td>{packageData.info?.climate}</td></tr>
              <tr><td>Note</td><td>{packageData.info?.note}</td></tr>
              <tr><td>Suitable For</td><td>{packageData.info?.suitable}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="include-exclude">
          <div>
            <h2>Inclusions</h2>
            <ul>{(packageData.inclusions || []).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
          </div>
          <div>
            <h2>Exclusions</h2>
            <ul>{(packageData.exclusions || []).map((item, idx) => <li key={idx}>{item}</li>)}</ul>
          </div>
        </section>

        <section>
          <h2>Why Choose This Package?</h2>
          <p>{packageData.highlights || "Curated planning, verified partners, and reliable support."}</p>
        </section>

        <button className="book-now-btn" onClick={() => navigate("/Enquiry", { state: { destination: packageData.name } })}>
          Book Now
        </button>
      </div>

      <div className="detail-right">
        <h2 className="related-heading">Related Packages</h2>
        <div className="related-grid">
          {relatedPackages.map((pkg, index) => (
            <PackageCard
              key={pkg.packageCode || index}
              image={pkg.image}
              name={pkg.name}
              packageCode={pkg.packageCode || pkg.code}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
