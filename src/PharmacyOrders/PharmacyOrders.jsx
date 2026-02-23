// src/Pages/OrdersDashboard.jsx
import React, { useEffect, useState } from "react";
import API from "../api/api";
import "./PharmacyOrders.css";

const PharmacyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("new"); // new / accepted / rejected
  const [loading, setLoading] = useState(true);

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders"); // Replace with your endpoint
      setOrders(res.data); // Expected format: [{ id, patientName, paymentMethod, prescriptionUrl, status }]
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, email) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status: newStatus });

      // Update frontend state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
      );

      if (newStatus === "accepted") {
        // Send email to user
        await API.post(`/send-order-email`, { orderId, email });
      }
    } catch (err) {
      console.error("Failed to update order status", err);
      alert("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (tab === "new") return o.status === "pending";
    if (tab === "accepted") return o.status === "accepted";
    if (tab === "rejected") return o.status === "rejected";
    return true;
  });

  const countNewOrders = orders.filter(o => o.status === "pending").length;

  return (
    <div className="orders-dashboard">
      <h2>Orders & Prescriptions {countNewOrders > 0 && `(${countNewOrders})`}</h2>

      <div className="tabs">
        <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}>
          New Orders
        </button>
        <button className={tab === "accepted" ? "active" : ""} onClick={() => setTab("accepted")}>
          Accepted Orders
        </button>
        <button className={tab === "rejected" ? "active" : ""} onClick={() => setTab("rejected")}>
          Rejected Orders
        </button>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : (
        <div className="orders-list">
          {filteredOrders.length === 0 && <p>No orders in this tab.</p>}

          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`order-card ${order.status === "pending" ? "highlight" : ""}`}
            >
              <h4>{order.patientName}</h4>
              <p>Payment Method: {order.paymentMethod}</p>

              <div className="order-buttons">
                {order.prescriptionUrl && (
                  <a href={order.prescriptionUrl} target="_blank" rel="noreferrer">
                    <button>View Prescription</button>
                  </a>
                )}
                <button onClick={() => alert(JSON.stringify(order, null, 2))}>
                  View Order Detail
                </button>
                {order.status === "pending" && (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => handleUpdateStatus(order.id, "accepted", order.userEmail)}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleUpdateStatus(order.id, "rejected")}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyOrders;