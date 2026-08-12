const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

// OSRM and future routing API keys/URLs live ONLY on the backend
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const ROUTING_PROVIDER = process.env.ROUTING_PROVIDER || 'osrm';

// Internal helper: make a proxied HTTP/HTTPS GET request
function proxyGet(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(targetUrl, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error('Invalid JSON response from routing service'));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Routing service request timed out'));
    });

    req.on('error', (err) => reject(err));
  });
}

// ─────────────────────────────────────────────────────────────────
// @route  POST /api/routing/route
// @desc   Proxy OSRM route request — keeps API base URL server-side
// @access Public (authentication can be added if required)
// @body   { coordinates: [[lng, lat], [lng, lat], ...] }
// ─────────────────────────────────────────────────────────────────
router.post('/route', async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 coordinate pairs [lng, lat] are required.'
      });
    }

    // Validate all coordinates are valid numbers
    for (const coord of coordinates) {
      if (!Array.isArray(coord) || coord.length < 2 ||
          typeof coord[0] !== 'number' || typeof coord[1] !== 'number' ||
          isNaN(coord[0]) || isNaN(coord[1])) {
        return res.status(400).json({
          success: false,
          message: 'Each coordinate must be a valid [longitude, latitude] pair.'
        });
      }
      // Validate geographic bounds
      const [lng, lat] = coord;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordinate values are out of valid geographic range.'
        });
      }
    }

    // Build OSRM coordinate string (lng,lat;lng,lat;...)
    const coordString = coordinates
      .map(([lng, lat]) => `${parseFloat(lng).toFixed(6)},${parseFloat(lat).toFixed(6)}`)
      .join(';');

    const osrmUrl = `${OSRM_BASE_URL}/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`;

    console.log(`[Routing Proxy] ${ROUTING_PROVIDER.toUpperCase()} request for ${coordinates.length} waypoints`);

    const { status, body } = await proxyGet(osrmUrl);

    if (status !== 200 || body.code !== 'Ok') {
      return res.status(502).json({
        success: false,
        message: 'Routing service returned an error. Please try again.',
        code: body.code || 'ROUTING_ERROR'
      });
    }

    const route = body.routes[0];
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Unable to calculate a road route for this location.'
      });
    }

    // Return clean, structured response to frontend
    return res.json({
      success: true,
      data: {
        geometry: route.geometry,          // GeoJSON geometry { type, coordinates }
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMins: Math.round(route.duration / 60),
        legs: route.legs || [],
        provider: ROUTING_PROVIDER
      }
    });

  } catch (err) {
    console.error('[Routing Proxy] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to calculate a road route for this location.'
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// @route  GET /api/routing/health
// @desc   Check routing service availability
// @access Public
// ─────────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    // Test OSRM with a simple 2-point request in Delhi
    const testUrl = `${OSRM_BASE_URL}/route/v1/driving/77.2090,28.6139;77.2150,28.6180?overview=false`;
    const { status } = await proxyGet(testUrl);

    return res.json({
      success: true,
      provider: ROUTING_PROVIDER,
      osrmBaseUrl: OSRM_BASE_URL.replace(/\/\/.*@/, '//***:***@'), // mask credentials if any
      status: status === 200 ? 'available' : 'degraded',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.json({
      success: false,
      provider: ROUTING_PROVIDER,
      status: 'unavailable',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
