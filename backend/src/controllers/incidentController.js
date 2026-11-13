const Incident = require('../models/Incident');
const { resQFlowStore } = require('../services/resQFlowStore');
const { computerVisionService } = require('../services/computerVisionService');

// @desc    Create new incident (Full End-to-End Triage & Allocation Pipeline)
// @route   POST /api/incidents
// @access  Public / Private
const createIncident = async (req, res, next) => {
  try {
    const { 
      category, 
      description, 
      latitude, 
      longitude, 
      address, 
      affectedPeople, 
      isMedicalEmergency,
      symptoms,
      hazards,
      reporterName,
      reporterPhone,
      image,
      imageData
    } = req.body;
    
    // Process media files if uploaded
    const mediaPaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        mediaPaths.push(`/uploads/${req.body.type === 'evidence' ? 'evidence' : 'incidents'}/${file.filename}`);
      });
    }

    const rawImage = image || imageData || (req.files && req.files[0] ? req.files[0].path : null);
    let visualAssessment = null;
    let combinedHazards = Array.isArray(hazards) ? [...hazards] : (hazards ? [hazards] : []);

    if (rawImage) {
      try {
        visualAssessment = await computerVisionService.analyzeEmergencyImage(rawImage, {
          category: category || 'GENERAL_EMERGENCY',
          address,
          description
        });
        if (visualAssessment?.detectedHazards) {
          visualAssessment.detectedHazards.forEach(h => {
            if (!combinedHazards.includes(h)) combinedHazards.push(h);
          });
        }
      } catch (cvErr) {
        console.warn('[INCIDENT CONTROLLER] Computer vision non-blocking skip:', cvErr.message);
      }
    }

    const incidentId = 'INC-' + Date.now().toString().slice(-6);
    const validLat = parseFloat(latitude || 17.4947);
    const validLng = parseFloat(longitude || 78.4111);

    // 1. Run full end-to-end clinical triage, resource prediction, and Hungarian dispatch
    const registered = resQFlowStore.registerIncident({
      incidentId,
      category: category || 'GENERAL_EMERGENCY',
      description,
      address,
      latitude: validLat,
      longitude: validLng,
      location: {
        type: 'Point',
        coordinates: [validLng, validLat]
      },
      affectedPeople: affectedPeople ? parseInt(affectedPeople, 10) : 1,
      isMedicalEmergency: isMedicalEmergency === 'true' || isMedicalEmergency === true,
      symptoms,
      hazards: combinedHazards,
      visualAssessment
    });

    const enriched = registered.incident;

    // 2. Persist to MongoDB (with safe in-memory fallback if DB is unseeded)
    let mongoIncident = null;
    try {
      mongoIncident = await Incident.create({
        incidentId,
        reportedBy: req.user ? req.user._id : undefined,
        category: enriched.category,
        description: enriched.description,
        location: {
          type: 'Point',
          coordinates: [validLng, validLat]
        },
        address: enriched.address,
        node: enriched.node,
        locationName: enriched.locationName,
        media: mediaPaths,
        affectedPeople: enriched.affectedPeople,
        people_affected: enriched.affectedPeople,
        isMedicalEmergency: enriched.isMedicalEmergency || false,
        priorityScore: enriched.priorityScore,
        priority: enriched.priorityScore,
        severityCategory: enriched.severityCategory,
        requiredCapability: enriched.requiredCapability,
        required_capability: enriched.requiredCapability,
        assignedAmbulanceId: enriched.assignedAmbulanceId,
        recommendedHospitalId: enriched.recommendedHospitalId,
        etaMinutes: enriched.etaMinutes,
        routeSummary: enriched.routeSummary,
        status: enriched.status,
        severity: Math.round(enriched.priorityScore / 10),
        severityScore: enriched.priorityScore,
        aiConfidence: enriched.severityAssessment?.confidenceScore || 0.9,
        aiAnalysis: enriched.severityAssessment
      });
    } catch (dbErr) {
      console.warn('MongoDB sync notice (in-memory active):', dbErr.message);
    }

    const responsePayload = mongoIncident ? { ...mongoIncident.toObject(), ...enriched } : enriched;

    // 3. Broadcast real-time Socket.IO notifications to central Command Center
    if (req.io) {
      req.io.emit('scenario:update', {
        event: 'LIVE_INCIDENT_REPORTED',
        incident: responsePayload,
        allocation: registered.allocation,
        state: registered.state
      });
      req.io.emit('incident:created', responsePayload);
    }

    return res.status(201).json({ 
      success: true, 
      message: enriched.status === 'ASSIGNED'
        ? `Emergency dispatched: ${enriched.assignedAmbulanceId || enriched.assignedPrimaryUnit || 'Emergency Squad'} assigned with ${enriched.etaMinutes || 6}m ETA.`
        : 'Emergency placed in priority queue. Fleet units currently saturated.',
      data: responsePayload,
      allocation: registered.allocation,
      state: registered.state
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    next(error);
  }
};

