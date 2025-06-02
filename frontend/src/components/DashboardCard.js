import React from "react";
import "./DashboardCard.css";

const DashboardCard = ({ title }) => (
  <div className="dashboard-card">
    <div className="card-content">
      {title}
    </div>
  </div>
);

export default DashboardCard;