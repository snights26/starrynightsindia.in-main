import React from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaInstagram, FaLinkedin } from "react-icons/fa";
import "./Footer.css";
import { FOOTER_BRANDS } from "../../config/brands";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="snf-brands-strip">
        <p className="snf-brands-title">Our Brands</p>

        <div className="snf-brands-row">
          {FOOTER_BRANDS.map((brand) => (
            <Link key={brand.slug} className="snf-brand" to={`/brands/${brand.slug}`}>
              <img src={brand.logo} alt={brand.title} />
              <div className="snf-brand-info">
                <h5>{brand.title}</h5>
                <p>{brand.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="footer-container">
        <div className="footer-col">
          <img
            src="/Starry Nights Holidays.png"
            alt="Starry Nights Holidays"
            className="footer-logo"
          />
          <p className="footer-description">
            Curated travel experiences. Premium weekend escapes crafted for unforgettable memories.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/all-packages">Packages</Link>
          <Link to="/all-categories">Categories</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="footer-col">
          <h4>Legal &amp; Policies</h4>
          <nav className="footer-legal-links" aria-label="Legal and policy links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            <Link to="/cancellation-refund-policy">Cancellation &amp; Refund Policy</Link>
            <Link to="/payment-policy">Payment Policy</Link>
            <Link to="/service-delivery-policy">Service Delivery Policy</Link>
          </nav>
        </div>

        <div className="footer-col footer-contact">
          <h4>Contact</h4>
          <a href="tel:+918847755042">+91 884 7755 042</a>
          <a href="tel:+919284137430">+91 928 4137 430</a>
          <a href="mailto:travelwithstarrynights@gmail.com">travelwithstarrynights@gmail.com</a>
          <a href="https://maps.app.goo.gl/XdpxF664BZL1MYHx6" target="_blank" rel="noopener noreferrer">
            Branch-1: Pune Bangalore Highway, Chandani Chowk, Pune
          </a>
          <a href="https://maps.app.goo.gl/XdpxF664BZL1MYHx6" target="_blank" rel="noopener noreferrer">
            Branch-2: HUDCO Bus Stop, Nanded
          </a>

          <div className="footer-social">
            <a href="https://wa.me/message/UTCOF3APCTTKP1" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <FaWhatsapp className="social-icon" />
            </a>
            <a href="https://www.instagram.com/starrynights.india" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <FaInstagram className="social-icon" />
            </a>
            <a href="https://www.linkedin.com/in/darshan-shinde-831410327/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin className="social-icon" />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {currentYear} Starry Nights Holidays. Explore Beyond Limits.
      </div>
    </footer>
  );
}
