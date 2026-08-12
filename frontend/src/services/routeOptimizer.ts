import { getRouteFromOSRM, OSRMRouteResult } from './osrmRouting';

export interface RouteStop {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  status: 'pending' | 'in_progress' | 'completed';
  type: 'depot' | 'collection' | 'plant';
  estimatedTime?: number; // mins
  wasteAmountKg?: number;
}

export interface OptimizedRoutePlan {
  orderedStops: RouteStop[];
  osrmResult: OSRMRouteResult;
  depotLocation: [number, number]; // [lng, lat]
  plantLocation: [number, number]; // [lng, lat]
  totalDistanceKm: number;
  totalDurationMins: number;
  currentStopIndex: number;
}

// Default realistic Delhi coordinates for demo simulation
export const DELHI_DEPOT: RouteStop = {
  id: 'depot-delhi-central',
  name: 'Central Municipal Depot (Delhi)',
  coordinates: [77.2090, 28.6139],
  status: 'completed',
  type: 'depot'
};

export const DELHI_PLANT: RouteStop = {
  id: 'plant-okhla',
  name: 'Okhla Waste-to-Energy Processing Facility',
  coordinates: [77.2798, 28.5284],
  status: 'pending',
  type: 'plant'
};

export const DEMO_COLLECTION_STOPS: RouteStop[] = [
  {
    id: 'stop-cp-market',
    name: 'Connaught Place Market Complex',
    coordinates: [77.2195, 28.6315],
    status: 'pending',
    type: 'collection',
    estimatedTime: 15,
    wasteAmountKg: 85
  },
  {
    id: 'stop-lajpat-nagar',
    name: 'Lajpat Nagar Central Market',
    coordinates: [77.2432, 28.5677],
    status: 'pending',
    type: 'collection',
    estimatedTime: 20,
    wasteAmountKg: 120
  },
  {
    id: 'stop-south-ext',
    name: 'South Extension Residential Zone',
    coordinates: [77.2217, 28.5693],
    status: 'pending',
    type: 'collection',
    estimatedTime: 12,
    wasteAmountKg: 65
  },
  {
    id: 'stop-green-park',
    name: 'Green Park Main Colony',
    coordinates: [77.2065, 28.5588],
    status: 'pending',
    type: 'collection',
    estimatedTime: 18,
    wasteAmountKg: 95
  },
  {
    id: 'stop-hauz-khas',
    name: 'Hauz Khas Village Commercial Hub',
    coordinates: [77.2023, 28.5494],
    status: 'pending',
    type: 'collection',
    estimatedTime: 15,
    wasteAmountKg: 70
  }
];

/**
 * Calculate distance between two [lng, lat] coordinates (km)
 */
function getDirectDistance(coord1: [number, number], coord2: [number, number]): number {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 2-Layer Route Optimization:
 * Layer 1: Orders collection stops starting from Depot, visiting stops via nearest-neighbor, ending at Waste Processing Plant.
 * Layer 2: Queries OSRM to get exact road geometry and distance/duration metrics.
 */
export const optimizeWasteRoute = async (
  startLocation?: [number, number], // [lng, lat]
  collectionStops: RouteStop[] = DEMO_COLLECTION_STOPS,
  plantLocation: [number, number] = DELHI_PLANT.coordinates
): Promise<OptimizedRoutePlan> => {
  const start: [number, number] = startLocation || DELHI_DEPOT.coordinates;

  // Layer 1: Nearest Neighbor Stop Ordering
  const unvisited = [...collectionStops];
  const orderedStops: RouteStop[] = [];

  // Start at Depot
  const depotStop: RouteStop = {
    ...DELHI_DEPOT,
    coordinates: start
  };
  orderedStops.push(depotStop);

  let currentCoord = start;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    unvisited.forEach((stop, index) => {
      const dist = getDirectDistance(currentCoord, stop.coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = index;
      }
    });

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    orderedStops.push(nextStop);
    currentCoord = nextStop.coordinates;
  }

  // End at Waste Processing Plant
  const plantStop: RouteStop = {
    ...DELHI_PLANT,
    coordinates: plantLocation
  };
  orderedStops.push(plantStop);

  // Layer 2: Query OSRM for actual road route following streets
  const routeCoordinates = orderedStops.map(s => s.coordinates); // [[lng, lat], ...]
  const osrmResult = await getRouteFromOSRM(routeCoordinates, true);

  return {
    orderedStops,
    osrmResult,
    depotLocation: start,
    plantLocation,
    totalDistanceKm: osrmResult.distanceKm,
    totalDurationMins: osrmResult.durationMins,
    currentStopIndex: 0
  };
};
