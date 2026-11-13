import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import useDemoStore from '../demo/demoStore';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom markers with colored pins
const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const rescueBoatIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Helper component to center map on Hyderabad
const MapUpdater = ({ activeCityFilter, heavyRainActive }) => {
  const map = useMap();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    if (container) {
      resizeObserver.observe(container);
      setTimeout(() => map.invalidateSize(), 100);
      setTimeout(() => map.invalidateSize(), 500);
    }
    
    return () => {
      if (container) resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, [map]);

  useEffect(() => {
    // Default center on Hyderabad simulated corridor
    const hyderabadCenter = [17.4650, 78.4100];
    map.flyTo(hyderabadCenter, 12.2, {
      animate: true,
      duration: 1.0
    });
  }, [map, activeCityFilter]);

  return null;
};

const MapComponent = ({ 
  incidents = [], 
  ambulances = [], 
  hospitals = [], 
  routes = [],
  heavyRainActive = false,
  routeComparison = null
}) => {
  const activeCityFilter = useDemoStore(state => state.activeCityFilter);
  const storeRoutes = useDemoStore(state => state.routes) || [];
  const displayRoutes = routes.length > 0 ? routes : storeRoutes;

  // Road network edges for visualization
  const kukatpallyCoord = [17.4947, 78.4111];
  const erragaddaCoord = [17.4552, 78.4357];
  const kphbCoord = [17.4932, 78.3995];
  const srNagarCoord = [17.4431, 78.4428];
  const ameerpetCoord = [17.4375, 78.4482];
  const hitecCoord = [17.4435, 78.3800];
  const miyapurCoord = [17.4969, 78.3578];
  const jntuCoord = [17.4975, 78.3914];

  // Route A direct
  const routeACoords = [kukatpallyCoord, erragaddaCoord];
  // Route B bypass
  const routeBCoords = [kukatpallyCoord, kphbCoord, srNagarCoord, erragaddaCoord];

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[17.4650, 78.4100]} 
        zoom={12.2}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        preferCanvas={true}
        style={{ height: '100%', width: '100%', background: '#0F172A' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapUpdater activeCityFilter={activeCityFilter} heavyRainActive={heavyRainActive} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | ResQFlow AI (Simulated Hyderabad)'
          keepBuffer={4}
        />

        {/* Base Road Network Visualizer */}
        <Polyline 
          positions={[miyapurCoord, jntuCoord, kphbCoord, kukatpallyCoord]} 
          pathOptions={{ color: '#64748B', weight: 3, opacity: 0.6 }} 
        />
        <Polyline 
          positions={[kphbCoord, hitecCoord, ameerpetCoord]} 
          pathOptions={{ color: '#64748B', weight: 3, opacity: 0.5 }} 
        />
        <Polyline 
          positions={[erragaddaCoord, ameerpetCoord, srNagarCoord, erragaddaCoord]} 
          pathOptions={{ color: '#64748B', weight: 3, opacity: 0.6 }} 
        />

        {/* Heavy Rain / Congestion Visualization for Route A vs Route B */}
        {heavyRainActive ? (
          <>
            {/* Route A Congested */}
            <Polyline 
              positions={routeACoords} 
              pathOptions={{ color: '#EF4444', weight: 6, opacity: 0.85, dashArray: '6, 8' }} 
            >
              <Tooltip sticky>Route A (Direct NH65): 5 km, 22 min (Heavy Rain Congestion!)</Tooltip>
            </Polyline>

            {/* Route B Optimal Bypass */}
            <Polyline 
              positions={routeBCoords} 
              pathOptions={{ color: '#10B981', weight: 6, opacity: 0.9 }} 
            >
              <Tooltip sticky>Route B (Bypass Corridor): 7 km, 12 min (Selected Optimal Route)</Tooltip>
            </Polyline>
          </>
        ) : (
          <Polyline 
            positions={routeACoords} 
            pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.7 }} 
          >
            <Tooltip sticky>Route A (Direct NH65): 5 km, 10 min (Normal Traffic)</Tooltip>
          </Polyline>
        )}

        {/* Dynamic Dispatch Routes */}
        {displayRoutes.map((route, idx) => {
          const rawCoords = route.coordinates || route.geometry?.coordinates;
          if (rawCoords && rawCoords.length > 0) {
            // Leaflet expects [lat, lng], GeoJSON is [lng, lat]
            const positions = rawCoords.map(c => [c[1], c[0]]);
            const routeColors = ['#06B6D4', '#8B5CF6', '#F59E0B', '#10B981'];
            const color = routeColors[idx % routeColors.length];

            return (
              <Polyline 
                key={route._id || route.dispatchId || idx} 
                positions={positions} 
                pathOptions={{ color, weight: 5, opacity: 0.85, dashArray: '8, 8' }} 
              >
                <Tooltip sticky>
                  {route.routeLabel || `Mission Route: ${route.distanceKm || 5} km, ${route.durationMin || 10} min`}
                </Tooltip>
              </Polyline>
            );
          }
          return null;
        })}

        {/* Hospitals */}
        {hospitals.map((hospital) => {
          const coords = hospital.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const pos = [coords[1], coords[0]];

          const icuBeds = hospital.availableIcuBeds !== undefined ? hospital.availableIcuBeds : (hospital.icuBeds || 0);
          const genBeds = hospital.availableGeneralBeds !== undefined ? hospital.availableGeneralBeds : (hospital.bedsAvailable || 0);

          return (
            <Marker 
              key={hospital._id || hospital.hospitalId} 
              position={pos}
              icon={hospitalIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-slate-800 font-sans min-w-[200px]">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-800 border-b pb-1 mb-1">
                    🏥 {hospital.name}
                  </h3>
                  <div className="text-[11px] space-y-1">
                    <p className="flex justify-between">
                      <span className="text-slate-500">ICU Beds:</span>
                      <span className={`font-bold ${icuBeds > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {icuBeds} {icuBeds === 0 ? '(EXHAUSTED)' : 'available'}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">General Beds:</span>
                      <span className="font-bold text-slate-700">{genBeds} available</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Specialties:</span>
                      <span className="font-medium text-slate-700">{(hospital.specialties || []).slice(0, 3).join(', ')}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 italic">
                      Simulated Demonstration Data
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Incidents */}
        {incidents.map((incident) => {
          if (incident.status === 'RESOLVED') return null;
          const coords = incident.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const pos = [coords[1], coords[0]];

          const isCritical = incident.severityCategory === 'CRITICAL' || (incident.priorityScore || incident.priority) >= 95;

          return (
            <Marker 
              key={incident._id || incident.incidentId} 
              position={pos}
              icon={incidentIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-slate-800 font-sans min-w-[220px]">
                  <div className="flex items-center justify-between border-b pb-1 mb-1">
                    <span className="font-bold text-xs text-rose-700 uppercase">
                      🚨 {incident.incidentId || incident._id}: {incident.category}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {incident.severityCategory || 'HIGH'} ({incident.priorityScore || incident.priority}/100)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">{incident.description}</p>
                  <div className="text-[10px] space-y-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <p><span className="text-slate-500 font-medium">Node:</span> <span className="font-semibold text-slate-800">{incident.node || incident.locationName}</span></p>
                    <p><span className="text-slate-500 font-medium">Victims:</span> <span className="font-semibold text-slate-800">{incident.affectedPeople || incident.people_affected || 1} people</span></p>
                    <p><span className="text-slate-500 font-medium">Capability:</span> <span className="font-semibold text-purple-700 uppercase">{incident.requiredCapability || incident.required_capability}</span></p>
                    <p><span className="text-slate-500 font-medium">Assigned Ambulance:</span> <span className="font-semibold text-blue-700">{incident.assignedAmbulanceId || 'Pending Global Allocation'}</span></p>
                    <p><span className="text-slate-500 font-medium">Hospital:</span> <span className="font-semibold text-emerald-700">{incident.recommendedHospitalName || incident.recommendedHospitalId || 'Pending Match'}</span></p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Ambulances & Rescue Units */}
        {ambulances.map((ambulance) => {
          const coords = ambulance.currentLocation?.coordinates || ambulance.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const pos = [coords[1], coords[0]];

          const isBoat = (ambulance.capabilities || []).includes('rescue_boat') || ambulance.type === 'RESCUE_BOAT';
          const icon = isBoat ? rescueBoatIcon : ambulanceIcon;

          return (
            <Marker 
              key={ambulance._id || ambulance.ambulanceId} 
              position={pos}
              icon={icon}
            >
              <Popup className="custom-popup">
                <div className="p-2 text-slate-800 font-sans min-w-[200px]">
                  <div className="flex items-center justify-between border-b pb-1 mb-1">
                    <span className="font-bold text-xs uppercase text-blue-800">
                      {isBoat ? '🚤 Rescue Unit' : '🚑 Unit'} {ambulance.ambulanceId}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      ambulance.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                      ambulance.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {ambulance.status}
                    </span>
                  </div>
                  <div className="text-[10px] space-y-1 mt-1">
                    <p><span className="text-slate-500">Base Node:</span> <span className="font-semibold text-slate-700">{ambulance.node}</span></p>
                    <p><span className="text-slate-500">Capabilities:</span> <span className="font-semibold text-purple-700">{(ambulance.capabilities || []).join(', ')}</span></p>
                    {ambulance.currentAssignment && (
                      <p><span className="text-slate-500">Current Mission:</span> <span className="font-bold text-blue-700">{ambulance.currentAssignment}</span></p>
                    )}
                    {ambulance.etaMinutes > 0 && (
                      <p><span className="text-slate-500">Response ETA:</span> <span className="font-bold text-emerald-700">{ambulance.etaMinutes} min</span></p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
};

export default MapComponent;
