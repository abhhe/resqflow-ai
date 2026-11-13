import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import FoodDeliveryTrackingView from '../components/FoodDeliveryTrackingView';
import { apiService } from '../services/apiService';
import { RefreshCw, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function LiveTrackingPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIncident = async () => {
      try {
        setLoading(true);
        const stateRes = await apiService.getScenarioState();
        if (stateRes?.data?.incidents) {
          const matching = id 
            ? stateRes.data.incidents.find(i => i.incidentId === id || i._id === id)
            : stateRes.data.incidents[0];

          if (matching) {
            setIncident(matching);
          } else {
            // Default demo incident
            setIncident(stateRes.data.incidents[0] || {
              incidentId: id || 'INC_CITIZEN_101',
              category: 'CARDIAC',
              priorityScore: 91,
              severityCategory: 'CRITICAL',
              address: 'Ameerpet Metro Station, Hyderabad',
              node: 'Ameerpet',
              assignedAmbulanceId: 'AMB002',
              recommendedHospitalName: 'Hospital B: CARE Ameerpet',
              etaMinutes: 6,
              requiredCapability: 'als',
              description: 'Elderly patient collapsed, unresponsive with chest tightness.'
            });
          }
        }
      } catch (err) {
        console.error('Failed to load tracking incident:', err);
        // Fallback
        setIncident({
          incidentId: id || 'INC_DEMO_TRACK',
          category: 'CARDIAC',
          priorityScore: 91,
          severityCategory: 'CRITICAL',
          address: 'Ameerpet, Hyderabad',
          node: 'Ameerpet',
          assignedAmbulanceId: 'AMB002',
          recommendedHospitalName: 'Hospital B: CARE Ameerpet',
          etaMinutes: 6,
          requiredCapability: 'als',
          description: 'Emergency response en route.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadIncident();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <RefreshCw size={32} className="animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-slate-300">Connecting to Live Ambulance GPS Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <Link 
          to="/report" 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          <span>Back to Emergency Report</span>
        </Link>
        <span className="text-[11px] font-mono text-cyan-400">
          Tracking ID: {incident?.incidentId || id || 'ACTIVE'}
        </span>
      </div>

      <FoodDeliveryTrackingView incident={incident} />
    </div>
  );
}

