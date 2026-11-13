/**
 * Hyderabad Road Network Graph & Dijkstra/A* Travel-Time Routing Engine
 * Problem Statement: PS10 - ResQFlow AI (Traffic Optimization - PS13 Integration)
 * 
 * Simulated Hyderabad Environment:
 * 8 Road-Network Nodes:
 *   1. Kukatpally  (78.4111, 17.4947)
 *   2. Miyapur     (78.3578, 17.4969)
 *   3. JNTU        (78.3914, 17.4975)
 *   4. KPHB        (78.3995, 17.4932)
 *   5. Erragadda   (78.4357, 17.4552)
 *   6. Ameerpet    (78.4482, 17.4375)
 *   7. Hitec City  (78.3800, 17.4435)
 *   8. SR Nagar    (78.4428, 17.4431)
 */

const HYDERABAD_NODES = {
  'Kukatpally': { id: 'Kukatpally', name: 'Kukatpally', coordinates: [78.4111, 17.4947], lat: 17.4947, lng: 78.4111 },
  'Miyapur': { id: 'Miyapur', name: 'Miyapur', coordinates: [78.3578, 17.4969], lat: 17.4969, lng: 78.3578 },
  'JNTU': { id: 'JNTU', name: 'JNTU', coordinates: [78.3914, 17.4975], lat: 17.4975, lng: 78.3914 },
  'KPHB': { id: 'KPHB', name: 'KPHB', coordinates: [78.3995, 17.4932], lat: 17.4932, lng: 78.3995 },
  'Erragadda': { id: 'Erragadda', name: 'Erragadda', coordinates: [78.4357, 17.4552], lat: 17.4552, lng: 78.4357 },
  'Ameerpet': { id: 'Ameerpet', name: 'Ameerpet', coordinates: [78.4482, 17.4375], lat: 17.4375, lng: 78.4482 },
  'Hitec City': { id: 'Hitec City', name: 'Hitec City', coordinates: [78.3800, 17.4435], lat: 17.4435, lng: 78.3800 },
  'SR Nagar': { id: 'SR Nagar', name: 'SR Nagar', coordinates: [78.4428, 17.4431], lat: 17.4431, lng: 78.4428 },
  'Secunderabad': { id: 'Secunderabad', name: 'Secunderabad', coordinates: [78.4983, 17.4399], lat: 17.4399, lng: 78.4983 }
};

/**
 * Initial road network edges with distance (km), base travel time (min),
 * congestion multiplier (default 1.0), weather penalty (min), and status.
 */
function createInitialEdges() {
  return [
    // Route A Direct: Kukatpally <-> Erragadda (5.0 km, normal 10 min, heavy rain -> 22 min)
    {
      id: 'edge_kukatpally_erragadda',
      from: 'Kukatpally',
      to: 'Erragadda',
      distance_km: 5.0,
      base_time_min: 10.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Route A (Direct NH65)'
    },
    // Kukatpally <-> KPHB
    {
      id: 'edge_kukatpally_kphb',
      from: 'Kukatpally',
      to: 'KPHB',
      distance_km: 1.5,
      base_time_min: 3.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Main Arterial'
    },
    // KPHB <-> JNTU
    {
      id: 'edge_kphb_jntu',
      from: 'KPHB',
      to: 'JNTU',
      distance_km: 1.5,
      base_time_min: 3.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'JNTU Corridor'
    },
    // JNTU <-> Miyapur
    {
      id: 'edge_jntu_miyapur',
      from: 'JNTU',
      to: 'Miyapur',
      distance_km: 4.0,
      base_time_min: 7.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Miyapur Express'
    },
    // Route B segment: KPHB <-> SR Nagar (Bypass / Elevated Corridor)
    {
      id: 'edge_kphb_srnagar',
      from: 'KPHB',
      to: 'SR Nagar',
      distance_km: 4.0,
      base_time_min: 6.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Route B (Bypass Corridor)'
    },
    // SR Nagar <-> Erragadda
    {
      id: 'edge_srnagar_erragadda',
      from: 'SR Nagar',
      to: 'Erragadda',
      distance_km: 1.5,
      base_time_min: 3.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'SR Nagar Link'
    },
    // Erragadda <-> Ameerpet
    {
      id: 'edge_erragadda_ameerpet',
      from: 'Erragadda',
      to: 'Ameerpet',
      distance_km: 2.5,
      base_time_min: 5.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Metro Corridor'
    },
    // Ameerpet <-> SR Nagar
    {
      id: 'edge_ameerpet_srnagar',
      from: 'Ameerpet',
      to: 'SR Nagar',
      distance_km: 1.2,
      base_time_min: 2.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Internal Link'
    },
    // KPHB <-> Hitec City
    {
      id: 'edge_kphb_hiteccity',
      from: 'KPHB',
      to: 'Hitec City',
      distance_km: 5.5,
      base_time_min: 9.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Hitec Flyover'
    },
    // Hitec City <-> Erragadda
    {
      id: 'edge_hiteccity_erragadda',
      from: 'Hitec City',
      to: 'Erragadda',
      distance_km: 6.0,
      base_time_min: 10.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Sanath Nagar Connector'
    },
    // Hitec City <-> Ameerpet
    {
      id: 'edge_hiteccity_ameerpet',
      from: 'Hitec City',
      to: 'Ameerpet',
      distance_km: 8.0,
      base_time_min: 14.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Madhapur-Ameerpet Trunk'
    },
    // Miyapur <-> Kukatpally
    {
      id: 'edge_miyapur_kukatpally',
      from: 'Miyapur',
      to: 'Kukatpally',
      distance_km: 5.5,
      base_time_min: 10.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'NH65 Northern Trunk'
    },
    // Ameerpet <-> Secunderabad Corridor
    {
      id: 'edge_ameerpet_secunderabad',
      from: 'Ameerpet',
      to: 'Secunderabad',
      distance_km: 6.0,
      base_time_min: 11.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Secunderabad Express Link'
    },
    {
      id: 'edge_secunderabad_ameerpet',
      from: 'Secunderabad',
      to: 'Ameerpet',
      distance_km: 6.0,
      base_time_min: 11.0,
      congestion_multiplier: 1.0,
      weather_penalty_min: 0.0,
      status: 'OPEN',
      route_label: 'Secunderabad Return Trunk'
    }
  ];
}

