/**
 * Hyderabad Demonstration Seed Data Module
 * Problem Statement: PS10 - ResQFlow AI
 * 
 * NOTE: All hospital capacities, ambulance positions, and response values
 * are explicitly labeled as SIMULATED DEMONSTRATION DATA, not real live APIs.
 */

const { HYDERABAD_NODES } = require('../services/hyderabadGraphRouter');

const SIMULATED_DATA_NOTICE = 'SIMULATED DEMONSTRATION DATA - NOT LIVE GOVT/HOSPITAL FEED';

function getInitialHospitals() {
  return [
    {
      _id: 'HOSP_A',
      hospitalId: 'HOSP_A',
      name: 'Hospital A: KIMS Erragadda',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Erragadda',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Erragadda'].coordinates
      },
      address: 'Main Road, Erragadda, Hyderabad, Telangana 500018',
      emergencyDepartment: true,
      traumaCenter: true,
      traumaLevel: 1,
      traumaCapable: true,
      icuAvailable: true,
      totalIcuBeds: 12,
      availableIcuBeds: 12,
      icuBeds: 12,
      totalGeneralBeds: 40,
      availableGeneralBeds: 40,
      bedsAvailable: 40,
      emergencyCapacity: 90,
      specialties: ['trauma', 'general', 'icu', 'surgery', 'orthopedics'],
      status: 'AVAILABLE',
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'HOSP_B',
      hospitalId: 'HOSP_B',
      name: 'Hospital B: CARE Ameerpet',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Ameerpet',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Ameerpet'].coordinates
      },
      address: 'Ameerpet Junction, Hyderabad, Telangana 500016',
      emergencyDepartment: true,
      traumaCenter: true,
      traumaLevel: 1,
      traumaCapable: true,
      icuAvailable: true,
      totalIcuBeds: 8,
      availableIcuBeds: 8,
      icuBeds: 8,
      totalGeneralBeds: 50,
      availableGeneralBeds: 50,
      bedsAvailable: 50,
      emergencyCapacity: 95,
      specialties: ['cardiology', 'als', 'icu', 'neurology', 'general'],
      status: 'AVAILABLE',
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'HOSP_C',
      hospitalId: 'HOSP_C',
      name: 'Hospital C: Medicover Hitec City',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Hitec City',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Hitec City'].coordinates
      },
      address: 'Cyber Towers Road, Hitec City, Hyderabad, Telangana 500081',
      emergencyDepartment: true,
      traumaCenter: true,
      traumaLevel: 1,
      traumaCapable: true,
      icuAvailable: true,
      totalIcuBeds: 15,
      availableIcuBeds: 15,
      icuBeds: 15,
      totalGeneralBeds: 60,
      availableGeneralBeds: 60,
      bedsAvailable: 60,
      emergencyCapacity: 85,
      specialties: ['cardiology', 'trauma', 'als', 'icu', 'flooding_trauma', 'pediatrics'],
      status: 'AVAILABLE',
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'HOSP_D',
      hospitalId: 'HOSP_D',
      name: 'Hospital D: Gandhi Specialized Burn & Trauma Center',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Secunderabad',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Secunderabad'].coordinates
      },
      address: 'Musheerabad, Secunderabad, Telangana 500003',
      emergencyDepartment: true,
      traumaCenter: true,
      traumaLevel: 1,
      traumaCapable: true,
      icuAvailable: true,
      totalIcuBeds: 10,
      availableIcuBeds: 10,
      icuBeds: 10,
      totalGeneralBeds: 80,
      availableGeneralBeds: 80,
      bedsAvailable: 80,
      emergencyCapacity: 80,
      specialties: ['burns', 'burn_care', 'trauma', 'icu', 'pulmonary', 'surgery', 'general'],
      status: 'AVAILABLE',
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'HOSP_E',
      hospitalId: 'HOSP_E',
      name: 'Hospital E: Yashoda Toxic & Decontamination Center',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Ameerpet',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Ameerpet'].coordinates
      },
      address: 'Raj Bhavan Road, Somajiguda, Hyderabad, Telangana 500082',
      emergencyDepartment: true,
      traumaCenter: true,
      traumaLevel: 1,
      traumaCapable: true,
      icuAvailable: true,
      totalIcuBeds: 6,
      availableIcuBeds: 6,
      icuBeds: 6,
      totalGeneralBeds: 50,
      availableGeneralBeds: 50,
      bedsAvailable: 50,
      emergencyCapacity: 85,
      specialties: ['hazmat', 'toxicology', 'decontamination', 'chemical_exposure', 'icu', 'general', 'trauma'],
      status: 'AVAILABLE',
      dataSource: SIMULATED_DATA_NOTICE
    }
  ];
}

