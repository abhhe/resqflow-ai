import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Truck, AlertTriangle, Navigation, CheckCircle2, Phone, Clock, 
  MapPin, ShieldAlert, Activity, RefreshCw, Radio, Flame, ArrowLeft,
  LifeBuoy, Wrench, UserCheck, Hospital
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socket';

// Clean Leaflet marker icons
const driverAmbulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [32, 50],
  iconAnchor: [16, 50],
  popupAnchor: [1, -40]
});

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38]
});

const FLEET_UNITS = [
  { id: 'FIRE_01', name: 'FIRE_01 - Ameerpet Fire Tender', type: 'Heavy Fire Tender (6,000L + Foam)', driver: 'Station Officer Ramesh Rao', paramedic: 'Squad Leader K. Venkatesh' },
  { id: 'FIRE_02', name: 'FIRE_02 - Aerial Snorkel Platform', type: 'Hydraulic Snorkel & Aerial Ladder (42m)', driver: 'Sub-Officer Arvind Goud', paramedic: 'Fire Specialist Suresh M.' },
  { id: 'RESCUE_01', name: 'RESCUE_01 - USAR Rescue Squad', type: 'Urban Search & Rescue (USAR Squad)', driver: 'Capt. Vijay Nair', paramedic: 'Dr. Sunita K.' },
  { id: 'BOAT_01', name: 'BOAT_01 - NDRF Water Rescue Craft', type: 'Motorized Flood Rescue Boat', driver: 'Cmdr. Rajesh Rathod', paramedic: 'Diver Mohan Lal' },
  { id: 'POLICE_01', name: 'POLICE_01 - Sector Patrol Unit', type: 'Law Enforcement Rapid Patrol', driver: 'Sub-Inspector M. Krishna', paramedic: 'Constable S. Praveen' },
  { id: 'TRAFFIC_01', name: 'TRAFFIC_01 - Rapid Corridor Tow', type: 'Traffic Clearance & Towing Unit', driver: 'Inspector B. Srikanth', paramedic: 'Marshal Ravi T.' },
  { id: 'AMB001', name: 'AMB001 - Trauma ALS', type: 'Advanced Life Support / Trauma', driver: 'Suresh Kumar', paramedic: 'Dr. Sunita Rao' },
  { id: 'AMB002', name: 'AMB002 - Cardiac ALS', type: 'Advanced Cardiac Life Support', driver: 'Suresh Varma', paramedic: 'Sneha Reddy (EMT)' },
  { id: 'AMB003', name: 'AMB003 - Backup ALS', type: 'Advanced Life Support Backup', driver: 'Mohammed Arif', paramedic: 'Vikram Rathod' },
  { id: 'AMB004', name: 'AMB004 - BLS Unit', type: 'Basic Life Support', driver: 'K. Venkatesh', paramedic: 'Anand G.' },
  { id: 'AMB005', name: 'AMB005 - Water Rescue', type: 'Disaster & Water Rescue Craft', driver: 'P. Shiva Kumar', paramedic: 'Ravi Kiran' }
];

