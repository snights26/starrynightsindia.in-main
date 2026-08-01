import React from "react";
import "./PdfViewer.css";

export default function PdfViewer({ file, onClose }) {
 const viewerUrl = `${file}#toolbar=0&navpanes=0&scrollbar=1`;

  return (
    <div className="pdf-overlay" onClick={onClose}>
      <div
        className="pdf-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pdf-header">
          <button onClick={onClose}>✖ Close</button>
        </div>

        {/* PDF Viewer */}
        <iframe
  src={viewerUrl}
  title="PDF Viewer"
  width="100%"
  height="100%"
  style={{ border: "none" }}
/>
      </div>
    </div>
  );
}
