import { getRouteFromOSRM, OSRMRouteResult } from './osrmRouting';

export interface RouteStop {
  id: string;
  name: string;
  houseNumber?: string;
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

// Household collection series along Delhi municipal route
export const DEMO_COLLECTION_STOPS: RouteStop[] = [
  {
    id: 'house-101',
    name: 'Connaught Place - House #101',
    houseNumber: '#101',
    coordinates: [77.2195, 28.6315],
    status: 'pending',
    type: 'collection',
    estimatedTime: 5,
    wasteAmountKg: 15
  },
  {
    id: 'house-102',
    name: 'Connaught Place - House #102',
    houseNumber: '#102',
    coordinates: [77.2215, 28.6280],
    status: 'pending',
    type: 'collection',
    estimatedTime: 5,
    wasteAmountKg: 12
  },
  {
    id: 'house-201',
    name: 'Lajpat Nagar - House #42 (Block B)',
    houseNumber: '#42',
    coordinates: [77.2432, 28.5677],
    status: 'pending',
    type: 'collection',
    estimatedTime: 8,
    wasteAmountKg: 25
  },
  {
    id: 'house-202',
    name: 'Lajpat Nagar - House #45 (Block B)',
    houseNumber: '#45',
    coordinates: [77.2410, 28.5650],
    status: 'pending',
    type: 'collection',
    estimatedTime: 6,
    wasteAmountKg: 18
  },
  {
    id: 'house-301',
    name: 'South Ext - House #88',
    houseNumber: '#88',
    coordinates: [77.2217, 28.5693],
    status: 'pending',
    type: 'collection',
    estimatedTime: 7,
    wasteAmountKg: 20
  },
  {
    id: 'house-302',
    name: 'South Ext - House #92',
    houseNumber: '#92',
    coordinates: [77.2180, 28.5640],
    status: 'pending',
    type: 'collection',
    estimatedTime: 6,
    wasteAmountKg: 14
  },
  {
    id: 'house-401',
    name: 'Green Park - House #12 (Sector 5)',
    houseNumber: '#12',
    coordinates: [77.2065, 28.5588],
    status: 'pending',
    type: 'collection',
    estimatedTime: 8,
    wasteAmountKg: 30
  },
  {
    id: 'house-402',
    name: 'Green Park - House #15 (Sector 5)',
    houseNumber: '#15',
    coordinates: [77.2040, 28.5540],
    status: 'pending',
    type: 'collection',
    estimatedTime: 7,
    wasteAmountKg: 22
  },
  {
    id: 'house-501',
    name: 'Hauz Khas - House #105 (Village)',
    houseNumber: '#105',
    coordinates: [77.2023, 28.5494],
    status: 'pending',
    type: 'collection',
    estimatedTime: 10,
    wasteAmountKg: 35
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
