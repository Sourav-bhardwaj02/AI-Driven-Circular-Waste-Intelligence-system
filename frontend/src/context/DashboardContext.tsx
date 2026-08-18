import { createContext, useContext, useEffect, useState } from "react";
import { getDashboardDataAdmin, getComplaintsAdmin } from "@/api/dashboard";
import { useAuth } from "./AuthContext";

interface DashboardContextType {
  data: any;
  complaints: any[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider = ({ children }: any) => {
  const [data, setData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchData = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Only fetch admin data if user is admin
      if (user.role === 'admin') {
        const [dashboard, complaintsData] = await Promise.all([
          getDashboardDataAdmin(),
          getComplaintsAdmin()
        ]);

        setData(dashboard);
        setComplaints(complaintsData);
      }
    } catch (err: any) {
      console.error('Dashboard context error:', err);
      setError(err.message);
      setData(null);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAuthenticated]);

  const refetch = () => {
    fetchData();
  };

  return (
    <DashboardContext.Provider value={{ data, complaints, loading, error, refetch }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};