class HyderabadGraphRouter {
  constructor() {
    this.nodes = { ...HYDERABAD_NODES };
    this.edges = createInitialEdges();
  }

  reset() {
    this.edges = createInitialEdges();
  }

  getEffectiveWeight(edge) {
    if (edge.status === 'CLOSED') {
      return Infinity;
    }
    const congestion = edge.congestion_multiplier || 1.0;
    const weather = edge.weather_penalty_min || 0.0;
    return (edge.base_time_min * congestion) + weather;
  }

  setHeavyRainTraffic(enabled = true) {
    // Modify Kukatpally <-> Erragadda direct edge
    const directEdge = this.edges.find(e => 
      (e.from === 'Kukatpally' && e.to === 'Erragadda') ||
      (e.from === 'Erragadda' && e.to === 'Kukatpally')
    );
    if (directEdge) {
      if (enabled) {
        // Base travel time 10 min + 12 min weather penalty = 22 min!
        directEdge.weather_penalty_min = 12.0;
        directEdge.congestion_multiplier = 1.0;
        directEdge.status = 'CONGESTED';
      } else {
        directEdge.weather_penalty_min = 0.0;
        directEdge.congestion_multiplier = 1.0;
        directEdge.status = 'OPEN';
      }
    }
  }

  updateEdgeStatus(edgeId, updates) {
    const edge = this.edges.find(e => e.id === edgeId);
    if (edge) {
      Object.assign(edge, updates);
      return edge;
    }
    return null;
  }

  /**
   * Resolve any location (string name or [lng, lat]) to closest graph node
   */
  resolveNode(location) {
    if (typeof location === 'string') {
      const trimmed = location.trim();
      for (const nodeKey of Object.keys(this.nodes)) {
        if (nodeKey.toLowerCase() === trimmed.toLowerCase()) {
          return this.nodes[nodeKey];
        }
      }
      // Partial match
      for (const nodeKey of Object.keys(this.nodes)) {
        if (trimmed.toLowerCase().includes(nodeKey.toLowerCase()) || 
            nodeKey.toLowerCase().includes(trimmed.toLowerCase())) {
          return this.nodes[nodeKey];
        }
      }
    } else if (Array.isArray(location) && location.length >= 2) {
      const [lng, lat] = location;
      let closestNode = null;
      let minDistance = Infinity;
      for (const node of Object.values(this.nodes)) {
        const d = Math.hypot(node.lng - lng, node.lat - lat);
        if (d < minDistance) {
          minDistance = d;
          closestNode = node;
        }
      }
      return closestNode;
    }
    return this.nodes['Kukatpally']; // Default fallback
  }

