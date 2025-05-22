import React from "react";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          <img src="/logo-white.png" alt="Mentar" />
          <span className="navbar-title">Mentar</span>
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
