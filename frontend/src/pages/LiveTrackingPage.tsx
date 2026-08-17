import { useAuth } from "@/context/AuthContext";
import LiveTracking from "@/components/livetracking";
import CitizenLiveTracking from "@/components/CitizenLiveTracking";

const LiveTrackingPage = () => {
  const { user } = useAuth();

  // Show Zomato-style privacy-preserving tracking for citizens
  if (user?.role === "collector" || user?.role === "admin") {
    return <LiveTracking />;
  }

  return <CitizenLiveTracking />;
};

export default LiveTrackingPage;
