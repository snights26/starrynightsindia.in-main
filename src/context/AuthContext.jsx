import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext();

const ACCESS_TOKEN_REFRESH_LEAD_TIME = 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedPackages, setLikedPackages] = useState([]);
  const [likedPackageCodes, setLikedPackageCodes] = useState([]);
  const [likedPackagesLoading, setLikedPackagesLoading] = useState(false);
  const [likedPackagesSyncVersion, setLikedPackagesSyncVersion] = useState(0);
  const [pendingLikeCodes, setPendingLikeCodes] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);

  const accessRefreshTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const pendingLikeCodesRef = useRef(new Set());
  const likedPackagesRef = useRef([]);

  const packageCode = (pkg) => String(
    typeof pkg === "string" ? pkg : pkg?.packageCode || pkg?.code || "",
  ).trim().toUpperCase();

  const applyLikedPackages = (packages) => {
    const nextPackages = Array.isArray(packages) ? packages : [];
    likedPackagesRef.current = nextPackages;
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
    if (accessRefreshTimerRef.current) clearTimeout(accessRefreshTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
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
    setDashboardLoading(false);
    if (auto) setForceLogin(true);
  };

  const startTimers = (storedData) => {
    clearTimers();
    const deviceSessionTimeLeft = storedData.refreshExpiry - Date.now();

    if (deviceSessionTimeLeft <= 0) {
      logout(true);
      return;
    }

    const accessRefreshDelay = Math.max(Math.min(
      storedData.accessExpiry - Date.now() - ACCESS_TOKEN_REFRESH_LEAD_TIME,
      deviceSessionTimeLeft,
    ), 0);

    // Access tokens stay short-lived while the current browser has a fixed seven-day session.
    accessRefreshTimerRef.current = setTimeout(() => {
      const latest = JSON.parse(localStorage.getItem("auth") || "null");
      if (latest?.refreshExpiry > Date.now()) {
        refreshAccessToken(latest);
      } else {
        logout(true);
      }
    }, accessRefreshDelay);

    logoutTimerRef.current = setTimeout(() => {
      logout(true);
    }, deviceSessionTimeLeft);
  };

  const saveAuth = (data, { prepareDashboard = false } = {}) => {
    const authData = {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessExpiry: new Date(data.accessTokenExpiresAt).getTime(),
      refreshExpiry: new Date(data.refreshTokenExpiresAt).getTime(),
    };

    localStorage.setItem("auth", JSON.stringify(authData));
    if (prepareDashboard) setDashboardLoading(true);
    prepareLikedPackagesSync();
    setUser(data.user);
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

  const toggleLikedPackage = async (value, packageSummary) => {
    const code = String(value || "").trim();
    const normalizedCode = code.toUpperCase();
    if (!user || !code || pendingLikeCodesRef.current.has(normalizedCode)) {
      return null;
    }

    const previousPackages = likedPackagesRef.current;
    const existingPackage = previousPackages.find((pkg) => packageCode(pkg) === normalizedCode);
    const alreadyLiked = Boolean(existingPackage);
    const optimisticPackage = {
      ...(packageSummary || {}),
      packageCode: normalizedCode,
      code: normalizedCode,
      name: packageSummary?.name || packageSummary?.title || normalizedCode,
      title: packageSummary?.title || packageSummary?.name || normalizedCode,
      image: packageSummary?.image || packageSummary?.thumbnailUrl || "",
    };

    pendingLikeCodesRef.current.add(normalizedCode);
    setPendingLikeCodes([...pendingLikeCodesRef.current]);
    applyLikedPackages(
      alreadyLiked
        ? previousPackages.filter((pkg) => packageCode(pkg) !== normalizedCode)
        : [...previousPackages, optimisticPackage],
    );

    try {
      const packages = await api.post(`/users/me/bucket-list/${encodeURIComponent(code)}`);
      // Keep any other in-flight heart action visible. The last outstanding
      // request reconciles the list with the authoritative server response.
      if (pendingLikeCodesRef.current.size === 1) {
        applyLikedPackages(packages);
      }
      return packages;
    } catch (error) {
      const currentPackages = likedPackagesRef.current;
      applyLikedPackages(
        alreadyLiked
          ? (currentPackages.some((pkg) => packageCode(pkg) === normalizedCode)
            ? currentPackages
            : [...currentPackages, existingPackage])
          : currentPackages.filter((pkg) => packageCode(pkg) !== normalizedCode),
      );
      throw error;
    } finally {
      pendingLikeCodesRef.current.delete(normalizedCode);
      setPendingLikeCodes([...pendingLikeCodesRef.current]);
    }
  };

  const googleLogin = async (idToken) => {
    const data = await api.post("/auth/google", { idToken });
    saveAuth(data, { prepareDashboard: true });
    return data.user;
  };

  const completeDashboardLoading = () => setDashboardLoading(false);

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
        dashboardLoading,
        completeDashboardLoading,
        refreshAccessToken,
        updateStoredUser,
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
