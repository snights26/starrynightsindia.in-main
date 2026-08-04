import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import HeroSlider from "./components/Header/HeroSlider";
import DynamicRowsContainer from "./components/Rows/DynamicRowsContainer";
import Stats from "./Pages/AboutUs/Stats";
import Footer from "./components/Header/Footer";
import GlobalExplorerPromo from "./Pages/Click2Explore/GlobalExplorerPromo";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/AuthFolder/PrivateRoute";
import ProfileCompletionGuard from "./components/AuthFolder/ProfileCompletionGuard";
import Chatbot from "./components/Chatbot/Chatbot";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "./components/ScrollToTop";
import { CustomAlertProvider, ThemeProvider, ThemeToggle } from "./common";
import "./theme-overrides.css";

// Route-only modules (including PDF and dashboard code) must not inflate the
// homepage download. Each module is loaded only after its route is opened.
const AllPackages = lazy(() => import("./Pages/AllPackages/AllPackages"));
const AllCategories = lazy(() => import("./Pages/AllCategories/AllCategories"));
const AboutUs = lazy(() => import("./Pages/AboutUs/AboutUs"));
const Contact = lazy(() => import("./Pages/Contact/Contact"));
const Trending = lazy(() => import("./components/Rows/Trending"));
const Gallery = lazy(() => import("./Pages/Gallery/Gallery"));
const Career = lazy(() => import("./Pages/Career/Career"));
const NewEnquiry = lazy(() => import("./Pages/Enquiry/NewEnquiry"));
const Notifications = lazy(() => import("./Pages/Notifications/Notifications"));
const Click2Explore = lazy(() => import("./Pages/Click2Explore/Click2Explore"));
const UserDashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const RecentlyViewedPackages = lazy(() => import("./components/Dashboard/RecentlyViewedPackages"));
const MyPayments = lazy(() => import("./components/Dashboard/MyPayments"));
const Invoice = lazy(() => import("./components/Common/invoice"));
const DetailPage = lazy(() => import("./components/Common/DetailPage"));
const TransportSlip = lazy(() => import("./components/Common/TransportSlip"));
const CreateUser = lazy(() => import("./components/AuthFolder/createUser"));
const TimeZones = lazy(() => import("./Pages/TimeZones/TimeZones"));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
      <CustomAlertProvider />
      <ScrollToTop />
  <Toaster
  position="top-center" containerStyle={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", }}
  toastOptions={{ duration: 2500, style: { background: "var(--app-card)", color: "var(--app-text)", border: "1px solid var(--app-border)", borderRadius: "12px", backdropFilter: "blur(10px)",},
  }}
/>
        <Header />

        <ProfileCompletionGuard>
        <Suspense fallback={<main className="ui-loader" aria-live="polite">Loading page…</main>}>
        <Routes>
          
          {/* ================= HOME ================= */}
          <Route
            path="/"
            element={
              <>
                <HeroSlider />
                <GlobalExplorerPromo />
                <DynamicRowsContainer page="home" />
                <Stats />
              </>
            }
          />
          

          {/* ================= PUBLIC PAGES ================= */}
          <Route path="/all-packages" element={<AllPackages />} />
          <Route path="/brands/:brandSlug" element={<AllPackages />} />
          <Route path="/all-categories" element={<AllCategories />} />
          <Route path="/time-zones" element={<TimeZones />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/global-explorer" element={<Click2Explore />} />
          <Route path="/package/:code" element={<DetailPage />} />
          <Route path="/careers" element={<Career />} />
          <Route path="/Enquiry" element={<NewEnquiry />} />
          <Route path="/updates" element={<Notifications />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route
            path="/complete-profile"
            element={<PrivateRoute><CreateUser mode="complete" /></PrivateRoute>}
          />
          <Route path="/transport-slip/:tourId" element={<PrivateRoute><TransportSlip /></PrivateRoute>} />

          <Route
            path="/gallery"
            element={
              <Gallery
                images={[
                  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
                  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1",
                ]}
              />
            }
          />

          {/* ================= PRIVATE ROUTES ================= */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/recently-viewed-packages"
            element={<PrivateRoute><RecentlyViewedPackages /></PrivateRoute>}
          />

          <Route
            path="/payments"
            element={
              <PrivateRoute>
                <MyPayments />
              </PrivateRoute>
            }
          />

          <Route
            path="/invoice/:bookingId"
            element={
              <PrivateRoute>
                <Invoice />
              </PrivateRoute>
            }
          />

        </Routes>
        </Suspense>
        </ProfileCompletionGuard>

        <Footer />

        <Chatbot />
        <ThemeToggle />

        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
