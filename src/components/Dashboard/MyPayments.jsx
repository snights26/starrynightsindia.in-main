import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./MyPayments.css";

export default function MyPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    api.get("/my-payments").then(setPayments).catch(() => setPayments([]));
  }, []);

  const grouped = Object.values(payments.reduce((acc, payment) => {
    const key = payment.bookingId || payment.tourId;
    if (!acc[key]) {
      acc[key] = { ...payment, paidAmount: 0 };
    }
    acc[key].paidAmount += Number(payment.amount || payment.paidAmount || 0);
    return acc;
  }, {}));

  return (
    <div className="payments-page">
      <div className="payments-topbar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>

      <div className="payments-header">
        <h1>My Payments</h1>
        <p>Manage your bookings, track payments & download invoices</p>
      </div>

      <div className="payments-card">
        <div className="payments-table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((booking) => {
                const dueAmount = Number(booking.totalAmount || 0) - Number(booking.paidAmount || 0);
                return (
                  <tr key={booking.bookingId || booking.tourId}>
                    <td className="id">{booking.bookingId || booking.tourId}</td>
                    <td>{booking.paymentDate}</td>
                    <td>{booking.totalAmount}</td>
                    <td>{booking.paidAmount}</td>
                    <td><span className={dueAmount > 0 ? "status pending" : "status paid"}>{dueAmount > 0 ? `Due ${dueAmount}` : "Paid"}</span></td>
                    <td><button className="invoice-btn" onClick={() => navigate(`/invoice/${booking.bookingId || booking.tourId}`)}>Download</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