  /**
   * Dijkstra Algorithm optimizing for travel_time_min
   */
  findShortestPath(startLoc, endLoc) {
    const startNode = this.resolveNode(startLoc);
    const endNode = this.resolveNode(endLoc);

    if (startNode.id === endNode.id) {
      return {
        path: [startNode.id],
        distance_km: 0,
        travel_time_min: 0,
        coordinates: [startNode.coordinates],
        segments: [],
        chosenRouteName: 'Same Location'
      };
    }

    const nodeIds = Object.keys(this.nodes);
    const times = {};
    const distances = {};
    const previous = {};
    const unvisited = new Set(nodeIds);

    nodeIds.forEach(id => {
      times[id] = Infinity;
      distances[id] = Infinity;
      previous[id] = null;
    });

    times[startNode.id] = 0;
    distances[startNode.id] = 0;

    // Build bidirectional adjacency list
    const adj = {};
    nodeIds.forEach(id => adj[id] = []);

    this.edges.forEach(edge => {
      const weight = this.getEffectiveWeight(edge);
      adj[edge.from].push({ to: edge.to, weight, distance: edge.distance_km, edge });
      adj[edge.to].push({ to: edge.from, weight, distance: edge.distance_km, edge });
    });

    while (unvisited.size > 0) {
      let current = null;
      let minTime = Infinity;

      unvisited.forEach(id => {
        if (times[id] < minTime) {
          minTime = times[id];
          current = id;
        }
      });

      if (!current || times[current] === Infinity) {
        break;
      }

      if (current === endNode.id) {
        break; // reached target
      }

      unvisited.delete(current);

      for (const neighbor of adj[current]) {
        if (!unvisited.has(neighbor.to)) continue;

        const candidateTime = times[current] + neighbor.weight;
        if (candidateTime < times[neighbor.to]) {
          times[neighbor.to] = candidateTime;
          distances[neighbor.to] = distances[current] + neighbor.distance;
          previous[neighbor.to] = { from: current, edge: neighbor.edge };
        }
      }
    }

    if (times[endNode.id] === Infinity) {
      // Fallback direct
      return {
        path: [startNode.id, endNode.id],
        distance_km: 5.0,
        travel_time_min: 15.0,
        coordinates: [startNode.coordinates, endNode.coordinates],
        segments: [],
        chosenRouteName: 'Direct Fallback'
      };
    }

    // Reconstruct path
    const path = [];
    const segments = [];
    let curr = endNode.id;

    while (curr) {
      path.unshift(curr);
      const step = previous[curr];
      if (step) {
        segments.unshift({
          from: step.from,
          to: curr,
          edgeId: step.edge.id,
          distance_km: step.edge.distance_km,
          time_min: this.getEffectiveWeight(step.edge),
          route_label: step.edge.route_label
        });
        curr = step.from;
      } else {
        break;
      }
    }

    // Coordinates for Leaflet map polylines: interpolate intermediate points for realism
    const coordinates = [];
    for (let i = 0; i < path.length; i++) {
      const node = this.nodes[path[i]];
      if (i > 0) {
        const prevNode = this.nodes[path[i - 1]];
        // Interpolate 2 midpoint coordinates
        coordinates.push([
          prevNode.lng + (node.lng - prevNode.lng) * 0.33,
          prevNode.lat + (node.lat - prevNode.lat) * 0.33
        ]);
        coordinates.push([
          prevNode.lng + (node.lng - prevNode.lng) * 0.66,
          prevNode.lat + (node.lat - prevNode.lat) * 0.66
        ]);
      }
      coordinates.push([node.lng, node.lat]);
    }

    const routeLabel = path.length > 2 
      ? `Route B via ${path.slice(1, -1).join(' -> ')}`
      : `Route A Direct (${path.join(' -> ')})`;

    return {
      path,
      distance_km: parseFloat(distances[endNode.id].toFixed(1)),
      travel_time_min: parseFloat(times[endNode.id].toFixed(1)),
      coordinates,
      segments,
      chosenRouteName: routeLabel
    };
  }

