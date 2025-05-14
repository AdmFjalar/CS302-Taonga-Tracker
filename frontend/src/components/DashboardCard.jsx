import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import "./DashboardCard.css"; 

const DashboardCard = ({ title }) => (
  <Card className="dashboard-card">
    <CardContent className="card-content">
      {title}
    </CardContent>
  </Card>
);

export default DashboardCard;