export default function DriverDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const unitParam = searchParams.get('unit') || 'AMB002';

  const [selectedUnit, setSelectedUnit] = useState(unitParam);
  const [missionStatus, setMissionStatus] = useState('EN_ROUTE');
  const [activeIncident, setActiveIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [breakdownReason, setBreakdownReason] = useState('ENGINE_FAILURE');
  const [breakdownSuccess, setBreakdownSuccess] = useState(null);
  const [reportingBreakdown, setReportingBreakdown] = useState(false);

  // Sync unit from search params
  useEffect(() => {
    if (unitParam && unitParam !== selectedUnit) {
      setSelectedUnit(unitParam);
    }
  }, [unitParam]);

  // Load mission from backend
  const loadDriverMission = async () => {
    try {
      setLoading(true);
      const stateRes = await apiService.getScenarioState();
      if (stateRes?.data?.incidents) {
        const matching = stateRes.data.incidents.find(i => 
          (i.assignedAmbulanceId === selectedUnit ||
           i.assignedFireUnit?.resourceId === selectedUnit ||
           i.assignedRescueUnit?.resourceId === selectedUnit ||
           i.allocatedAgencies?.FIRE?.resourceId === selectedUnit ||
           i.allocatedAgencies?.RESCUE?.resourceId === selectedUnit ||
           i.allocatedAgencies?.POLICE?.resourceId === selectedUnit ||
           i.allocatedAgencies?.TRAFFIC?.resourceId === selectedUnit ||
           i.allocatedAgencies?.AMBULANCE?.resourceId === selectedUnit) && 
          i.status !== 'RESOLVED'
        );
        if (matching) {
          setActiveIncident(matching);
        } else {
          // If no incident assigned to this specific unit, pick any active one for demo
          setActiveIncident(stateRes.data.incidents.slice().reverse().find(i => i.status !== 'RESOLVED') || stateRes.data.incidents[0] || null);
        }
      }
    } catch (err) {
      console.error('Error loading driver mission:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverMission();
  }, [selectedUnit]);

  // Listen to socket updates
  useEffect(() => {
    const socket = socketService.connect();
    if (!socket) return;

    const handleScenarioUpdate = (payload) => {
      if (payload?.state?.incidents) {
        const matching = payload.state.incidents.find(i => 
          (i.assignedAmbulanceId === selectedUnit ||
           i.assignedFireUnit?.resourceId === selectedUnit ||
           i.assignedRescueUnit?.resourceId === selectedUnit ||
           i.allocatedAgencies?.FIRE?.resourceId === selectedUnit ||
           i.allocatedAgencies?.RESCUE?.resourceId === selectedUnit ||
           i.allocatedAgencies?.POLICE?.resourceId === selectedUnit ||
           i.allocatedAgencies?.TRAFFIC?.resourceId === selectedUnit ||
           i.allocatedAgencies?.AMBULANCE?.resourceId === selectedUnit) && 
          i.status !== 'RESOLVED'
        );
        setActiveIncident(matching || null);
      }
    };

    socket.on('scenario:update', handleScenarioUpdate);
    return () => {
      socket.off('scenario:update', handleScenarioUpdate);
    };
  }, [selectedUnit]);

  // Handle Driver Breakdown Submission
  const handleConfirmBreakdown = async () => {
    try {
      setReportingBreakdown(true);
      const res = await apiService.failAmbulance(selectedUnit, breakdownReason);

      // Artificial small pacing for smooth UX
      await new Promise(r => setTimeout(r, 600));

      const replacementName = res?.data?.replacementResource?.name || res?.data?.replacementResourceId || 'Nearest Backup Unit';

      setBreakdownSuccess({
        unit: selectedUnit,
        reason: breakdownReason,
        message: `Emergency Unit ${selectedUnit} has been marked OFFLINE. Mission automatically reallocated to backup unit (${replacementName}) by autonomous coordination engine.`
      });
      setBreakdownModalOpen(false);
    } catch (err) {
      console.error('Error reporting breakdown:', err);
      alert('Failed to transmit breakdown alert: ' + (err.message || 'Network error'));
    } finally {
      setReportingBreakdown(false);
    }
  };

  const currentUnitInfo = FLEET_UNITS.find(u => u.id === selectedUnit) || FLEET_UNITS[1];

  // Coordinates
  const patientCoords = [
    activeIncident?.latitude || activeIncident?.location?.coordinates?.[1] || 17.4375,
    activeIncident?.longitude || activeIncident?.location?.coordinates?.[0] || 78.4482
  ];

  const driverCoords = [patientCoords[0] + 0.012, patientCoords[1] - 0.012];
  const hospitalCoords = [17.4435, 78.3800]; // Medicover / CARE Ameerpet

  const routePositions = [driverCoords, patientCoords, hospitalCoords];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      
      {/* Top MDT Tactical Header */}
      <header className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold text-[10px] tracking-wider uppercase border border-cyan-500/30 flex items-center gap-1">
              <Radio size={12} className="animate-pulse" /> Mobile Data Terminal (MDT)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30">
              GPS Linked (10 Hz)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px] tracking-wider uppercase border border-blue-500/30">
              Radio Channel 4 Active
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="text-cyan-400" />
            {selectedUnit.startsWith('FIRE_') 
              ? 'Fire & Rescue Crew Console'
              : (selectedUnit.startsWith('BOAT_') || selectedUnit.startsWith('RESCUE_'))
                ? 'Disaster & Rescue Operations Console'
                : selectedUnit.startsWith('POLICE_')
                  ? 'Law Enforcement MDT Console'
                  : selectedUnit.startsWith('TRAFFIC_')
                    ? 'Traffic Emergency MDT Console'
                    : 'Ambulance Crew Console'}
            <span className="text-sm font-semibold text-slate-400">| Field Operations MDT</span>
          </h1>
        </div>

        {/* Unit Selector & Quick Links */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-semibold">Active Unit:</span>
            <select
              value={selectedUnit}
              onChange={e => {
                setSelectedUnit(e.target.value);
                setSearchParams({ unit: e.target.value });
                setBreakdownSuccess(null);
              }}
              className="bg-transparent text-xs font-bold text-cyan-400 outline-none cursor-pointer"
            >
              {FLEET_UNITS.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/track"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-700 transition flex items-center gap-1.5"
          >
            <span>Citizen Tracking</span>
          </Link>
        </div>
      </header>

      {/* Breakdown Resolution Banner */}
      {breakdownSuccess && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-2xl bg-amber-950/80 border border-amber-500 text-amber-200 shadow-2xl flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="text-amber-400 w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-white">🚨 Mechanical Breakdown Transmitted to Central Dispatch</h4>
            <p className="mt-1 leading-relaxed">{breakdownSuccess.message}</p>
            <p className="mt-2 text-amber-300 font-mono text-[11px]">
              Status: Unit {breakdownSuccess.unit} marked OFFLINE. Mission reassigned via Hungarian minimum-cost optimizer. Maintenance vehicle deployed to your location.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Mission Overview + Street Map + Status Progression */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Active Dispatch Mission & Navigation Map */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Mission Alert Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-black text-rose-400 text-xs uppercase tracking-wider">
                  Active Emergency Mission • Code Red
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs font-bold">
                {activeIncident?.incidentId || activeIncident?._id || 'MISSION_ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Incident Category & Priority
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">
                    {activeIncident?.category || 'CARDIAC'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30">
                    {activeIncident?.priorityScore || 91}/100 (CRITICAL)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {activeIncident?.description || 'Emergency patient pickup requested.'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                  Destination Pickup Address
                </span>
                <div className="flex items-start gap-1.5 text-xs text-white font-semibold">
                  <MapPin size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>{activeIncident?.address || `${activeIncident?.node || 'Ameerpet'}, Hyderabad`}</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-mono mt-1 block">
                  Corridor: {activeIncident?.routeSummary || `${selectedUnit} → ${activeIncident?.node || 'Ameerpet'}`}
                </span>
              </div>
            </div>

            {/* Facility Reservation: Fire Station vs Water Rescue Base vs Hospital */}
            {activeIncident?.category === 'FIRE' ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-orange-400 block">Dispatched Fire Station Base</span>
                  <span className="font-bold text-white">
                    Telangana Fire Services • Ameerpet Fire Station (Station 04)
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px] border border-orange-500/30">
                  🚒 2 Fire Tenders Deployed
                </span>
              </div>
            ) : activeIncident?.category === 'FLOOD' ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block">Disaster Water Rescue Base</span>
                  <span className="font-bold text-white">
                    NDRF / SDRF Flood Response Command Base
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-500/30">
                  🚤 Rescue Craft Active
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Receiving Hospital</span>
                  <span className="font-bold text-emerald-400">
                    {activeIncident?.recommendedHospitalName || 'Hospital B: CARE Ameerpet'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                  ✓ 1 ICU Bed Pre-Reserved
                </span>
              </div>
            )}
          </div>

          {/* Real OpenStreetMap Turn-by-Turn Navigation Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Navigation className="text-cyan-400 w-4 h-4" />
                <h3 className="font-bold text-white text-sm">Real-Time OpenStreetMap Tactical Corridor</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                ETA to Patient: ~{activeIncident?.etaMinutes || 5} mins
              </span>
            </div>

            {/* Leaflet Map with Clean OpenStreetMap Tiles */}
            <div className="h-[360px] w-full relative z-0">
              <MapContainer
                center={driverCoords}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />

                {/* Driver / Ambulance Marker */}
                <Marker position={driverCoords} icon={driverAmbulanceIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-blue-600">Your Vehicle: {selectedUnit}</p>
                      <p className="text-slate-700">{currentUnitInfo.type}</p>
                      <p className="text-emerald-600 font-bold">Speed: 48 km/h</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Patient Location Marker */}
                <Marker position={patientCoords} icon={patientIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-rose-600">Patient Pickup Location</p>
                      <p className="text-slate-700">{activeIncident?.address || 'Pickup Point'}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Hospital Marker */}
                <Marker position={hospitalCoords} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-green-700">Receiving Hospital</p>
                      <p className="text-slate-700">{activeIncident?.recommendedHospitalName || 'Hospital B: CARE Ameerpet'}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Route Polyline */}
                <Polyline
                  positions={routePositions}
                  pathOptions={{
                    color: '#06b6d4',
                    weight: 5,
                    opacity: 0.85,
                    dashArray: '8, 8'
                  }}
                />
              </MapContainer>
            </div>
          </div>

        </div>

        {/* Column 3: Tactical Actions & Mechanical Breakdown Button */}
        <div className="space-y-6">

          {/* Unit & Crew MDT Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block border-b border-slate-800 pb-2">
              Vehicle & Paramedic Crew
            </span>

            <div>
              <h4 className="font-bold text-white text-base">{currentUnitInfo.name}</h4>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">{currentUnitInfo.type}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver on Duty:</span>
                <span className="font-semibold text-white">{currentUnitInfo.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lead Paramedic:</span>
                <span className="font-semibold text-white">{currentUnitInfo.paramedic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Oxygen & Defibrillator:</span>
                <span className="font-bold text-emerald-400">100% Ready</span>
              </div>
            </div>
          </div>

          {/* Mission Progress Action Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block border-b border-slate-800 pb-2">
              Update Dispatch Milestones
            </span>

            <div className="space-y-2">
              <button
                onClick={() => setMissionStatus('EN_ROUTE')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                  missionStatus === 'EN_ROUTE'
                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <span>1. En Route to Patient</span>
                {missionStatus === 'EN_ROUTE' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => setMissionStatus('ON_SCENE')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                  missionStatus === 'ON_SCENE'
                    ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <span>2. Arrived On Scene</span>
                {missionStatus === 'ON_SCENE' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => setMissionStatus('PATIENT_SECURED')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                  missionStatus === 'PATIENT_SECURED'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <span>3. Patient Secured & Monitored</span>
                {missionStatus === 'PATIENT_SECURED' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => setMissionStatus('HOSPITAL_TRANSFER')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                  missionStatus === 'HOSPITAL_TRANSFER'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
                }`}
              >
                <span>4. En Route to Hospital</span>
                {missionStatus === 'HOSPITAL_TRANSFER' && <CheckCircle2 size={16} />}
              </button>
            </div>
          </div>

          {/* 🚨 CRITICAL RED ACTION: DRIVER REPORT VEHICLE BREAKDOWN */}
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <Wrench size={18} />
              <h4 className="font-bold text-sm text-white">Vehicle Incident & Breakdown</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If your vehicle suffers a mechanical stall, tire puncture, or collision, alert central dispatch immediately so the patient is autonomously reallocated to a backup unit.
            </p>

            <button
              onClick={() => setBreakdownModalOpen(true)}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <AlertTriangle size={16} />
              <span>Report Vehicle Breakdown ({selectedUnit})</span>
            </button>
          </div>

        </div>

      </div>

      {/* Breakdown Confirmation Modal */}
      {breakdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-600 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Confirm Mechanical Breakdown?</h3>
              <p className="text-xs text-slate-300 mt-1">
                This will mark <span className="font-bold text-rose-400">{selectedUnit}</span> as OFFLINE. The Hungarian Allocation Engine will automatically reassign your active patient to the nearest backup unit with zero patient abandonment.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Failure Type:
              </label>
              <select
                value={breakdownReason}
                onChange={e => setBreakdownReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-500"
              >
                <option value="ENGINE_FAILURE">🚨 Critical Engine Stall / Transmission Failure</option>
                <option value="TIRE_PUNCTURE">⚠️ Severe Tire Blowout / Puncture</option>
                <option value="COLLISION">🚗 Road Collision / En-Route Traffic Accident</option>
                <option value="MEDICAL_EQUIPMENT">⚡ Vitals Monitor / Oxygen Supply Power Failure</option>
              </select>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setBreakdownModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmBreakdown}
                disabled={reportingBreakdown}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                {reportingBreakdown ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <span>Transmit Alert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