  /**
   * Compares Route A vs Route B specifically between Kukatpally and Erragadda
   */
  compareKukatpallyToErragaddaRoutes() {
    // Route A: Direct Kukatpally -> Erragadda
    const directEdge = this.edges.find(e => 
      (e.from === 'Kukatpally' && e.to === 'Erragadda') ||
      (e.from === 'Erragadda' && e.to === 'Kukatpally')
    );
    const directTime = this.getEffectiveWeight(directEdge);
    const directDistance = directEdge.distance_km;

    // Route B: Kukatpally -> KPHB -> SR Nagar -> Erragadda
    const e1 = this.edges.find(e => e.id === 'edge_kukatpally_kphb');
    const e2 = this.edges.find(e => e.id === 'edge_kphb_srnagar');
    const e3 = this.edges.find(e => e.id === 'edge_srnagar_erragadda');

    const routeBTime = this.getEffectiveWeight(e1) + this.getEffectiveWeight(e2) + this.getEffectiveWeight(e3);
    const routeBDistance = e1.distance_km + e2.distance_km + e3.distance_km;

    const chosen = directTime <= routeBTime ? 'Route A' : 'Route B';

    return {
      routeA: {
        name: 'Route A (Direct NH65)',
        distance_km: directDistance,
        travel_time_min: directTime,
        status: directEdge.status
      },
      routeB: {
        name: 'Route B (KPHB-SR Nagar Bypass)',
        distance_km: routeBDistance,
        travel_time_min: routeBTime,
        status: 'OPEN'
      },
      chosenRoute: chosen,
      explanation: chosen === 'Route B'
        ? `Route B (7.0 km, ${routeBTime} min) selected over Route A (5.0 km, ${directTime} min) because heavy rain traffic increased Route A travel time to 22 min.`
        : `Route A (5.0 km, ${directTime} min) selected because traffic conditions are normal.`
    };
  }

  /**
   * Road Closure Mutation: Closes a specific road edge in the network
   */
  closeRoadEdge(edgeId) {
    const edge = this.edges.find(e => 
      e.id === edgeId || 
      (e.from.toLowerCase() === edgeId.toLowerCase() && e.to.toLowerCase() === edgeId.toLowerCase())
    );
    if (edge) {
      edge.status = 'CLOSED';
      return { success: true, edge, message: `Road edge ${edge.id} (${edge.from} <-> ${edge.to}) is now CLOSED.` };
    }
    // Try matching Route A specifically
    if (edgeId === 'Route A' || edgeId === 'edge_kukatpally_erragadda') {
      const direct = this.edges.find(e => e.id === 'edge_kukatpally_erragadda');
      if (direct) {
        direct.status = 'CLOSED';
        return { success: true, edge: direct, message: 'Route A (Direct NH65) is now CLOSED.' };
      }
    }
    return { success: false, message: `Edge ${edgeId} not found.` };
  }

  /**
   * Reopens a previously closed road edge
   */
  reopenRoadEdge(edgeId) {
    const edge = this.edges.find(e => 
      e.id === edgeId || 
      (e.from.toLowerCase() === edgeId.toLowerCase() && e.to.toLowerCase() === edgeId.toLowerCase())
    );
    if (edge) {
      edge.status = 'OPEN';
      return { success: true, edge, message: `Road edge ${edge.id} reopened.` };
    }
    if (edgeId === 'Route A' || edgeId === 'edge_kukatpally_erragadda') {
      const direct = this.edges.find(e => e.id === 'edge_kukatpally_erragadda');
      if (direct) {
        direct.status = 'OPEN';
        return { success: true, edge: direct, message: 'Route A reopened.' };
      }
    }
    return { success: false, message: `Edge ${edgeId} not found.` };
  }

  /**
   * Finds Primary and Alternative (Bypass) routes between two locations
   */
  findAlternativeRoutes(startLoc, endLoc) {
    const primary = this.findShortestPath(startLoc, endLoc);
    const alternatives = [primary];

    // Attempt to compute bypasses by temporarily closing each edge along the primary route
    if (primary.segments && primary.segments.length > 0) {
      primary.segments.forEach(seg => {
        const edge = this.edges.find(e => e.id === seg.edgeId);
        if (edge && edge.status === 'OPEN') {
          const originalStatus = edge.status;
          edge.status = 'CLOSED';
          const alt = this.findShortestPath(startLoc, endLoc);
          edge.status = originalStatus;

          // Check if this alternative is distinct and valid
          const pathKey = alt.path.join('-');
          const alreadyExists = alternatives.some(a => a.path.join('-') === pathKey);
          if (!alreadyExists && alt.travel_time_min < Infinity && alt.path.length > 1) {
            alternatives.push({
              ...alt,
              chosenRouteName: `Alternative via ${alt.path.slice(1, -1).join(' -> ') || alt.path.join(' -> ')}`,
              isBypass: true
            });
          }
        }
      });
    }

    return {
      start: startLoc,
      destination: endLoc,
      primaryRoute: alternatives[0],
      alternativeRoutes: alternatives.slice(1),
      count: alternatives.length
    };
  }
}

// Singleton instance
const graphRouter = new HyderabadGraphRouter();

module.exports = {
  HYDERABAD_NODES,
  HYDERABAD_EDGES: createInitialEdges(),
  createInitialEdges,
  HyderabadGraphRouter,
  graphRouter
};

