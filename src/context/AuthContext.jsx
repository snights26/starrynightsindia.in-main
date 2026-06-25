import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext();

const WARNING_TIME = 30 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [forceLogin, setForceLogin] = useState(false);

  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const logout = (auto = false) => {
    clearTimers();
    const stored = JSON.parse(localStorage.getItem("auth") || "null");
    if (stored?.refreshToken) {
      api.post("/auth/logout", { refreshToken: stored.refreshToken }).catch(() => {});
    }
    localStorage.removeItem("auth");
    setUser(null);
    setShowWarning(false);
    if (auto) setForceLogin(true);
  };

  const startTimers = (storedData) => {
    clearTimers();
    const timeLeft = storedData.accessExpiry - Date.now();

    if (timeLeft <= 0) {
      logout(true);
      return;
    }

    const warningDelay = Math.max(timeLeft - WARNING_TIME, 0);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningDelay);

    logoutTimerRef.current = setTimeout(() => {
      const latest = JSON.parse(localStorage.getItem("auth") || "null");
      if (!latest || latest.accessExpiry <= Date.now()) {
        logout(true);
      }
    }, timeLeft);
  };

  const saveAuth = (data) => {
    const authData = {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessExpiry: new Date(data.accessTokenExpiresAt).getTime(),
      refreshExpiry: new Date(data.refreshTokenExpiresAt).getTime(),
    };

    localStorage.setItem("auth", JSON.stringify(authData));
    setUser(data.user);
    setShowWarning(false);
    setCountdown(30);
    setForceLogin(false);
    startTimers(authData);
    return authData;
  };

  const updateStoredUser = (nextUser) => {
    const stored = JSON.parse(localStorage.getItem("auth") || "null");
    if (!stored) return;
    const authData = { ...stored, user: { ...stored.user, ...nextUser } };
    localStorage.setItem("auth", JSON.stringify(authData));
    setUser(authData.user);
    startTimers(authData);
  };

  const refreshAccessToken = async (storedDataParam) => {
    clearTimers();
    const stored = storedDataParam || JSON.parse(localStorage.getItem("auth") || "null");
    if (!stored?.refreshToken) return logout(true);

    try {
      const data = await api.post("/auth/refresh", { refreshToken: stored.refreshToken });
      saveAuth(data);
    } catch (error) {
      logout(true);
    }
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("auth") || "null");
    if (stored) {
      if (stored.accessExpiry > Date.now()) {
        setUser(stored.user);
        startTimers(stored);
        if (stored.user?.profileCompleted === undefined) {
          api.get("/users/me")
            .then((freshUser) => updateStoredUser(freshUser))
            .catch(() => {});
        }
      } else if (stored.refreshExpiry > Date.now()) {
        refreshAccessToken(stored);
      } else {
        logout(true);
      }
    }
    setLoading(false);
    return () => clearTimers();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post("/auth/login", { email, username: email, password });
      saveAuth(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  const googleLogin = async (idToken) => {
    const data = await api.post("/auth/google", { idToken });
    saveAuth(data);
    return data.user;
  };

  const register = async (payload) => {
    const data = await api.post("/auth/register", payload);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        googleLogin,
        register,
        logout,
        loading,
        showWarning,
        refreshAccessToken,
        updateStoredUser,
        countdown,
        forceLogin,
        setForceLogin,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
