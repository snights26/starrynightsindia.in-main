import React, { useState, useEffect } from "react";
import "./Contact.css";
import api from "../../utils/api";
import { isBlank, isValidPhoneNumber, normalizePhoneNumber } from "../../utils/formValidation";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const value = e.target.name === "phone" ? normalizePhoneNumber(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isBlank(formData.name) || isBlank(formData.email) || isBlank(formData.phone) || isBlank(formData.message)) {
      alert("Please complete all fields before sending your message.");
      return;
    }

    if (!isValidPhoneNumber(formData.phone)) {
      alert("Enter a valid 10-digit phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/contact", formData);
      setShowToast(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch {
      alert("Unable to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Auto hide toast */
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="contact-page">

      {/* HERO */}
      <div className="contact-hero">
        <h1>
          <span className="brand-red">Starry Nights </span> Holidays
        </h1>
        <p>Journey Beyound The Horizon...</p>
      </div>

      <div className="contact-container">

        {/* LEFT SIDE */}
        <div className="contact-info">
          <h2>Get In Touch</h2>

          <a href="tel:+918847755042">
            +91 884 7755 042
          </a>

          <a href="mailto:travelwithstarrynights@gmail.com">
            travelwithstarrynights@gmail.com
          </a>

          <a
            href="https://maps.app.goo.gl/GXgD98K8cMPDhbS69"
            target="_blank"
            rel="noopener noreferrer"
          >
            Starry Nights Tours & Adventures  
          </a>

          {/* Embedded Map (HUDCO Nanded) */}
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps?q=Starry+Nights+Tours+and+Adventures+HUDCO+Nanded+431603&output=embed"
              title="Starry Nights HUDCO Nanded"
              loading="lazy"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="contact-form">
          <h2>Send Us a Message</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              title="Enter a 10-digit phone number"
              required
            />

            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>

            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? "Sending message…" : "Send Message"}
            </button>
          </form>
        </div>

      </div>

      {/* SUCCESS TOAST */}
      <div className={`toast ${showToast ? "show" : ""}`}>
         ✔ Message Sent Successfully
      </div>

    </div>
  );
}