// @desc    Get all active incidents (Dispatcher view)
// @route   GET /api/incidents
// @access  Private (Dispatcher, Admin)
const getIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.find({
      status: { $nin: ['RESOLVED', 'CANCELLED'] }
    }).populate('reportedBy', 'name phone').sort('-createdAt');
    
    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name phone')
      .populate('assignedAmbulance');
      
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    
    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
};

// @desc    Update incident status (Full Lifecycle State Machine)
// @route   PATCH /api/incidents/:id/status
// @access  Public / Private
const updateIncidentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const incId = req.params.id;
    
    // 1. Update in-memory resQFlowStore state
    let updatedStoreState = null;
    try {
      updatedStoreState = resQFlowStore.updateIncidentStatus(incId, status);
    } catch (storeErr) {
      console.warn('Store update warning:', storeErr.message);
    }

    // 2. Update MongoDB record if it exists
    const updateData = { status };
    if (status === 'RESOLVED') {
      updateData.resolvedAt = Date.now();
    }

    let incident = null;
    try {
      incident = await Incident.findOneAndUpdate(
        { $or: [{ _id: incId }, { incidentId: incId }] },
        updateData,
        { new: true, runValidators: true }
      );
    } catch (dbErr) {
      console.warn('DB update notice:', dbErr.message);
    }
    
    // 3. Broadcast status change across Socket.IO
    if (req.io) {
      req.io.emit('incident:status', incident || { _id: incId, incidentId: incId, status });
      if (updatedStoreState) {
        req.io.emit('scenario:update', {
          event: 'INCIDENT_STATUS_UPDATED',
          incidentId: incId,
          status,
          state: updatedStoreState
        });
      }
    }
    
    return res.json({ 
      success: true, 
      message: `Incident ${incId} transitioned to ${status}.`,
      data: incident || { incidentId: incId, status },
      state: updatedStoreState
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical incidents with filtering (Reports view)
// @route   GET /api/incidents/historical
// @access  Private
const getHistoricalIncidents = async (req, res, next) => {
  try {
    const { year, city, state, severity, category, ambulanceType, outcome, limit } = req.query;
    
    let filter = { status: 'RESOLVED' };
    
    if (year) {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      filter.reportedAt = { $gte: startDate, $lte: endDate };
    }
    
    if (city) filter.city = city;
    if (state) filter.state = state;
    
    if (severity) {
      if (severity === 'CRITICAL') filter.severity = { $gte: 9 };
      else if (severity === 'HIGH') filter.severity = { $gte: 7, $lt: 9 };
      else if (severity === 'MODERATE') filter.severity = { $lt: 7 };
    }
    
    if (category) filter.category = category;
    if (ambulanceType) filter.ambulanceType = ambulanceType;
    if (outcome) filter.outcome = outcome;

    let query = Incident.find(filter).sort('-reportedAt');
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const incidents = await query;
    
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getHistoricalIncidents
};
