import { useEffect, useState } from "react";
import "./Header.css";
import LoginPopup from "../AuthFolder/Login";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiHome, FiUser } from "react-icons/fi";
import { MdExplore } from "react-icons/md";     
import { FaPlane } from "react-icons/fa";      
import { useLocation } from "react-router-dom";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const normalizedPath = location.pathname.toLowerCase();
  const usesHeroHeader = normalizedPath === "/" || normalizedPath === "/careers";

  const { user, logout, forceLogin, setForceLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getScrollTop = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const handleScroll = () => setScrolled(getScrollTop() > 50);
    const scrollOptions = { passive: true, capture: true };
    handleScroll();
    const frameId = window.requestAnimationFrame(handleScroll);
    window.addEventListener("scroll", handleScroll, scrollOptions);
    document.addEventListener("scroll", handleScroll, scrollOptions);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll, scrollOptions);
      document.removeEventListener("scroll", handleScroll, scrollOptions);
    };
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = (menuOpen || showLogin) ? "hidden" : "auto";
  }, [menuOpen, showLogin]);

  useEffect(() => {
    if (forceLogin) {
      setShowLogin(true);
      setForceLogin(false);
    }
  }, [forceLogin]);

  return (
    <>
      <header className={`luxury-header ${usesHeroHeader ? "hero-header" : "inner-header"} ${scrolled ? "scrolled" : ""}`}>
        <div className="header-container">

          {/* LEFT SIDE */}
          <div className="header-left">
            <div
              className={`hamburger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </div>

              <div className="luxury-logo" onClick={() => navigate("/")}>
                <img 
                  src="/Starry-Nights-Header.png" 
                  alt="Starry Nights Logo" 
                  className="header-logo-img"
                />
              </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="nav-menu">
            <a href="/">Home</a>
            <a href="/trending">Trending</a>
            <a href="/gallery">Gallery</a>
            <a href="/updates">What's New</a>
            <a href="/about">About Us</a>
            <a href="/careers">Careers</a>
            <a href="/contact">Contact</a>
            <a href="/Enquiry" className="nav-cta">Enquire Now</a>
          </nav>

          {/* RIGHT SIDE */}
          <div className="desktop-auth">
  {user ? (
    <div className="profile-wrapper">
      <button
        type="button"
        className="profile-icon"
        title="Open profile"
        aria-label="Open profile dashboard"
        onClick={() => {
          setMenuOpen(false);
          navigate("/dashboard");
        }}
      >
        {user.name?.charAt(0).toUpperCase()}
      </button>
    </div>
  ) : (
    <button
      className="signin-btn"
      onClick={() => {
        setMenuOpen(false);
        setShowLogin(true);
      }}
    >
      Sign In
    </button>
  )}
</div>
        </div>
      </header>

      {/* SIDEBAR */}
      <div className={`sidebar ${menuOpen ? "active" : ""}`}>
        <a href="/"  className={location.pathname === "/" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>Home</a>
        <a href="/trending" className={location.pathname === "/trending" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>Trending</a>
        <a href="/gallery" className={location.pathname === "/gallery" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>Gallery</a>
        <a href="/updates" className={location.pathname === "/updates" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>What's New</a>
        <a href="/about" className={location.pathname === "/about" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>About Us</a>
        <a href="/careers" className={location.pathname === "/careers" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>Careers</a>
        <a href="/contact" className={location.pathname === "/contact" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>Contact</a>
        <a href="/Enquiry" className={location.pathname === "/Enquiry" ? "active-link" : ""} onClick={() => setMenuOpen(false)}>
          Enquire Now
        </a>
      </div>

      {/* OVERLAY */}
      <div
        className={`sidebar-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* 🔥 MOBILE BOTTOM NAV */}
      <div className="mobile-bottom-nav">

          <div 
            className={location.pathname === "/" ? "active-tab" : ""}
            onClick={() => navigate("/")}>
            <FiHome />
          </div>

          <div 
            className={location.pathname === "/trending" ? "active-tab" : ""}
            onClick={() => navigate("/trending")}>
            <MdExplore />
          </div>

          <div 
            className={`cta-icon ${location.pathname === "/Enquiry" ? "active-tab" : ""}`}
            onClick={() => navigate("/Enquiry")}>
            <FaPlane />
          </div>

          {user ? (
            <div 
              className={location.pathname === "/dashboard" ? "active-tab profile-tab" : "profile-tab"}
              onClick={() => navigate("/dashboard")}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div 
              className={location.pathname === "/login" ? "active-tab" : ""}
              onClick={() => setShowLogin(true)}>
              <FiUser />
            </div>
          )}

        </div>
      {showLogin && <LoginPopup onClose={() => setShowLogin(false)} />}
    </>
  );
}
