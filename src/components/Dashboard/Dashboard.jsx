// src/components/Dashboard/Dashboard.jsx
import "./Dashboard.css";
import MyBucketList from "./MyBucketList";
import MyTours from "./MyTours";
import DashboardSidePanel from "./DashboardSidePanel";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {

  const { showWarning, refreshAccessToken, countdown } = useAuth();

  return (
    <>
   {showWarning && (
  <div className="session-overlay">
    <div className="session-modal">
      <h2>Adventure Paused?</h2>
      <p className="countdown">
  Session expires in {countdown} seconds
</p>
      

      <div className="session-actions">
        <button className="stay-btn" onClick={() => refreshAccessToken()}>
          Stay Logged In
        </button>
      </div>
    </div>
  </div>
)}

      <div className="dashboard-container">
        <div className="dashboard-main">
          <MyBucketList />
          <MyTours />
        </div>

        <DashboardSidePanel />
      </div>
    </>
  );
}
