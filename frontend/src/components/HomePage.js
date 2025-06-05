import React from "react";
import Sidebar from "./SideBar";
import Header from "./Header";
import "./HomePage.css";


const HomePage = () => (
  <div className="layout">
    <Sidebar />
    <div className="content-wrapper">
      <Header />
    </div>
  </div>
);

export default HomePage;