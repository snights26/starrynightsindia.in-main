import "./MyFeed.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api, { resolveAssetUrl } from "../../utils/api";

export default function MyFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [photos, setPhotos] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [featureConsent, setFeatureConsent] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/get-photos?userId=${user?.userId || user?.email || ""}`)
      .then((data) => {
        const finalData = Array.isArray(data) ? data : [];
        finalData.sort((a, b) => Number(b.isApproved) - Number(a.isApproved));
        setPhotos(finalData);
      })
      .catch(() => setPhotos([]));
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = previewImage || showUpload ? "hidden" : "auto";
  }, [previewImage, showUpload]);

  const closeUpload = () => {
    setShowUpload(false);
    setFile(null);
    setTitle("");
    setFeatureConsent(false);
    setFormError("");
  };

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      setFormError("Title and image are required.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("title", title.trim());
    formData.append("userId", user?.userId || user?.email || "");
    formData.append("uploadedByType", "user");
    formData.append("isApproved", false);
    formData.append("featureConsent", featureConsent);
    formData.append("isFeatured", false);

    try {
      const newPhoto = await api.post("/upload-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPhotos((prev) => [newPhoto, ...prev]);
      setShowUpload(false);
      setFile(null);
      setTitle("");
      setFeatureConsent(false);
      setFormError("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("Upload error:", err);
      setFormError("Upload failed. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/delete-photo/${id}`);
    setPhotos((prev) => prev.filter((p) => (p._id || p.imageId || p.id) !== id));
  };

  return (
    <div className="mf-container">
      <div className="mf-header">
        <div className="mf-header-left">
          <button className="mf-back-btn" onClick={() => navigate("/dashboard")}>
            Back
          </button>

          <div>
            <h1 className="mf-title">Memories Vault</h1>
            <p className="mf-subtitle">Your cinematic gallery</p>
          </div>
        </div>

        <button className="mf-upload-btn" onClick={() => setShowUpload(true)}>
          + Upload
        </button>
      </div>

      {success && <div className="mf-success">Uploaded</div>}

      <div className="mf-masonry">
        {photos.map((item) => {
          const id = item._id || item.imageId || item.id;
          return (
            <div className="mf-masonry-item" key={id}>
              <img src={resolveAssetUrl(item.image || item.url)} alt="" onClick={() => setPreviewImage(item)} />

              <div className="mf-overlay">
                <h4>{item.title}</h4>
                <span className={`mf-status ${item.isApproved ? "approved" : "pending"}`}>
                  {item.isApproved ? "Approved" : "Pending"}
                </span>

                {!item.isApproved && (
                  <button
                    className="mf-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(id);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {previewImage && (
        <div className="mf-preview" onClick={() => setPreviewImage(null)}>
          <div className="mf-preview-content" onClick={(e) => e.stopPropagation()}>
            <span className="mf-close" onClick={() => setPreviewImage(null)}>x</span>
            <img src={resolveAssetUrl(previewImage.image || previewImage.url)} alt="" />
            <h3>{previewImage.title}</h3>
            <p className={`mf-status-big ${previewImage.isApproved ? "approved" : "pending"}`}>
              {previewImage.isApproved ? "Approved" : "Pending Approval"}
            </p>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="mf-upload-overlay" onClick={closeUpload}>
          <div className="mf-upload-box" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Memory</h3>
            <label className="mf-field-label" htmlFor="memory-title">
              Title <span>*</span>
            </label>
            <input
              id="memory-title"
              type="text"
              placeholder="Enter title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormError("");
              }}
            />

            <label className="mf-field-label" htmlFor="memory-image">
              Image <span>*</span>
            </label>
            <label className="mf-file-picker" htmlFor="memory-image">
              <input
                id="memory-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFile(e.target.files[0] || null);
                  setFormError("");
                }}
              />
              <span>{file ? file.name : "Choose image"}</span>
            </label>
            <p className="mf-field-help">Required for your memory gallery. JPG, PNG, and WebP are supported.</p>

            <label className="mf-consent-row">
              <input
                type="checkbox"
                checked={featureConsent}
                onChange={(e) => setFeatureConsent(e.target.checked)}
              />
              <span>Allow Starry Nights to review this image for public featuring.</span>
            </label>
            {formError && <p className="mf-form-error">{formError}</p>}
            <div className="mf-actions">
              <button onClick={handleUpload}>Submit</button>
              <button onClick={closeUpload}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
