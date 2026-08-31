// src/components/Dashboard/Dashboard.jsx
import { useEffect, useState } from "react";
import "./Dashboard.css";
import MyBucketList from "./MyBucketList";
import MyTours from "./MyTours";
import DashboardSidePanel from "./DashboardSidePanel";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { dashboardLoading, likedPackagesLoading, completeDashboardLoading } = useAuth();
  const [toursReady, setToursReady] = useState(false);
  const [notificationsReady, setNotificationsReady] = useState(false);

  useEffect(() => {
    if (dashboardLoading && !likedPackagesLoading && toursReady && notificationsReady) {
      completeDashboardLoading();
    }
  }, [dashboardLoading, likedPackagesLoading, toursReady, notificationsReady, completeDashboardLoading]);

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-main">
          <MyBucketList />
          <MyTours onReady={setToursReady} />
        </div>

        <DashboardSidePanel onReady={setNotificationsReady} />
      </div>
    </>
  );
}
