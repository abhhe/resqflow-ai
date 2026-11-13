import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, Hospital, ShieldAlert, CheckCircle2, Clock, Phone, MapPin, 
  AlertTriangle, Navigation, HeartPulse, RefreshCw, ArrowRight, UserCheck, 
  Radio, Activity, AlertCircle, Share2, ExternalLink, Flame, LifeBuoy
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socket';
import { Link } from 'react-router-dom';

// Leaflet Icons
const citizenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38]
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [32, 50],
  iconAnchor: [16, 50],
  popupAnchor: [1, -40]
});

const fireRescueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [34, 52],
  iconAnchor: [17, 52],
  popupAnchor: [1, -42]
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38]
});

const fireStationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40]
});

const floodStationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40]
});

const failedAmbulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [26, 42],
  iconAnchor: [13, 42],
  popupAnchor: [1, -34]
});

// Map auto-bounds adjuster
const AutoBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        // ignore invalid bounds
      }
    }
  }, [map, points]);
  return null;
};

const CREW_PROFILES = {
  AMB001: {
    driver: 'Rajesh K.',
    paramedic: 'Dr. Sunita Rao (Critical Care EMT)',
    plate: 'TS 09 EA 108',
    phone: '+91 98765 43210',
    type: 'Trauma & Emergency Care Unit',
    equipment: ['Multi-Parameter Monitor', 'Defibrillator', 'Hydraulic Stretcher', 'Oxygen Generator']
  },
  AMB002: {
    driver: 'Suresh Varma',
    paramedic: 'Nurse Sneha Reddy (ALS Specialist)',
    plate: 'TS 09 EB 108',
    phone: '+91 98450 11223',
    type: 'Advanced Cardiac Life Support (ALS)',
    equipment: ['12-Lead ECG / Defibrillator', 'Transport Ventilator', 'Cardiac Drugs Kit', 'IV Infusion Pumps']
  },
  AMB003: {
    driver: 'Mohammed Arif',
    paramedic: 'Lead EMT Vikram Rathod',
    plate: 'TS 09 EC 108',
    phone: '+91 97000 88990',
    type: 'Advanced Life Support (ALS Backup)',
    equipment: ['Portable Ventilator', 'Advanced Airway Kit', 'Spine Board & Extrication', 'Defibrillator']
  },
  AMB004: {
    driver: 'K. Venkatesh',
    paramedic: 'First Responder Anand G.',
    plate: 'TS 09 ED 108',
    phone: '+91 96111 22334',
    type: 'Basic Life Support (BLS)',
    equipment: ['Automated External Defibrillator (AED)', 'Oxygen Resuscitator', 'First Aid Trauma Pack']
  },
  AMB005: {
    driver: 'P. Shiva Kumar',
    paramedic: 'Rescue Pilot Ravi Kiran',
    plate: 'TS 09 EE 108',
    phone: '+91 95000 44556',
    type: 'Rapid Water Rescue & Disaster Response',
    equipment: ['Inflatable Rescue Craft', 'Hypothermia Thermal Pack', 'Flotation Gurneys']
  },
  FIRE_01: {
    driver: 'Station Officer Ramesh Rao',
    paramedic: 'Squad Leader K. Venkatesh (Thermal Extrication)',
    plate: 'TS 09 F 101',
    phone: '101 / +91 40 2344 2944',
    type: 'Heavy Fire Tender & Foam Extrication Apparatus',
    equipment: ['6,000L Water Cannon', 'AFFF Class-B Foam', 'Hydraulic Jaws of Life', 'Thermal Imaging Camera']
  },
  FIRE_02: {
    driver: 'Sub-Officer Arvind Goud',
    paramedic: 'Fire Specialist Suresh M.',
    plate: 'TS 09 F 102',
    phone: '101 / +91 40 2344 2945',
    type: 'Hydraulic Snorkel & Aerial Ladder Platform (42m)',
    equipment: ['High-Rise Snorkel Cage', 'Heavy Pressure Hoses', 'Positive Pressure Ventilators']
  },
  RESCUE_01: {
    driver: 'Capt. Vijay Nair',
    paramedic: 'Disaster Specialist Dr. Sunita K.',
    plate: 'TS 09 R 901',
    phone: '112 / +91 40 2345 1111',
    type: 'Urban Search & Rescue (USAR) Heavy Squad',
    equipment: ['Acoustic Life Detectors', 'Hydraulic Shoring Struts', 'Concrete Breakers & Diamond Cutters']
  },
  BOAT_01: {
    driver: 'Cmdr. Rajesh Rathod (NDRF Unit 10)',
    paramedic: 'Rescue Diver Mohan Lal',
    plate: 'NDRF-BOAT-04',
    phone: '1070 / +91 40 2345 2222',
    type: 'Inflatable Motorized Rescue Craft & Flood Diver Team',
    equipment: ['Inflatable Zodiac Boat (40 HP)', 'Life Vests & Flotation Canisters', 'Thermal Blankets', 'Underwater Sonar']
  },
  POLICE_01: {
    driver: 'Sub-Inspector M. Krishna',
    paramedic: 'Constable S. Praveen',
    plate: 'TS 09 P 100',
    phone: '100 / +91 40 2785 2400',
    type: 'Law Enforcement Rapid Patrol & Perimeter Cordon',
    equipment: ['Perimeter Cordon Barriers', 'Crowd Dispersion Systems', 'Traffic Diverter Flares']
  },
  TRAFFIC_01: {
    driver: 'Inspector B. Srikanth',
    paramedic: 'Traffic Marshal Ravi T.',
    plate: 'TS 09 TR 301',
    phone: '103 / +91 40 2785 2482',
    type: 'Traffic Clearance & Emergency Green Corridor Unit',
    equipment: ['Heavy Towing Winch', 'Hydraulic Obstacle Wedge', 'Electronic Signal Override Beacon']
  },
  HAZMAT_01: {
    driver: 'Chief HazMat Officer Dr. Alok Sen',
    paramedic: 'Decontamination Tech Priya S.',
    plate: 'TS 09 HZ 01',
    phone: '112 / +91 40 2345 8888',
    type: 'Chemical Containment & Level-A HazMat Response',
    equipment: ['Level-A Encapsulated Suits', 'Chemical Vapor Neutralizers', 'Air Monitoring Multi-Gas Spectrometer']
  }
};

