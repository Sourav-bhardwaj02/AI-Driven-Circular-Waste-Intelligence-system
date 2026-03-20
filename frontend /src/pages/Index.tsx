import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import DashboardSection from "@/components/DashboardSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface IndexProps {
  onGetStarted: () => void;
}

const Index = ({ onGetStarted }: IndexProps) => {
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      setTimeout(() => {
        document.getElementById(state.scrollTo!)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.state]);

  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <DashboardSection />
      <CTASection onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
};

export default Index;