function getInitialAmbulances() {
  return [
    {
      _id: 'AMB001',
      ambulanceId: 'AMB001',
      registrationNumber: 'TS-09-EA-0001',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Kukatpally',
      type: 'ADVANCED_LIFE_SUPPORT',
      capabilities: ['trauma', 'als', 'basic_life_support', 'rescue_team'],
      status: 'AVAILABLE',
      driverName: 'Suresh Kumar',
      driverPhone: '+91 98480 11001',
      currentLocation: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Kukatpally'].coordinates
      },
      currentAssignment: null,
      currentIncidentId: null,
      etaMinutes: 0,
      speed: 0,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'AMB002',
      ambulanceId: 'AMB002',
      registrationNumber: 'TS-09-EA-0002',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Ameerpet',
      type: 'ADVANCED_LIFE_SUPPORT',
      capabilities: ['als', 'basic_life_support'],
      status: 'AVAILABLE',
      driverName: 'Ramesh Reddy',
      driverPhone: '+91 98480 11002',
      currentLocation: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Ameerpet'].coordinates
      },
      currentAssignment: null,
      currentIncidentId: null,
      etaMinutes: 0,
      speed: 0,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'AMB003',
      ambulanceId: 'AMB003',
      registrationNumber: 'TS-09-EA-0003',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Erragadda',
      type: 'ADVANCED_LIFE_SUPPORT',
      capabilities: ['trauma', 'basic_life_support', 'rescue_team', 'fire_rescue'],
      status: 'AVAILABLE',
      driverName: 'Venkat Rao',
      driverPhone: '+91 98480 11003',
      currentLocation: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Erragadda'].coordinates
      },
      currentAssignment: null,
      currentIncidentId: null,
      etaMinutes: 0,
      speed: 0,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'AMB004',
      ambulanceId: 'AMB004',
      registrationNumber: 'TS-09-EA-0004',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'SR Nagar',
      type: 'BASIC_LIFE_SUPPORT',
      capabilities: ['basic_life_support'],
      status: 'AVAILABLE',
      driverName: 'Mohd Irfan',
      driverPhone: '+91 98480 11004',
      currentLocation: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['SR Nagar'].coordinates
      },
      currentAssignment: null,
      currentIncidentId: null,
      etaMinutes: 0,
      speed: 0,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'AMB005',
      ambulanceId: 'AMB005',
      registrationNumber: 'TS-09-EA-0005',
      city: 'Hyderabad',
      state: 'Telangana',
      node: 'Miyapur',
      type: 'PATIENT_TRANSPORT',
      // Equipped with rescue_boat and basic life support for flood rescue
      capabilities: ['rescue_boat', 'basic_life_support', 'rescue_team'],
      status: 'AVAILABLE',
      driverName: 'K. Anand',
      driverPhone: '+91 98480 11005',
      currentLocation: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Miyapur'].coordinates
      },
      currentAssignment: null,
      currentIncidentId: null,
      etaMinutes: 0,
      speed: 0,
      dataSource: SIMULATED_DATA_NOTICE
    }
  ];
}

/**
 * Canonical 10:30 AM Scenario Emergencies (deterministic inputs)
 */
