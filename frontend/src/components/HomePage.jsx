import React from "react";
import Sidebar from "./SideBar";
import Header from "./Header";
import DashboardCard from "./DashboardCard";

const MainContent = () => (
  <main className="main-content">
    <DashboardCard title="Oldest Recorded Heirloom - Name/Date" />
    <DashboardCard title="Family Tree: Oldest Relative recorded" />
  </main>
);

const HomePage = () => (
  <div className="layout">
    <Sidebar />
    <div className="content-wrapper">
      <Header />
      <MainContent />
    </div>
  </div>
);