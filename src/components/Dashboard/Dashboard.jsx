// src/components/Dashboard/Dashboard.jsx
import { useEffect } from "react";
import "./Dashboard.css";
import MyBucketList from "./MyBucketList";
import MyTours from "./MyTours";
import DashboardSidePanel from "./DashboardSidePanel";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { dashboardLoading, completeDashboardLoading } = useAuth();

  useEffect(() => {
    // The sign-in overlay should only cover the route transition. Individual
    // dashboard requests have their own loading and error states; waiting for
    // every request here can leave the entire screen blocked forever when one
    // endpoint is slow or unavailable.
    if (dashboardLoading) {
      completeDashboardLoading();
    }
  }, [dashboardLoading, completeDashboardLoading]);

  return (
    <>
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
