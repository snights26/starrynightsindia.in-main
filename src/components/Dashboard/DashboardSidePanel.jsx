import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCreditCard, FaEnvelope, FaHistory, FaImage } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api, { resolveAssetUrl } from "../../utils/api";
import "./DashboardSidePanel.css";

const DEFAULT_PROFILE_IMAGE = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function DashboardSidePanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    api.get("/notifications/me").then(setNotifications).catch(() => setNotifications([]));
  }, []);

  const openProfile = () => navigate("/complete-profile");
  const profileImage = resolveAssetUrl(user?.photo || user?.profileImageUrl || user?.profileImage) || DEFAULT_PROFILE_IMAGE;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard-side">
      <div className="side-profile-card">
        <div
          className="side-profile-summary"
          role="link"
          tabIndex={0}
          title="Open profile"
          onClick={openProfile}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openProfile();
            }
          }}
        >
          <div className="side-profile-img">
            <img
              src={profileImage}
              alt={user?.name || "User profile"}
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
              }}
            />
          </div>

          <div className="side-profile-info">
            <h3>{user?.name || "Guest User"}</h3>
            <p className="side-user-id">User ID: <strong>{user?.userId || user?.id || "Not available"}</strong></p>
            <p>{user?.email || "No Email"}</p>
            <p>{user?.mobile || user?.contact || "No Mobile"}</p>
          </div>
        </div>

        <div className="side-profile-status-row">
          {!user?.profileCompleted && (
            <button className="side-profile-note" type="button" onClick={() => navigate("/complete-profile")}>
              Profile pending. Add details when ready.
            </button>
          )}

          <button className="side-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="side-card clickable" onClick={() => navigate("/recently-viewed-packages")}><FaHistory /> Recently Viewed Packages</div>
      <div className="side-card clickable" onClick={() => navigate("/myfeed")}><FaImage /> MY Gallery</div>
      <div className="side-card clickable" onClick={() => navigate("/payments")}><FaCreditCard /> Payments</div>
      <div className="side-card"><FaEnvelope /> Enquiry</div>

      <div className="side-card notification-card">
        <div className="notification-header" onClick={() => setShowNotif(!showNotif)} style={{ cursor: "pointer" }}>
          Notifications <span className="notification-count"> {notifications.length}</span>
        </div>
        {showNotif && (
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notification">No Notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="notification-item" onClick={() => setSelectedNotif(n)}>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message || n.description}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedNotif && (
        <div className="notif-popup-overlay" onClick={() => setSelectedNotif(null)}>
          <div className="notif-popup" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedNotif.title}</h2>
            <p>{selectedNotif.message || selectedNotif.description}</p>
            {selectedNotif.image && <img src={selectedNotif.image} alt="" className="notif-popup-img" />}
            {selectedNotif.pdf && (
              <a href={selectedNotif.pdf} target="_blank" rel="noopener noreferrer" className="notif-download-btn">Download PDF</a>
            )}
            <button className="notif-close-btn" onClick={() => setSelectedNotif(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
