import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import HeroSlider from "./components/Header/HeroSlider";
import PackagesShow from "./components/Rows/PackagesShow";
import AllPackages from "./Pages/AllPackages/AllPackages";
import TopTen from "./components/Rows/TopTen";
import DynamicRowsContainer from "./components/Rows/DynamicRowsContainer";
import AllCategories from "./Pages/AllCategories/AllCategories";
import Stats from "./Pages/AboutUs/Stats";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Footer from "./components/Header/Footer";
import Contact from "./Pages/Contact/Contact";
import Trending from "./components/Rows/Trending";
import Gallery from "./Pages/Gallery/Gallery";
import Career from "./Pages/Career/Career";
import NewEnquiry from "./Pages/Enquiry/NewEnquiry";
import Notifications from "./Pages/Notifications/Notifications";
import Click2Explore from "./Pages/Click2Explore/Click2Explore";
import GlobalExplorerPromo from "./Pages/Click2Explore/GlobalExplorerPromo";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/AuthFolder/PrivateRoute";
import ProfileCompletionGuard from "./components/AuthFolder/ProfileCompletionGuard";
import UserDashboard from "./components/Dashboard/Dashboard";
import RecentlyViewedPackages from "./components/Dashboard/RecentlyViewedPackages";
import MyPayments from "./components/Dashboard/MyPayments";
import Invoice from "./components/Common/invoice";
import DetailPage from "./components/Common/DetailPage";
import TransportSlip from "./components/Common/TransportSlip";
import CreateUser from "./components/AuthFolder/createUser"; 
import MyFeed from "./components/Common/MyFeed";
import Chatbot from "./components/Chatbot/Chatbot";
import { Toaster } from "react-hot-toast";

import ScrollToTop from "./components/ScrollToTop";
import { CustomAlertProvider, ThemeProvider, ThemeToggle } from "./common";
import "./theme-overrides.css";

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
        <Routes>
          
          {/* ================= HOME ================= */}
          <Route
            path="/"
            element={
              <>
                <HeroSlider />
                <GlobalExplorerPromo />
                <PackagesShow />
                <TopTen />
                <DynamicRowsContainer page="home" />
                <Stats />
              </>
            }
          />
          

          {/* ================= PUBLIC PAGES ================= */}
          <Route path="/all-packages" element={<AllPackages />} />
          <Route path="/brands/:brandSlug" element={<AllPackages />} />
          <Route path="/all-categories" element={<AllCategories />} />
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
  path="/myfeed"
  element={
    <PrivateRoute>
      <MyFeed />
    </PrivateRoute>
  }
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
