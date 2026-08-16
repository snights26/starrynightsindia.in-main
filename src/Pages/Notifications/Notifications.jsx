import React, { useState } from "react";
import "./Notifications.css";
import PdfViewer from "./pdfViewer";
import api, { resolveAssetUrl } from "../../utils/api";

export default function Notifications() {
  const [selectedType, setSelectedType] = useState("");
  const [activePDF, setActivePDF] = useState(null);
  const [items, setItems] = useState([]);

  React.useEffect(() => {
    api.get("/notifications/public")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const filteredData = selectedType
    ? items.filter(item => item.type === selectedType)
    : items;

  return (
    <div className="ns-container">

      {/* Header */}
      <div className="ns-header">
        <h2 className="ns-title">What's New</h2>

        <select
          className="ns-dropdown"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All</option>
          <option value="press">Press Release</option>
          <option value="promotion">Brand Promotion</option>
          <option value="offer">Offers / Discounts</option>
          <option value="alert">Travel Alert</option>
          <option value="event">Event / Festival</option>
        </select>
      </div>

      {/* Cards */}
      <div className="ns-grid">
        {filteredData.map((item) => {
          const pdfUrl = resolveAssetUrl(item.pdfUrl || item.pdf);
          return (
          <div
            key={item.id}
            className="ns-card"
            onClick={() => pdfUrl && setActivePDF(pdfUrl)}
          >
            <div className="ns-image-wrapper">
              <img src={resolveAssetUrl(item.image)} alt={item.title} />
            </div>

            <div className="ns-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
          );
        })}
      </div>

      {/* 🔥 PDF MODAL */}
      {activePDF && (
  <PdfViewer
    file={activePDF}
    onClose={() => setActivePDF(null)}
  />
)}
    </div>
  );
}
