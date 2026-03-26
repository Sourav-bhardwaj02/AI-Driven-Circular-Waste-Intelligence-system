const axios = require('axios');

// Simulate collector location updates
const updateCollectorLocation = async (collectorId, latitude, longitude) => {
  try {
    const response = await axios.put(`http://localhost:5000/api/tracking/collectors/${collectorId}/location`, {
      latitude,
      longitude,
      status: 'active'
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZmMzU5MGQyZGUyMzY1ZiIsInNhdWQiOiJhZG1pbiIsInBhdXQiOiIyMDI1LTAyLTI5In0'
      }
    });

    if (response.data.success) {
      console.log(`✅ Updated collector ${collectorId} location:`, response.data.data);
    } else {
      console.error(`❌ Failed to update location:`, response.data);
    }
  } catch (error) {
    console.error('Error updating location:', error.message);
  }
};

// Simulate multiple collectors moving
const simulateMovement = async () => {
  console.log('🚛 Starting collector movement simulation...');
  
  // Collector 1 movement pattern
  const collector1Route = [
    { lat: 28.6139, lng: 77.2090 },
    { lat: 28.6145, lng: 77.2095 },
    { lat: 28.6150, lng: 77.2100 },
    { lat: 28.6155, lng: 77.2105 },
    { lat: 28.6160, lng: 77.2110 }
  ];

  // Collector 2 movement pattern
  const collector2Route = [
    { lat: 28.6280, lng: 77.2250 },
    { lat: 28.6285, lng: 77.2255 },
    { lat: 28.6290, lng: 77.2260 },
    { lat: 28.6295, lng: 77.2265 },
    { lat: 28.6300, lng: 77.2270 }
  ];

  // Get collector IDs from database or use hardcoded ones
  const collectors = [
    { id: '67f8a3b2c3d4e5f6a7b8c9d0e1f2a3', route: collector1Route },
    { id: '67f8a3b2c3d4e5f6a7b8c9d0e1f2a4', route: collector2Route }
  ];

  let step = 0;
  const maxSteps = 5;

  const moveInterval = setInterval(async () => {
    if (step >= maxSteps) {
      console.log('🏁 Simulation complete!');
      clearInterval(moveInterval);
      return;
    }

    // Update each collector
    for (const collector of collectors) {
      const position = collector.route[step];
      if (position) {
        await updateCollectorLocation(collector.id, position.lat, position.lng);
      }
    }

    step++;
    console.log(`📍 Step ${step}/${maxSteps} completed`);
  }, 3000); // Update every 3 seconds
};

// Start simulation
simulateMovement();

// Also allow manual updates
console.log('📱 Manual update commands:');
console.log('updateCollectorLocation("collector_id", latitude, longitude)');

module.exports = {
  updateCollectorLocation,
  simulateMovement
};
