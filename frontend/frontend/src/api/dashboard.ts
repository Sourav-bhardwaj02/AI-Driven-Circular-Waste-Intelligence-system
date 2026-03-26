const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface WasteTypeData {
  name: string;
  value: number;
  color: string;
}

export interface AreaData {
  month: string;
  pickups: number;
  complaints: number;
}

export interface Complaint {
  sector: string;
  time: string;
  status: string;
}

export interface DashboardData {
  pieData: WasteTypeData[];
  areaData: AreaData[];
  complaints: Complaint[];
  stats?: {
    totalCollections: number;
    activeCollectors: number;
    pendingComplaints: number;
    resolvedComplaints: number;
  };
}

export interface CitizenDashboardData {
  rewardPoints: number;
  level: number;
  progress: number;
  recentPoints: Array<{
    action: string;
    points: string;
    time: string;
  }>;
  nextLevelPoints: number;
}

export interface CollectorDashboardData {
  currentRoute: {
    routeCode: string;
    name: string;
    areas: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    aiOptimized: boolean;
  } | null;
  pickups: Array<{
    name: string;
    time: string;
    status: string;
  }>;
  areas: Array<{
    name: string;
    value: string;
    label: string;
  }>;
  rewardPoints: number;
  routeStarted: boolean;
}

// Helper function for API calls
const apiCall = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${url}:`, error);
    throw error;
  }
};

// Admin Dashboard API
export const getDashboardDataAdmin = async (): Promise<DashboardData> => {
  try {
    return await apiCall(`${API_BASE_URL}/admin/dashboard`);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch admin dashboard data');
  }
};

export const getComplaintsAdmin = async (): Promise<Complaint[]> => {
  try {
    const complaints = await apiCall(`${API_BASE_URL}/admin/complaints`);
    return complaints.map((complaint: any) => ({
      sector: complaint.sector,
      time: getTimeAgo(new Date(complaint.createdAt)),
      status: complaint.status.replace('_', ' ').charAt(0).toUpperCase() + complaint.status.replace('_', ' ').slice(1)
    }));
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw new Error('Failed to fetch complaints');
  }
};

// Citizen Dashboard API
export const getCitizenDashboard = async (userId: string): Promise<CitizenDashboardData> => {
  try {
    return await apiCall(`${API_BASE_URL}/citizen/dashboard/${userId}`);
  } catch (error) {
    console.error('Error fetching citizen dashboard data:', error);
    throw new Error('Failed to fetch citizen dashboard data');
  }
};

export const reportGarbage = async (data: {
  citizenId: string;
  sector: string;
  description: string;
  latitude: number;
  longitude: number;
  priority?: string;
  image?: File;
}) => {
  try {
    const formData = new FormData();
    formData.append('citizenId', data.citizenId);
    formData.append('sector', data.sector);
    formData.append('description', data.description);
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    if (data.priority) formData.append('priority', data.priority);
    if (data.image) formData.append('image', data.image);

    const response = await fetch(`${API_BASE_URL}/citizen/report`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to report garbage');
    }

    return await response.json();
  } catch (error) {
    console.error('Error reporting garbage:', error);
    throw error;
  }
};

export const getNearbyTrucks = async (userId: string) => {
  try {
    return await apiCall(`${API_BASE_URL}/citizen/nearby-trucks/${userId}`);
  } catch (error) {
    console.error('Error fetching nearby trucks:', error);
    throw new Error('Failed to fetch nearby trucks');
  }
};

// Collector Dashboard API
export const getCollectorDashboard = async (userId: string): Promise<CollectorDashboardData> => {
  try {
    return await apiCall(`${API_BASE_URL}/collector/dashboard/${userId}`);
  } catch (error) {
    console.error('Error fetching collector dashboard data:', error);
    throw new Error('Failed to fetch collector dashboard data');
  }
};

export const updateRouteStatus = async (routeId: string, status: string) => {
  try {
    return await apiCall(`${API_BASE_URL}/collector/route/${routeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error('Error updating route status:', error);
    throw new Error('Failed to update route status');
  }
};

// Helper function
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}