function getCanonical1030AmIncidents() {
  return [
    {
      _id: 'INC_A',
      incidentId: 'INC_A',
      title: 'Incident A: Road Accident',
      category: 'ROAD_ACCIDENT',
      locationName: 'Kukatpally',
      node: 'Kukatpally',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Kukatpally'].coordinates
      },
      affectedPeople: 5,
      people_affected: 5,
      priorityScore: 90,
      priority: 90,
      severity: 8,
      severityCategory: 'HIGH',
      requiredCapability: 'trauma',
      required_capability: 'trauma',
      isMedicalEmergency: true,
      description: 'Five people injured in a road accident near Kukatpally.',
      status: 'PENDING',
      assignedAmbulance: null,
      assignedAmbulanceId: null,
      recommendedHospital: null,
      recommendedHospitalId: null,
      createdAt: '2026-11-13T10:30:00.000Z',
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'INC_B',
      incidentId: 'INC_B',
      title: 'Incident B: Cardiac Emergency',
      category: 'CARDIAC',
      locationName: 'Ameerpet',
      node: 'Ameerpet',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Ameerpet'].coordinates
      },
      affectedPeople: 1,
      people_affected: 1,
      priorityScore: 97,
      priority: 97,
      severity: 10,
      severityCategory: 'CRITICAL',
      requiredCapability: 'als',
      required_capability: 'als',
      isMedicalEmergency: true,
      description: 'A person is having a cardiac emergency in Ameerpet.',
      status: 'PENDING',
      assignedAmbulance: null,
      assignedAmbulanceId: null,
      recommendedHospital: null,
      recommendedHospitalId: null,
      createdAt: '2026-11-13T10:30:00.000Z',
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'INC_C',
      incidentId: 'INC_C',
      title: 'Incident C: Urban Flooding',
      category: 'FLOOD',
      locationName: 'Miyapur',
      node: 'Miyapur',
      location: {
        type: 'Point',
        coordinates: HYDERABAD_NODES['Miyapur'].coordinates
      },
      affectedPeople: 4,
      people_affected: 4,
      priorityScore: 85,
      priority: 85,
      severity: 8,
      severityCategory: 'HIGH',
      requiredCapability: 'rescue_boat',
      required_capability: 'rescue_boat',
      isMedicalEmergency: true,
      description: 'Four people trapped in flooding near Miyapur.',
      status: 'PENDING',
      assignedAmbulance: null,
      assignedAmbulanceId: null,
      recommendedHospital: null,
      recommendedHospitalId: null,
      createdAt: '2026-11-13T10:30:00.000Z',
      dataSource: SIMULATED_DATA_NOTICE
    }
  ];
}

/**
 * 4th Emergency for Mutation Demonstration
 */
function getFourthIncident() {
  return {
    _id: 'INC_D',
    incidentId: 'INC_D',
    title: 'Incident D: High-Rise Fall',
    category: 'TRAUMA',
    locationName: 'JNTU',
    node: 'JNTU',
    location: {
      type: 'Point',
      coordinates: HYDERABAD_NODES['JNTU'].coordinates
    },
    affectedPeople: 1,
    people_affected: 1,
    priorityScore: 78,
    priority: 78,
    severity: 7,
    severityCategory: 'HIGH',
    requiredCapability: 'trauma',
    required_capability: 'trauma',
    isMedicalEmergency: true,
    description: 'A construction worker suffered a fall injury near JNTU.',
    status: 'PENDING',
    assignedAmbulance: null,
    assignedAmbulanceId: null,
    recommendedHospital: null,
    recommendedHospitalId: null,
    createdAt: new Date().toISOString(),
    dataSource: SIMULATED_DATA_NOTICE
  };
}

