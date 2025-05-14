import React from "react";
import { Button } from "@/components/ui/button";
import "./SideBar.css"; 

const Sidebar = () => (
  <aside className="sidebar">
    <div>
      <h1 className="sidebar-title">Taonga Trove</h1>
      <nav className="sidebar-nav">
        <a href="#" className="nav-link-active">Home Page</a>
        <a href="#" className="nav-link">Heirlooms</a>
        <a href="#" className="nav-link">Family Tree</a>
        <a href="#" className="nav-link">Settings</a>
      </nav>
    </div>
    <Button className="signout-button">
      Sign Out
    </Button>
  </aside>
);

export default Sidebar;
