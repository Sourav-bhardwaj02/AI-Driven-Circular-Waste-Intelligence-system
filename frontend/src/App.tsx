import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import LoginModal from "@/components/LoginModal";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import CollectorDashboard from "./pages/CollectorDashboard";
import CitizenDashboard from "./pages/CitizenDashboard";
import ClassifierPage from "./pages/ClassifierPage";
import CommunityPage from "./pages/CommunityPage";
import RewardsPage from "./pages/RewardsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import { DashboardProvider } from "./context/DashboardContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LeaderboardPage from "./pages/LeaderboardPage";
import LiveTrackingPage from "./pages/LiveTrackingPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setLoginOpen(false);
    if (user) {
      if (user.role === "admin") navigate("/dashboard/admin");
      else if (user.role === "collector") navigate("/dashboard/collector");
      else navigate("/dashboard/citizen");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
    <DashboardProvider user={user} isAuthenticated={isAuthenticated}>
      <Navbar 
        isLoggedIn={isAuthenticated} 
        userRole={user?.role || null} 
        onLoginClick={() => setLoginOpen(true)} 
        onLogout={handleLogout} 
      />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index onGetStarted={() => setLoginOpen(true)} />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/collector" element={<CollectorDashboard />} />
        <Route path="/dashboard/citizen" element={<CitizenDashboard />} />
        <Route path="/classifier" element={<ClassifierPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/tracking" element={<LiveTrackingPage />} />
                
        <Route path="/leaderboard" element={<LeaderboardPage />} />

        <Route path="/profile" element={<ProfilePage userRole={user?.role || null} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </DashboardProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