function getInitialMultiAgencyResources() {
  return [
    // Fire & Rescue Apparatus
    {
      _id: 'FIRE_01',
      resourceId: 'FIRE_01',
      agency: 'FIRE',
      name: 'Telangana Fire Services Engine 01',
      type: 'FIRE_ENGINE',
      node: 'Ameerpet',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Ameerpet'].coordinates },
      capabilities: ['fire_suppression', 'water_tender', 'foam_cannons', 'fire_extrication', 'rescue_team'],
      waterCapacityLitres: 6000,
      foamCapacityLitres: 500,
      crew: 'Station Officer Ramesh Verma & 5 Firefighters',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'FIRE_02',
      resourceId: 'FIRE_02',
      agency: 'FIRE',
      name: 'Fire Services Heavy Snorkel & Extrication Tender',
      type: 'SNORKEL_LADDER',
      node: 'Secunderabad',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Secunderabad'].coordinates },
      capabilities: ['high_rise_rescue', 'hydraulic_snorkel', 'fire_suppression', 'heavy_extrication'],
      ladderHeightMeters: 42,
      crew: 'Squad Commander Vinay P. & 4 Rescuers',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    // Search & Rescue
    {
      _id: 'RESCUE_01',
      resourceId: 'RESCUE_01',
      agency: 'RESCUE',
      name: 'Urban Search & Rescue Squad (USAR-1)',
      type: 'RESCUE_TEAM',
      node: 'Erragadda',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Erragadda'].coordinates },
      capabilities: ['search_and_rescue', 'structural_collapse', 'hydraulic_cutters', 'acoustic_listening', 'rescue_team', 'extrication'],
      crew: 'USAR Lead Vikram Rathod & 6 Rescue Specialists',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'BOAT_01',
      resourceId: 'BOAT_01',
      agency: 'RESCUE',
      name: 'NDRF Rapid Water Rescue Craft',
      type: 'RESCUE_BOAT',
      node: 'Miyapur',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Miyapur'].coordinates },
      capabilities: ['water_rescue', 'rescue_boat', 'flood_evacuation', 'diver_unit'],
      capacity: 8,
      crew: 'Pilot Ravi Kiran & 3 Rescue Divers',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    // Police & Law Enforcement
    {
      _id: 'POLICE_01',
      resourceId: 'POLICE_01',
      agency: 'POLICE',
      name: 'Hyderabad Law Enforcement Sector Patrol 01',
      type: 'PATROL_CAR',
      node: 'Ameerpet',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Ameerpet'].coordinates },
      capabilities: ['perimeter_security', 'crowd_control', 'public_safety', 'cordon', 'evacuation_support'],
      crew: 'Sub-Inspector Rajesh Nayak & 3 Officers',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    // Traffic Police & Road Clearance
    {
      _id: 'TRAFFIC_01',
      resourceId: 'TRAFFIC_01',
      agency: 'TRAFFIC',
      name: 'Hyderabad Traffic Rapid Clearance Unit 01',
      type: 'TRAFFIC_PATROL',
      node: 'Kukatpally',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Kukatpally'].coordinates },
      capabilities: ['traffic_diversion', 'road_clearance', 'towing_winch', 'green_corridor', 'traffic_police'],
      towingEquipped: true,
      crew: 'Traffic Inspector Anand Kumar & 2 Officers',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    {
      _id: 'TRAFFIC_02',
      resourceId: 'TRAFFIC_02',
      agency: 'TRAFFIC',
      name: 'Hyderabad Traffic Sector Unit 02',
      type: 'TRAFFIC_PATROL',
      node: 'Erragadda',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Erragadda'].coordinates },
      capabilities: ['traffic_diversion', 'road_clearance', 'green_corridor', 'traffic_police'],
      crew: 'Traffic Sub-Inspector K. Murthy & 2 Officers',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    // Hazardous Materials (HazMat)
    {
      _id: 'HAZMAT_01',
      resourceId: 'HAZMAT_01',
      agency: 'HAZMAT',
      name: 'Telangana Disaster HazMat Response Unit',
      type: 'HAZMAT_TEAM',
      node: 'Hitec City',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['Hitec City'].coordinates },
      capabilities: ['hazmat', 'chemical_containment', 'gas_leak_neutralization', 'decontamination_tent', 'hazmat_suit_level_a'],
      crew: 'HazMat Specialist Dr. Tarun Sen & 4 Technicians',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    },
    // Structural Safety Specialists
    {
      _id: 'STRUCT_01',
      resourceId: 'STRUCT_01',
      agency: 'SPECIALIZED',
      name: 'GHMC Structural Safety & Building Collapse Evaluation Team',
      type: 'STRUCTURAL_ENGINEERING',
      node: 'KPHB',
      location: { type: 'Point', coordinates: HYDERABAD_NODES['KPHB'].coordinates },
      capabilities: ['structural_evaluation', 'collapse_shoring', 'structural_safety', 'rubble_stabilization'],
      crew: 'Chief Structural Engineer Prakash Rao & 2 Engineers',
      status: 'AVAILABLE',
      currentAssignment: null,
      currentIncidentId: null,
      dataSource: SIMULATED_DATA_NOTICE
    }
  ];
}

module.exports = {
  SIMULATED_DATA_NOTICE,
  getInitialHospitals,
  getInitialAmbulances,
  getInitialMultiAgencyResources,
  getCanonical1030AmIncidents,
  getFourthIncident
};
