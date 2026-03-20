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

const queryClient = new QueryClient();

const AppContent = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (role: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setLoginOpen(false);
    if (role === "admin") navigate("/dashboard/admin");
    else if (role === "collector") navigate("/dashboard/collector");
    else navigate("/dashboard/citizen");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/");
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} userRole={userRole} onLoginClick={() => setLoginOpen(true)} onLogout={handleLogout} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleLogin} />
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
        <Route path="/profile" element={<ProfilePage userRole={userRole} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
