import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { GOOGLE_AUTH_ENABLED, GOOGLE_CLIENT_ID } from "../../config/authConfig";

export default function LoginPopup({ onClose }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [googleStatus, setGoogleStatus] = useState(GOOGLE_CLIENT_ID ? "loading" : "unconfigured");

  useEffect(() => {
    if (!GOOGLE_AUTH_ENABLED || !GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      setGoogleStatus("unconfigured");
      return;
    }

    let cancelled = false;
    setGoogleStatus("loading");

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      try {
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              if (!credential) throw new Error("Missing Google credential");
              await googleLogin(credential);
              onClose();
              navigate("/dashboard");
            } catch (error) {
              console.error("Google Login failed", error);
              alert(error?.response?.data?.message || "Google Login failed");
            }
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "filled_black",
          size: "large",
          type: "standard",
          text: "continue_with",
          width: 320,
        });
        setGoogleStatus("ready");
      } catch (error) {
        console.error("Google button render failed", error);
        setGoogleStatus("error");
      }
    };

    const existing = document.querySelector("script[src='https://accounts.google.com/gsi/client']");
    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }
    if (existing) {
      existing.addEventListener("load", renderGoogleButton);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", renderGoogleButton);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) setGoogleStatus("error");
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, [googleLogin, navigate, onClose]);

  return (
    <div className="netflix-modal-overlay" onClick={onClose}>
      <section
        className="netflix-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-sign-in-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="netflix-modal-glow" aria-hidden="true" />
        <button className="netflix-close" type="button" onClick={onClose} aria-label="Close sign in dialog">
          <span aria-hidden="true">×</span>
        </button>

        <div className="netflix-auth-brand" aria-label="Starry Nights">
          <span className="netflix-auth-brand-mark" aria-hidden="true">✦</span>
          <img
            src="/Starry-Nights-Header.png"
            className="netflix-auth-logo"
            alt="Starry Nights"
          />
        </div>

        <h1 id="google-sign-in-title">Welcome back</h1>
        <p className="google-only-auth-copy">Sign in to save your journeys, favourites, and travel plans.</p>

        {GOOGLE_AUTH_ENABLED && GOOGLE_CLIENT_ID ? (
          <div className="google-login-wrapper">
            <div className="google-login-slot" ref={googleButtonRef} />
            {googleStatus === "loading" && (
              <div className="google-login-status">Loading Google sign-in...</div>
            )}
            {googleStatus === "error" && (
            <div className="google-login-status error">
              Google sign-in could not load. Check the Google OAuth JavaScript origin.
            </div>
            )}
          </div>
        ) : (
          <button className="google-login-btn google-login-unavailable" type="button" disabled>
            Google Sign-In disabled
          </button>
        )}
        <p className="netflix-auth-footnote">Secure sign-in powered by Google</p>
      </section>
    </div>
  );
}
