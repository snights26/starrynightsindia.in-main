import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext();

const WARNING_TIME = 30 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedPackages, setLikedPackages] = useState([]);
  const [likedPackageCodes, setLikedPackageCodes] = useState([]);
  const [likedPackagesLoading, setLikedPackagesLoading] = useState(false);
  const [likedPackagesSyncVersion, setLikedPackagesSyncVersion] = useState(0);
  const [pendingLikeCodes, setPendingLikeCodes] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [forceLogin, setForceLogin] = useState(false);

  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const pendingLikeCodesRef = useRef(new Set());

  const packageCode = (pkg) => String(pkg?.packageCode || pkg?.code || "").trim().toUpperCase();

  const applyLikedPackages = (packages) => {
    const nextPackages = Array.isArray(packages) ? packages : [];
    setLikedPackages(nextPackages);
    setLikedPackageCodes([...new Set(nextPackages.map(packageCode).filter(Boolean))]);
  };

  const clearLikedPackages = () => {
    applyLikedPackages([]);
    setLikedPackagesLoading(false);
    pendingLikeCodesRef.current.clear();
    setPendingLikeCodes([]);
  };

  const prepareLikedPackagesSync = () => {
    applyLikedPackages([]);
    setLikedPackagesLoading(true);
    setLikedPackagesSyncVersion((current) => current + 1);
  };

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
    clearLikedPackages();
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
    prepareLikedPackagesSync();
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
    } catch {
      logout(true);
    }
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("auth") || "null");
    if (stored) {
      if (stored.accessExpiry > Date.now()) {
        prepareLikedPackagesSync();
        setUser(stored.user);
        startTimers(stored);
        api.get("/users/me")
          .then((freshUser) => updateStoredUser(freshUser))
          .catch(() => {});
      } else if (stored.refreshExpiry > Date.now()) {
        refreshAccessToken(stored);
      } else {
        logout(true);
      }
    }
    setLoading(false);
    return () => clearTimers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap intentionally runs once

  useEffect(() => {
    if (!user?.id) {
      if (!loading) clearLikedPackages();
      return undefined;
    }

    let active = true;
    setLikedPackagesLoading(true);
    api.get("/users/me/bucket-list")
      .then((packages) => active && applyLikedPackages(packages))
      .catch(() => active && applyLikedPackages([]))
      .finally(() => active && setLikedPackagesLoading(false));
    return () => {
      active = false;
    };
  }, [user?.id, loading, likedPackagesSyncVersion]); // eslint-disable-line react-hooks/exhaustive-deps -- reloads are explicitly user/version keyed

  const toggleLikedPackage = async (value) => {
    const code = String(value || "").trim();
    const normalizedCode = code.toUpperCase();
    if (!user || !code || pendingLikeCodesRef.current.has(normalizedCode)) {
      return null;
    }

    pendingLikeCodesRef.current.add(normalizedCode);
    setPendingLikeCodes([...pendingLikeCodesRef.current]);
    try {
      const packages = await api.post(`/users/me/bucket-list/${encodeURIComponent(code)}`);
      applyLikedPackages(packages);
      return packages;
    } finally {
      pendingLikeCodesRef.current.delete(normalizedCode);
      setPendingLikeCodes([...pendingLikeCodesRef.current]);
    }
  };

  const googleLogin = async (idToken) => {
    const data = await api.post("/auth/google", { idToken });
    saveAuth(data);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        likedPackages,
        likedPackageCodes,
        likedPackagesLoading,
        pendingLikeCodes,
        toggleLikedPackage,
        googleLogin,
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

// This hook intentionally shares the provider module with AuthProvider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
