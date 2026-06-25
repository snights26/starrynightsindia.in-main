import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import "./MyTours.css";

export default function MyTours() {
  const { user } = useAuth();
  const [tours, setTours] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/mytours?email=${encodeURIComponent(user?.email || "")}`)
      .then(setTours)
      .catch(() => setTours([]));
  }, [user]);

  return (
    <div className="mytours-container">
      <h2>My Tours</h2>
      <div className="mytours-table-wrapper">
        <table className="mytours-table">
          <thead>
            <tr>
              <th>Tour ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Contact</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {tours.length > 0 ? (
              tours.map((t) => (
                <tr key={t.tourId || t.id}>
                  <td>{t.tourId || t.id}</td>
                  <td>{t.packageName || t.name}</td>
                  <td>{t.date || t.pickupDate}</td>
                  <td>{t.contact || t.mobile}</td>
                  <td>{t.driver || t.driverName}</td>
                  <td>{t.vehicle || t.vehicleCategory}</td>
                  <td><button className="view-btn" onClick={() => navigate(`/transport-slip/${t.tourId || t.id}`)}>View</button></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: "center" }}>No tours found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
