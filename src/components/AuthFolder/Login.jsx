import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { GOOGLE_AUTH_ENABLED, GOOGLE_CLIENT_ID } from "../../config/authConfig";

export default function LoginPopup({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const [googleStatus, setGoogleStatus] = useState(GOOGLE_CLIENT_ID ? "loading" : "unconfigured");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (await login(email, password)) {
      onClose();
      navigate("/dashboard");
    } else {
      alert("Wrong Email or Password");
    }
  };

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
          theme: "outline",
          size: "large",
          type: "standard",
          text: "signin_with",
          width: 270,
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
      <div className="netflix-modal-box" onClick={(e) => e.stopPropagation()}>
        <span className="netflix-close" onClick={onClose}>x</span>

        <h1>Sign In</h1>

        <form onSubmit={handleLogin}>
          <div className="netflix-input">
            <input
              type="email"
              required
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email or phone number</label>
          </div>

          <div className="netflix-input">
            <input
              type="password"
              required
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>Password</label>
          </div>

          <button className="netflix-login-btn">Sign In</button>
        </form>

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

        <div className="netflix-options">
          <label><input type="checkbox" /> Remember me</label>
          <span>Need help?</span>
        </div>

        <p className="netflix-signup">
          New to Starry Nights?{" "}
          <span onClick={() => {
            onClose();
            navigate("/create-user");
          }}>
            Sign up now
          </span>
        </p>
      </div>
    </div>
  );
}
