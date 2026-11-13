const axios = require('axios');
const Route = require('../models/Route');
const RoadCondition = require('../models/RoadCondition');
const { graphRouter } = require('./hyderabadGraphRouter');

const OSRM_BASE_URL = 'http://router.project-osrm.org';

const calculateRoute = async (startCoords, endCoords) => {
  try {
    // Format: lon,lat
    const startStr = `${startCoords[0]},${startCoords[1]}`;
    const endStr = `${endCoords[0]},${endCoords[1]}`;
    
    // Attempt public OSRM with short timeout so it does not hang when offline
    const response = await axios.get(
      `${OSRM_BASE_URL}/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson`,
      { timeout: 2500 }
    );

    if (response.data.code !== 'Ok') {
      throw new Error('OSRM non-OK code');
    }

    const route = response.data.routes[0];
    const penalties = await applyRoadPenalties(route);
    
    return {
      geometry: route.geometry,
      distance: route.distance, // meters
      duration: route.duration, // seconds
      adjustedDuration: route.duration + penalties,
      score: calculateRouteScore(route.distance, route.duration + penalties),
      engine: 'OSRM'
    };
  } catch (error) {
    // Fall back to offline Dijkstra/A* graph router
    console.log(`[ROUTING] External OSRM unavailable (${error.message}). Using offline Hyderabad graph router.`);
    const fallbackPath = graphRouter.findShortestPath(startCoords, endCoords);
    const durationSeconds = Math.round(fallbackPath.travel_time_min * 60);
    const distanceMeters = Math.round(fallbackPath.distance_km * 1000);

    return {
      geometry: {
        type: 'LineString',
        coordinates: fallbackPath.coordinates
      },
      distance: distanceMeters,
      duration: durationSeconds,
      adjustedDuration: durationSeconds,
      score: calculateRouteScore(distanceMeters, durationSeconds),
      engine: 'HYDERABAD_GRAPH_ROUTER',
      routeName: fallbackPath.chosenRouteName
    };
  }
};

const applyRoadPenalties = async (osrmRoute) => {
  // Simplistic approach for prototype: 
  // Fetch active RoadConditions and if they intersect with route bbox/points, add penalties
  const activeConditions = await RoadCondition.find({ state: { $ne: 'NORMAL' } });
  
  let penaltySeconds = 0;
  
  // (In a real system, you'd use Turf.js or PostGIS to check intersection precisely)
  activeConditions.forEach(condition => {
    // Dummy check: if we had a blocked road, add 600s
    if (condition.state === 'BLOCKED') penaltySeconds += 600;
    if (condition.state === 'CONGESTED') penaltySeconds += 300;
  });
  
  return penaltySeconds;
};

const calculateRouteScore = (distance, adjustedDuration) => {
  // Lower duration is better. Score algorithm.
  // Inverse relationship: max score for 0 duration.
  const score = 10000 / (adjustedDuration + 1);
  return score;
};

module.exports = {
  calculateRoute
};