const DEFAULT_CREW = {
  driver: 'Prasad M.',
  paramedic: 'Staff EMT Kavita D.',
  plate: 'TS 09 EX 108',
  phone: '+91 91234 56789',
  type: 'Advanced Life Support (ALS)',
  equipment: ['Emergency Defibrillator', 'Oxygen Tank', 'Vitals Monitor', 'Trauma Kit']
};

export default function FoodDeliveryTrackingView({ incident, onReset }) {
  const [currentIncident, setCurrentIncident] = useState(incident);

  const rawCat = (incident?.category || '').toUpperCase();
  const rawDesc = (incident?.description || '').toLowerCase();
  const isFireEmergency = rawCat === 'FIRE' || rawCat.includes('FIRE') || rawDesc.includes('fire');
  const isFloodEmergency = rawCat === 'FLOOD' || rawCat.includes('FLOOD') || rawDesc.includes('flood');
  const isCollapseEmergency = rawCat === 'BUILDING_COLLAPSE' || rawCat.includes('COLLAPSE') || rawDesc.includes('collapse');

  const defaultUnit = isFireEmergency
    ? (incident?.assignedFireUnit?.resourceId || incident?.allocatedAgencies?.FIRE?.resourceId || 'FIRE_01')
    : isFloodEmergency
      ? (incident?.assignedRescueUnit?.resourceId || incident?.allocatedAgencies?.RESCUE?.resourceId || 'BOAT_01')
      : isCollapseEmergency
        ? (incident?.assignedRescueUnit?.resourceId || incident?.allocatedAgencies?.RESCUE?.resourceId || 'RESCUE_01')
        : (incident?.assignedAmbulanceId || 'AMB002');

  const defaultHospital = (isFireEmergency || isFloodEmergency)
    ? (incident?.recommendedHospitalName || null)
    : (incident?.recommendedHospitalName || 'Hospital B: CARE Ameerpet');

  const [assignedAmbulanceId, setAssignedAmbulanceId] = useState(defaultUnit);
  const [recommendedHospitalName, setRecommendedHospitalName] = useState(defaultHospital);
  const [etaSeconds, setEtaSeconds] = useState((incident?.etaMinutes || 6) * 60);
  const [breakdownAlert, setBreakdownAlert] = useState(null);
  const [failedAmbulanceId, setFailedAmbulanceId] = useState(null);
  const [reallocationReason, setReallocationReason] = useState(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const category = (currentIncident?.category || incident?.category || 'MEDICAL').toUpperCase();

  // Parse location coordinates
  const citizenCoords = [
    incident?.latitude || incident?.location?.coordinates?.[1] || 17.4375,
    incident?.longitude || incident?.location?.coordinates?.[0] || 78.4482
  ];

  // Coordinates of Hyderabad landmarks
  const landmarkCoords = {
    'Kukatpally': [17.4947, 78.4111],
    'Ameerpet': [17.4375, 78.4482],
    'Hitec City': [17.4435, 78.3800],
    'KPHB': [17.4932, 78.3995],
    'JNTU': [17.4975, 78.3914],
    'Erragadda': [17.4552, 78.4357],
    'SR Nagar': [17.4431, 78.4428],
    'Miyapur': [17.4969, 78.3578],
    'Secunderabad': [17.4399, 78.4983]
  };

  // Hospital destination or Base Station coordinates
  const baseStationCoords = isFireEmergency 
    ? [17.4375, 78.4482] // Ameerpet Fire Station
    : isFloodEmergency 
      ? [17.4399, 78.4983] // Secunderabad Flood Relief Base
      : [17.4375, 78.4482];

  const hospitalCoords = (recommendedHospitalName && typeof recommendedHospitalName === 'string')
    ? (recommendedHospitalName.includes('CARE Ameerpet')
      ? [17.4375, 78.4482]
      : recommendedHospitalName.includes('Medicover')
        ? [17.4435, 78.3800]
        : recommendedHospitalName.includes('Gandhi')
          ? [17.4399, 78.4983]
          : [17.4947, 78.4111])
    : baseStationCoords;

  // Ambulance current coordinates
  const [ambCoords, setAmbCoords] = useState(
    landmarkCoords[incident?.node] 
      ? [landmarkCoords[incident?.node][0] + 0.008, landmarkCoords[incident?.node][1] - 0.008]
      : [citizenCoords[0] + 0.012, citizenCoords[1] - 0.012]
  );

  // Live ETA countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaSeconds(prev => (prev > 15 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Socket.IO real-time scenario updates from backend or driver console
  useEffect(() => {
    const socket = socketService.connect();
    if (!socket) return;

    const handleScenarioUpdate = (payload) => {
      if (payload?.event === 'AMBULANCE_MUTATED' || payload?.event === 'AGENCY_RESOURCE_MUTATED') {
        const failedId = payload.resourceId || payload.ambulanceId;
        setFailedAmbulanceId(failedId);
        setBreakdownAlert({
          status: 'FAILING',
          message: `🚨 BREAKDOWN ALERT reported by field crew for unit ${failedId}! Autonomous Reallocation Engine active...`
        });
        setTimeout(() => {
          setBreakdownAlert({
            status: 'RESOLVED',
            message: `✅ REALLOCATION COMPLETE: Autonomous dispatch routed nearest compatible backup unit with zero response delay.`
          });
        }, 1200);
      }

      if (payload?.state?.incidents) {
        const matching = payload.state.incidents.find(
          i => i.incidentId === currentIncident?.incidentId || i._id === currentIncident?._id ||
               (currentIncident?.node && i.node === currentIncident.node)
        );
        if (matching) {
          setCurrentIncident(matching);

          // Determine the active dispatched unit ID based on incident emergency category
          const newUnitId = isFireEmergency
            ? (matching.assignedFireUnit?.resourceId || matching.allocatedAgencies?.FIRE?.resourceId)
            : isFloodEmergency
              ? (matching.assignedRescueUnit?.resourceId || matching.allocatedAgencies?.RESCUE?.resourceId)
              : (matching.assignedAmbulanceId || matching.allocatedAgencies?.AMBULANCE?.resourceId);

          if (newUnitId && newUnitId !== assignedAmbulanceId) {
            const priorUnit = assignedAmbulanceId;
            setFailedAmbulanceId(priorUnit);
            setAssignedAmbulanceId(newUnitId);
            setEtaSeconds((matching.etaMinutes || 6) * 60);
            setAmbCoords([citizenCoords[0] + 0.012, citizenCoords[1] + 0.008]);
            setReallocationReason(
              `Prior unit ${priorUnit} reported on-road mechanical failure. Dynamic allocation engine autonomously routed nearest backup unit ${newUnitId} from ${isFireEmergency ? 'Fire & Rescue apparatus' : 'emergency fleet'}.`
            );
          }
          if (matching.recommendedHospitalName) {
            setRecommendedHospitalName(matching.recommendedHospitalName);
          }
        }
      }
    };

    const handleBreakdownEvent = (bPayload) => {
      const failedId = bPayload?.ambulanceId || bPayload?.resourceId;
      if (failedId) {
        setFailedAmbulanceId(failedId);
        if (bPayload.replacementId) {
          setAssignedAmbulanceId(bPayload.replacementId);
          setReallocationReason(
            bPayload.reason ||
            `Prior unit ${failedId} reported on-road breakdown. Dynamic allocation engine autonomously routed nearest backup unit ${bPayload.replacementId} from response network.`
          );
        }
      }
    };

    socket.on('scenario:update', handleScenarioUpdate);
    socket.on('ambulance:breakdown', handleBreakdownEvent);
    return () => {
      socket.off('scenario:update', handleScenarioUpdate);
      socket.off('ambulance:breakdown', handleBreakdownEvent);
    };
  }, [currentIncident, assignedAmbulanceId, citizenCoords, isFireEmergency, isFloodEmergency]);

  // Determine Crew & Unit based on category
  let crew = CREW_PROFILES[assignedAmbulanceId] || DEFAULT_CREW;
  if (isFireEmergency) {
    crew = {
      driver: 'Station Officer Ramesh Verma',
      paramedic: 'Squad Commander Anita Singh (Fire & Rescue Squad 4)',
      plate: `TS 09 FR 101`,
      phone: '+91 94400 10101',
      type: 'Fire & Emergency Rescue Squad + Burn Trauma Support',
      equipment: ['Hydraulic Jaws-of-Life', 'Thermal Imaging Camera', 'SCBA Breathing Gear', 'Burn Care Resuscitation Kit', 'Chemical Foam Extinguisher']
    };
  } else if (isFloodEmergency) {
    crew = {
      driver: 'Rescue Pilot Ravi Kiran',
      paramedic: 'NDRF Disaster Specialist Vikram K.',
      plate: `TS 09 WR 105`,
      phone: '+91 95000 44556',
      type: 'NDRF / SDRF Rapid Water Rescue & Evacuation Craft',
      equipment: ['Inflatable Motorized Rescue Boat', 'Hypothermia Thermal Pack', 'Flotation Stretcher', 'Life Vests & Throw Lines']
    };
  }

  const minutesLeft = Math.floor(etaSeconds / 60);
  const secondsLeft = etaSeconds % 60;

  const pointsForBounds = [citizenCoords, ambCoords, hospitalCoords];
  const polylineCoords = [ambCoords, citizenCoords, hospitalCoords];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const missionTitle = isFireEmergency
    ? 'Fire & Rescue Squad is En Route!'
    : isFloodEmergency
      ? 'Water & Disaster Rescue Team is En Route!'
      : category === 'CARDIAC'
        ? 'Cardiac Life Support (ALS) Unit En Route!'
        : 'Emergency Ambulance is En Route!';

  const unitDisplayName = isFireEmergency
    ? `FIRE RESCUE SQUAD (${assignedAmbulanceId})`
    : isFloodEmergency
      ? `WATER RESCUE UNIT (${assignedAmbulanceId})`
      : `UNIT ${assignedAmbulanceId}`;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-500 pb-16 font-sans">
      
      {/* Top Banner / Order Tracking Style Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] tracking-wider uppercase border border-emerald-500/30">
                LIVE EMERGENCY DISPATCH TRACKING
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] tracking-wider uppercase border ${
                isFireEmergency 
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {isFireEmergency ? '🔥 FIRE & RESCUE MISSION' : `Priority: ${currentIncident?.priorityScore || 91}/100 (${currentIncident?.severityCategory || 'CRITICAL'})`}
              </span>
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              {missionTitle}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Tracking dispatched unit for <span className="text-cyan-400 font-semibold">{currentIncident?.address || currentIncident?.node || 'Hyderabad'}</span>. High-priority green corridor clearance assigned.
            </p>
          </div>

          {/* Big Food-Delivery Style ETA Countdown Card */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-4 shadow-xl backdrop-blur">
            <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center ${
              isFireEmergency 
                ? 'bg-orange-500/20 border-orange-500/60 text-orange-400' 
                : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
            }`}>
              {isFireEmergency ? <Flame size={28} className="animate-pulse" /> : <Truck size={28} className="animate-pulse" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">
                Estimated Arrival In
              </span>
              <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {minutesLeft}m {secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}s
              </div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock size={11} className="text-emerald-400" /> Auto-optimizing traffic route
              </span>
            </div>
          </div>
        </div>

        {/* Milestone Progress Stepper (Swiggy / Zomato style) */}
        <div className="mt-6 pt-5 border-t border-slate-700/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center mb-1.5 shadow-md shadow-emerald-500/30">
                <CheckCircle2 size={16} />
              </div>
              <span className="font-bold text-white text-[11px]">
                {isFireEmergency ? '1. Fire Alert Triaged' : '1. Report Triaged'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isFireEmergency ? 'Structural Hazard Verified' : 'AI Severity Evaluated'}
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center mb-1.5 shadow-md shadow-emerald-500/30">
                <CheckCircle2 size={16} />
              </div>
              <span className="font-bold text-white text-[11px]">
                {isFireEmergency ? '2. Rescue Squad Dispatched' : '2. Unit Dispatched'}
              </span>
              <span className="text-[10px] text-slate-400">{unitDisplayName}</span>
            </div>

            {/* Step 3 (Active) */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-black flex items-center justify-center mb-1.5 ring-4 ring-cyan-500/30 shadow-md shadow-cyan-500/40 animate-pulse">
                {isFireEmergency ? <Flame size={16} /> : <Truck size={16} />}
              </div>
              <span className="font-bold text-cyan-400 text-[11px]">3. En Route (Active)</span>
              <span className="text-[10px] text-slate-300">Corridor Cleared</span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold flex items-center justify-center mb-1.5">
                4
              </div>
              <span className="font-semibold text-slate-400 text-[11px]">
                {isFireEmergency ? '4. Fire Control & Extrication' : '4. On-Scene Care'}
              </span>
              <span className="text-[10px] text-slate-500">
                {isFireEmergency ? 'Search & Evacuation' : 'Patient Stabilization'}
              </span>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold flex items-center justify-center mb-1.5">
                5
              </div>
              <span className="font-semibold text-slate-400 text-[11px]">
                {isFireEmergency ? '5. Fire Extinguished' : '5. Hospital Handover'}
              </span>
              <span className="text-[10px] text-slate-500">
                {isFireEmergency ? 'Scene Cleared & Secured' : 'ICU Bed Reserved'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Dynamic Breakdown / Reallocation Notification Banner */}
      <AnimatePresence>
        {breakdownAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xl ${
              breakdownAlert.status === 'FAILING'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            }`}
          >
            <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${
              breakdownAlert.status === 'FAILING' ? 'text-rose-400 animate-bounce' : 'text-emerald-400'
            }`} />
            <div className="flex-1">
              <h4 className="font-bold text-sm tracking-wide">
                {breakdownAlert.status === 'FAILING' ? 'Critical Dispatch Alert' : 'Dynamic Reallocation Successful'}
              </h4>
              <p className="text-xs mt-1 leading-relaxed">{breakdownAlert.message}</p>
              {reallocationReason && (
                <div className="mt-2 p-2.5 rounded bg-black/40 border border-slate-700 font-mono text-[11px] text-slate-300">
                  <span className="text-cyan-400 font-bold uppercase block mb-0.5">Autonomous Reallocation Reason:</span>
                  {reallocationReason}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Interactive Real OpenStreetMap + Driver & Hospital Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Interactive Real OpenStreetMap */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <Navigation className="text-cyan-400 w-4 h-4" />
              <h3 className="font-bold text-white text-sm">Real OpenStreetMap GPS Corridor</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">
                Corridor: {incident?.routeSummary || `${assignedAmbulanceId} → ${currentIncident?.node || 'Citizen'} → Hospital`}
              </span>
            </div>
          </div>

          {/* Leaflet Map with Real Clean OpenStreetMap Tiles (No watermark) */}
          <div className="h-[380px] w-full relative z-0">
            <MapContainer
              center={citizenCoords}
              zoom={13}
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <AutoBounds points={pointsForBounds} />

              {/* Citizen Marker */}
              <Marker position={citizenCoords} icon={citizenIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <p className="font-bold text-rose-600">Your Emergency Location</p>
                    <p className="text-slate-700">{currentIncident?.address || 'Pickup Point'}</p>
                    <p className="font-mono text-[10px] text-slate-500">Node: {currentIncident?.node || 'Hyderabad'}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Active Assigned Unit Marker */}
              <Marker position={ambCoords} icon={isFireEmergency ? fireRescueIcon : ambulanceIcon}>
                <Popup>
                  <div className="text-xs p-1">
                    <p className="font-bold text-blue-600">{unitDisplayName}</p>
                    <p className="text-slate-700">{crew.type}</p>
                    <p className="text-emerald-600 font-bold font-mono">ETA: ~{minutesLeft}m</p>
                  </div>
                </Popup>
              </Marker>

              {/* Failed Ambulance Marker if breakdown simulated */}
              {failedAmbulanceId && (
                <Marker position={[citizenCoords[0] - 0.015, citizenCoords[1] - 0.015]} icon={failedAmbulanceIcon}>
                  <Popup>
                    <div className="text-xs p-1">
                      <p className="font-bold text-amber-600">Failed Unit: {failedAmbulanceId}</p>
                      <p className="text-rose-600 font-semibold">Status: OFFLINE (Mechanical Stall)</p>
                      <p className="text-slate-500">Replaced by: {assignedAmbulanceId}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Facility Marker: Fire Station Base / Flood Command / Hospital */}
              <Marker 
                position={hospitalCoords} 
                icon={isFireEmergency ? fireStationIcon : (isFloodEmergency ? floodStationIcon : hospitalIcon)}
              >
                <Popup>
                  <div className="text-xs p-1">
                    {isFireEmergency ? (
                      <>
                        <p className="font-bold text-orange-600">Dispatched Fire Station Base</p>
                        <p className="text-slate-800">Station 04: Ameerpet Fire Station</p>
                        <p className="text-orange-600 font-bold">✓ 2 Fire Tenders Deployed</p>
                      </>
                    ) : isFloodEmergency ? (
                      <>
                        <p className="font-bold text-violet-600">Disaster Water Rescue Base</p>
                        <p className="text-slate-800">NDRF / SDRF Flood Response Base</p>
                        <p className="text-violet-600 font-bold">✓ Rescue Boat & Divers Deployed</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-green-700">Destination Hospital</p>
                        <p className="text-slate-800">{recommendedHospitalName}</p>
                        <p className="text-emerald-700 font-bold">✓ ICU Bed Pre-Reserved</p>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Polyline Route */}
              <Polyline
                positions={polylineCoords}
                pathOptions={{
                  color: isFireEmergency ? '#f97316' : '#06b6d4',
                  weight: 5,
                  opacity: 0.85,
                  dashArray: '8, 8'
                }}
              />
            </MapContainer>
          </div>

          {/* Telemetry and Link to Dedicated Ambulance Driver MDT Console */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Vehicle Telemetry: {unitDisplayName} Connected
              </span>
              <p className="text-[11px] text-slate-400">
                {isFireEmergency 
                  ? 'Fire & Rescue transponder active. Green emergency corridor cleared.'
                  : 'Paramedic transponder active at 10 Hz. Real-time corridor tracking enabled.'}
              </p>
            </div>

            <Link
              to={`/driver?unit=${assignedAmbulanceId}&incidentId=${currentIncident?.incidentId || currentIncident?._id || ''}`}
              target="_blank"
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              <span>
                {isFireEmergency 
                  ? 'Fire & Rescue Console (Field Crew MDT)' 
                  : isFloodEmergency 
                    ? 'Water Rescue Console (Field Crew MDT)' 
                    : 'Ambulance Driver Console (Field Crew MDT)'}
              </span>
            </Link>
          </div>
        </div>

        {/* Column 3: Paramedic / Rescue Crew Profile & Hospital Destination Cards */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Driver & Rescue Crew Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <UserCheck size={13} className="text-cyan-400" />
                {isFireEmergency ? 'Assigned Fire & Rescue Squad' : 'Assigned Emergency Crew'}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold">
                {assignedAmbulanceId}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-base shadow-md ${
                isFireEmergency 
                  ? 'bg-orange-500/20 border-orange-400 text-orange-400'
                  : 'bg-slate-800 border-cyan-400 text-cyan-400'
              }`}>
                {isFireEmergency ? <Flame size={20} /> : crew.driver[0]}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm">{crew.driver}</h4>
                <p className="text-[11px] text-slate-400">{crew.paramedic}</p>
                <span className="text-[10px] text-cyan-300 font-mono mt-0.5 block">{crew.plate}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Response Unit:</span>
                <span className="font-bold text-white">{crew.type}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Onboard Equipment:</span>
                <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                  {crew.equipment.slice(0, 2).join(', ')}...
                </span>
              </div>
            </div>

            <button
              onClick={() => setCallModalOpen(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Phone size={14} />
              <span>Contact Response Crew ({crew.driver.split(' ')[0]})</span>
            </button>
          </div>

          {/* Facility Card: Dynamically Dispatched Fire Station vs Water Rescue Base vs Hospital */}
          {isFireEmergency ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <Flame size={13} className="text-orange-400" />
                  Dispatched Fire Station Base
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold">
                  Fire Apparatus Active
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">Telangana Fire Services • Ameerpet Fire Station (Station 04)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immediate Fire Suppression, Structural Rescue & Smoke Evacuation
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-800/60 flex items-center gap-2 text-xs text-orange-300">
                <CheckCircle2 size={16} className="text-orange-400 shrink-0" />
                <span>2 Fire Tenders (6,000L Water + AFFF Foam) & Hydraulic Snorkel Ladder deployed.</span>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                Standby Medical: Emergency burn paramedic unit en route alongside fire squad.
              </p>
            </div>
          ) : isFloodEmergency ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <LifeBuoy size={13} className="text-cyan-400" />
                  Disaster Water Rescue Headquarters
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                  Rescue Craft Deployed
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">NDRF / SDRF Flood Response Command Base</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Urban Flood Inundation & Rapid Water Evacuation Division
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center gap-2 text-xs text-cyan-300">
                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                <span>2 Motorized Rescue Boats, Diver Squad & Life Rafts deployed to scene.</span>
              </div>
            </div>
          ) : recommendedHospitalName ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Hospital size={13} className="text-emerald-400" />
                  Receiving Hospital
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  ICU Confirmed
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">{recommendedHospitalName}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  24/7 Level-1 Emergency & Trauma Care
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>1 Emergency ICU Bed reserved with oxygen and life support readiness.</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mission Status</span>
              <h4 className="font-bold text-white text-sm">On-Scene Containment & Rapid Intervention</h4>
              <p className="text-xs text-slate-400">No medical hospital transfer required. Emergency crew deployed for on-scene containment.</p>
            </div>
          )}

          {/* Share / Support Action */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Share2 size={12} />
              <span>{copiedLink ? 'Link Copied!' : 'Share Tracking'}</span>
            </button>

            {onReset && (
              <button
                onClick={onReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                New Report
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Emergency Clinical Summary Accordion */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity size={16} className="text-rose-400" />
          Clinical Severity Triage & Resource Estimation Breakdown
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Incident Code</span>
            <span className="font-mono font-bold text-white text-xs">{currentIncident?.incidentId || currentIncident?._id || 'INC_LIVE'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
            <span className="font-bold text-white text-xs">{currentIncident?.category || 'MEDICAL_EMERGENCY'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Triage Priority</span>
            <span className="font-bold text-rose-400 text-xs">
              {currentIncident?.priorityScore || 91}/100 ({currentIncident?.severityCategory || 'CRITICAL'})
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Capability</span>
            <span className="font-mono font-bold text-cyan-300 text-xs">
              {currentIncident?.requiredCapability || (isFireEmergency ? 'rescue_team' : 'ADVANCED_LIFE_SUPPORT')}
            </span>
          </div>
        </div>

        {currentIncident?.description && (
          <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-0.5">Reported Description & Symptoms:</span>
            {currentIncident.description}
          </p>
        )}
      </div>

      {/* Authority Command Center Access Link */}
      <div className="pt-2 text-center">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition shadow-sm"
        >
          {isFireEmergency ? <Flame size={14} className="text-orange-400" /> : <Hospital size={14} className="text-emerald-400" />}
          <span>{isFireEmergency ? 'Central Fire & Emergency Command Center →' : 'Hospital Operations & Dispatcher Command Center →'}</span>
        </Link>
      </div>

      {/* Simulated Call Crew Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/50 animate-bounce">
              <Phone size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Calling {crew.driver}...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Connecting to Emergency Unit {assignedAmbulanceId} on-duty comms
              </p>
              <p className="font-mono text-emerald-400 font-bold mt-2">{crew.phone}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800 text-slate-300 text-xs leading-relaxed">
              {isFireEmergency 
                ? '"Fire & Rescue Squad is 2 minutes away. Please evacuate the premises and move to open air immediately."'
                : '"Ambulance is currently 2.1 km away. Please keep patient seated and ensure building entrance is clear for the stretcher."'}
            </div>
            <button
              onClick={() => setCallModalOpen(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
            >
              End Call
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
