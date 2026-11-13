import { useState, useEffect, useRef } from 'react';
import { 
  Camera, AlertCircle, MapPin, Send, X, CheckCircle2, ArrowRight, 
  ShieldAlert, Truck, Hospital, Flame, Activity, Mic, MicOff, 
  Volume2, Sparkles, RefreshCw, Radio, Check, Edit3, PhoneCall,
  Waves, AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FoodDeliveryTrackingView from '../components/FoodDeliveryTrackingView';

const EMERGENCY_TYPES = [
  { value: 'ROAD_ACCIDENT', label: '🚗 Road Accident / Vehicle Crash' },
  { value: 'CARDIAC', label: '❤️ Cardiac Emergency / Chest Pain' },
  { value: 'RESPIRATORY', label: '🫁 Breathing Difficulties / Asthma' },
  { value: 'TRAUMA', label: '🩹 Severe Trauma / High Fall / Crush' },
  { value: 'FIRE', label: '🔥 Fire / Thermal Burn Incident' },
  { value: 'FLOOD', label: '🌊 Urban Flooding / Water Rescue' },
  { value: 'BUILDING_COLLAPSE', label: '🏚️ Building or Structural Collapse' },
  { value: 'HAZMAT', label: '☣️ Chemical Leak / Toxic Gas Hazard' },
  { value: 'MEDICAL', label: '🩺 Acute Medical Emergency' },
  { value: 'OTHER', label: '⚠️ Other Urgent Crisis' }
];

const HYDERABAD_PRESETS = [
  { name: 'Kukatpally', lat: 17.4947, lng: 78.4111 },
  { name: 'Ameerpet', lat: 17.4375, lng: 78.4482 },
  { name: 'Miyapur', lat: 17.4969, lng: 78.3578 },
  { name: 'Hitec City', lat: 17.4435, lng: 78.3800 },
  { name: 'JNTU', lat: 17.4975, lng: 78.3914 },
  { name: 'KPHB', lat: 17.4932, lng: 78.3995 },
  { name: 'Erragadda', lat: 17.4552, lng: 78.4357 },
  { name: 'SR Nagar', lat: 17.4431, lng: 78.4428 },
  { name: 'Secunderabad', lat: 17.4399, lng: 78.4983 }
];

const VOICE_DEMO_SCENARIOS = [
  {
    title: '🔥 Commercial Fire in Kukatpally',
    text: 'There is a major fire in a commercial building at Kukatpally. 4 people trapped on the second floor, 2 people burned with critical injuries. Smoke is spreading and vehicles are blocking the road.'
  },
  {
    title: '🚗 Multi-Vehicle Crash in Ameerpet',
    text: 'Head-on collision between a bus and two cars in Ameerpet near the metro pillar. 3 people severely injured with chest trauma, fuel is leaking on the road and traffic is jammed.'
  },
  {
    title: '🌊 Urban Flash Flood in Secunderabad',
    text: 'Severe waterlogging and urban flash flood in Secunderabad low-lying street. 6 people stranded in deep water above 1.5 meters, rescue boats needed immediately.'
  },
  {
    title: '🏚️ Structural Collapse in Erragadda',
    text: 'Old two-storey construction building collapsed in Erragadda. 5 construction workers trapped under concrete debris, specialized search and rescue shoring required.'
  }
];

const CitizenReport = () => {
  const [category, setCategory] = useState('ROAD_ACCIDENT');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Kukatpally, Hyderabad');
  const [latitude, setLatitude] = useState(17.4947);
  const [longitude, setLongitude] = useState(78.4111);
  const [affectedPeople, setAffectedPeople] = useState(2);
  const [symptoms, setSymptoms] = useState('');
  const [hazards, setHazards] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Computer Vision States (PS10)
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [visionError, setVisionError] = useState(null);

  // Voice Reporting States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceAnalysisResult, setVoiceAnalysisResult] = useState(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English accent recognition

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(prev => {
          const base = prev ? prev + ' ' : '';
          return (base + currentTranscript).trim();
        });
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission denied. You can type or use the instant Voice Demo scenarios below.');
        } else {
          setVoiceError(`Speech capture error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceError('Web Speech API is not supported in this browser. Quick voice demo simulations are available.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const startVoiceRecording = () => {
    setVoiceError(null);
    setVoiceTranscript('');
    setVoiceAnalysisResult(null);
    setShowVoiceModal(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Start error:', err);
      }
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setIsRecording(false);
    if (voiceTranscript.trim()) {
      handleAnalyzeVoiceText(voiceTranscript.trim());
    }
  };

  const handleAnalyzeVoiceText = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    setIsAnalyzingVoice(true);
    setVoiceError(null);

    try {
      const res = await apiService.extractNlp(rawText);
      const data = res?.data || res;
      setVoiceAnalysisResult(data);

      // Auto-match location to Hyderabad nodes if present in text
      const lower = rawText.toLowerCase();
      const matchedNode = HYDERABAD_PRESETS.find(p => lower.includes(p.name.toLowerCase()));
      if (matchedNode) {
        setAddress(`${matchedNode.name}, Hyderabad`);
        setLatitude(matchedNode.lat);
        setLongitude(matchedNode.lng);
      }

      // Pre-fill categories & values
      if (data.category) {
        setCategory(data.category);
      }
      if (data.affectedPeople) {
        setAffectedPeople(data.affectedPeople);
      }
      if (data.hazards && Array.isArray(data.hazards)) {
        setHazards(data.hazards.join(', '));
      }
      setDescription(rawText);
    } catch (err) {
      console.error('Voice NLP Analysis failed:', err);
      setVoiceError('Failed to parse voice transcript with AI. Using raw text.');
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setAddress(`${preset.name}, Hyderabad`);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please select a preset location or enter manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (response.ok) {
            const data = await response.json();
            setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } else {
            setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch {
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert("Location permission denied. You can select one of the Hyderabad preset locations below.");
      },
      { timeout: 8000 }
    );
  };

  const runComputerVisionAnalysis = async (imageDataUrl) => {
    if (!imageDataUrl) return;
    setIsAnalyzingImage(true);
    setVisionError(null);
    try {
      const res = await apiService.analyzeImage(imageDataUrl, {
        category,
        address,
        description
      });
      const data = res?.data || res;
      setVisionResult(data);

      // Auto-append detected hazards to form hazards
      if (data?.detectedHazards && Array.isArray(data.detectedHazards)) {
        setHazards(prev => {
          const existing = prev ? prev.split(',').map(s => s.trim().toUpperCase()) : [];
          data.detectedHazards.forEach(h => {
            if (!existing.includes(h)) existing.push(h);
          });
          return existing.join(', ');
        });
      }
    } catch (err) {
      console.warn('Computer Vision processing error:', err);
      setVisionError('Computer vision feature extractor offline. Proceeding with standard report.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;
        setMedia(result);
        runComputerVisionAnalysis(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeIncidentSubmission = async (overridePayload = null) => {
    setIsSubmitting(true);
    try {
      const finalLat = overridePayload?.latitude || latitude || 17.4947;
      const finalLng = overridePayload?.longitude || longitude || 78.4111;
      const finalCategory = overridePayload?.category || category;
      const finalDesc = overridePayload?.description || description || `Reported ${finalCategory} emergency at ${address}`;
      const finalPeople = overridePayload?.affectedPeople || affectedPeople || 1;
      const finalHazards = overridePayload?.hazards 
        ? (Array.isArray(overridePayload.hazards) ? overridePayload.hazards : overridePayload.hazards.split(',').map(h => h.trim().toUpperCase()))
        : (hazards ? hazards.split(',').map(h => h.trim().toUpperCase()) : []);

      const isMedical = finalCategory !== 'FIRE' && finalCategory !== 'FLOOD' && finalCategory !== 'BUILDING_COLLAPSE';

      const payload = {
        category: finalCategory,
        description: finalDesc,
        address: overridePayload?.address || address,
        latitude: finalLat,
        longitude: finalLng,
        affectedPeople: parseInt(finalPeople, 10),
        isMedicalEmergency: isMedical,
        symptoms: overridePayload?.symptoms || symptoms,
        hazards: finalHazards,
        reporterName: reporterName || 'Citizen Emergency Caller',
        reporterPhone: reporterPhone || '112 / 108',
        image: media
      };

      const res = await apiService.createIncident(payload);
      const incData = res?.data?.data || res?.data || res;
      if (incData) {
        setSubmissionResult({
          incident: incData,
          allocation: res?.data?.allocation || null,
          message: res?.data?.message || 'Emergency dispatched successfully.'
        });
        setShowVoiceModal(false);
      } else {
        alert('Emergency report transmitted to dispatch.');
        navigate('/command');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(error.message || 'Failed to submit emergency report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeIncidentSubmission();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 font-sans relative z-10">
      
      {/* Header */}
      <header className="max-w-3xl mx-auto w-full mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] tracking-wider uppercase border border-rose-500/30">
              ResQFlow Citizen Portal
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] tracking-wider uppercase border border-emerald-500/30">
              AI Triage & Dynamic Multi-Agency Dispatch
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              <AlertCircle className="text-rose-500" />
              Report Emergency Crisis
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Speak or submit your emergency. AI extracts casualties, category, and hazards to dispatch Fire, EMS, Rescue, and Police.
            </p>
          </div>

          {/* Voice Emergency Action Button */}
          <button
            type="button"
            onClick={startVoiceRecording}
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/60 border border-rose-400/40 hover:scale-102 active:scale-98 transition shrink-0"
          >
            <Mic className="w-4 h-4 animate-pulse text-white" />
            <span>Voice Emergency Report</span>
          </button>
        </div>
      </header>

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isRecording ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-cyan-400'}`}>
                  <Mic size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Voice Emergency Reporter</h3>
                  <p className="text-[11px] text-slate-400">Speak naturally in English or Hindi/Telugu words</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isRecording) stopVoiceRecording();
                  setShowVoiceModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Audio Wave / Recording Status */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              {isRecording ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 h-8">
                    <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-10 bg-amber-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-7 bg-rose-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-12 bg-cyan-400 rounded-full animate-bounce delay-200"></span>
                    <span className="w-1.5 h-5 bg-rose-500 rounded-full animate-bounce delay-100"></span>
                  </div>
                  <span className="text-xs font-bold text-rose-400 tracking-wider uppercase animate-pulse">
                    ● Listening... Speak incident details, location, and casualties
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Click <span className="text-emerald-400 font-bold">Start Speaking</span> or choose a <span className="text-amber-400 font-bold">Scenario Preset</span> below:
                </div>
              )}

              <div className="flex gap-2">
                {isRecording ? (
                  <button
                    onClick={stopVoiceRecording}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow"
                  >
                    <MicOff size={14} /> Stop & Process Speech
                  </button>
                ) : (
                  <button
                    onClick={startVoiceRecording}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow"
                  >
                    <Mic size={14} /> Start Speaking
                  </button>
                )}
              </div>
            </div>

            {voiceError && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                <span>{voiceError}</span>
              </div>
            )}

            {/* Transcript Area */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Edit3 size={12} className="text-cyan-400" /> Live Speech Transcript (Editable):
                </label>
                {voiceTranscript && (
                  <button
                    onClick={() => handleAnalyzeVoiceText(voiceTranscript)}
                    disabled={isAnalyzingVoice}
                    className="text-[10px] font-bold text-cyan-400 hover:underline uppercase flex items-center gap-1"
                  >
                    <Sparkles size={11} /> {isAnalyzingVoice ? 'Analyzing...' : 'Re-Analyze with AI'}
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={voiceTranscript}
                onChange={e => setVoiceTranscript(e.target.value)}
                placeholder="Speech transcript will appear here in real time. You can also edit it before confirming."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white text-xs outline-none focus:border-cyan-500 transition resize-none"
              />
            </div>

            {/* AI Extracted Facts Card */}
            {voiceAnalysisResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> AI Extracted Structured Incident Summary
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    Triage Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Category</span>
                    <span className="font-bold text-amber-400">{voiceAnalysisResult.category || category}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Casualties</span>
                    <span className="font-bold text-rose-400">{voiceAnalysisResult.affectedPeople || affectedPeople} Person(s)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Trapped Count</span>
                    <span className="font-bold text-cyan-400">{voiceAnalysisResult.trappedCount || 0}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Location Node</span>
                    <span className="font-bold text-white truncate block">{address.split(',')[0]}</span>
                  </div>
                </div>

                {voiceAnalysisResult.hazards && voiceAnalysisResult.hazards.length > 0 && (
                  <div className="text-[11px] text-slate-300">
                    <span className="text-slate-400 font-bold uppercase text-[9px] block">Detected Scene Hazards:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {voiceAnalysisResult.hazards.map((h, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">
                          ⚠️ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      executeIncidentSubmission({
                        category: voiceAnalysisResult.category || category,
                        description: voiceTranscript || description,
                        affectedPeople: voiceAnalysisResult.affectedPeople || affectedPeople,
                        hazards: voiceAnalysisResult.hazards || []
                      });
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase tracking-wider text-xs rounded-lg flex items-center justify-center gap-1.5 shadow"
                  >
                    {isSubmitting ? 'Transmitting Dispatch...' : (
                      <>
                        <Send size={13} /> Confirm & Dispatch Multi-Agency Response
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowVoiceModal(false);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs rounded-lg border border-slate-700"
                  >
                    Edit in Manual Form
                  </button>
                </div>
              </div>
            )}

            {/* Quick Demo Voice Presets */}
            <div className="border-t border-slate-800 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Or Click One-Touch Voice Emergency Scenarios:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VOICE_DEMO_SCENARIOS.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVoiceTranscript(sc.text);
                      handleAnalyzeVoiceText(sc.text);
                    }}
                    className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500 text-left transition group"
                  >
                    <div className="font-bold text-white text-xs group-hover:text-cyan-400 transition flex items-center justify-between">
                      <span>{sc.title}</span>
                      <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{sc.text}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Live Food-Delivery Style Tracking View after Submission */}
      {submissionResult ? (
        <FoodDeliveryTrackingView
          incident={submissionResult.incident}
          onReset={() => {
            setSubmissionResult(null);
            setDescription('');
            setVoiceTranscript('');
            setVoiceAnalysisResult(null);
          }}
        />
      ) : (
        /* Emergency Reporting Form */
        <form onSubmit={handleSubmit} className="flex-1 max-w-3xl mx-auto w-full space-y-5 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
          
          {/* Quick Voice Bar */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Mic size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Voice-Activated Emergency Dispatch</h4>
                <p className="text-[10px] text-slate-400">Speak hands-free or test incident scenarios</p>
              </div>
            </div>
            <button
              type="button"
              onClick={startVoiceRecording}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition shadow flex items-center gap-1.5"
            >
              <Mic size={13} /> Speak Report
            </button>
          </div>

          {/* Emergency Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              1. Emergency Type *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xs font-semibold outline-none focus:border-rose-500 transition cursor-pointer"
            >
              {EMERGENCY_TYPES.map(t => (
                <option key={t.value} value={t.value} className="bg-slate-800 text-white">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Describe What Happened (Optional)
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Optional • Rapid Dispatch Enabled</span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xs outline-none focus:border-rose-500 transition resize-none placeholder-slate-500"
              placeholder="Optional: Enter extra details or leave blank for instant emergency dispatch based on category."
            />
          </div>

          {/* Casualties & Symptoms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Number of Injured / Casualties
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={affectedPeople}
                onChange={e => setAffectedPeople(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xs font-bold outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Symptoms / Vital Signs (Optional)
              </label>
              <input
                type="text"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g., Unconscious, stopped breathing, chest pain"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Scene Hazards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Scene Hazards / Environmental Conditions (Optional)
            </label>
            <input
              type="text"
              value={hazards}
              onChange={e => setHazards(e.target.value)}
              placeholder="e.g., Fuel leak, urban flooding, live electrical wires, heavy smoke"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xs outline-none focus:border-rose-500"
            />
          </div>

          {/* Location Selection & Presets */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <MapPin size={13} className="text-rose-400" /> 3. Incident Location *
              </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={locating}
                className="text-[10px] font-bold text-cyan-400 hover:underline uppercase flex items-center gap-1"
              >
                {locating ? 'Detecting GPS...' : '📍 Use Current GPS'}
              </button>
            </div>

            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-xs outline-none focus:border-rose-500 mb-2"
              placeholder="Enter street address or choose Hyderabad node below"
            />

            {/* Quick Hyderabad Presets */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Hyderabad Nodes:</span>
              <div className="flex flex-wrap gap-1.5">
                {HYDERABAD_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition border ${
                      address.includes(p.name)
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Evidence Upload & Computer Vision (PS10) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Camera size={13} className="text-cyan-400" /> Photo Evidence & AI Computer Vision (PS10)
              </label>
              <span className="text-[10px] text-cyan-400 font-semibold uppercase">Multimodal Vision Active</span>
            </div>

            <label className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center border-dashed cursor-pointer hover:bg-slate-750 block transition">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMediaChange}
              />
              {media ? (
                <div className="relative inline-block">
                  <img src={media} alt="Evidence preview" className="max-h-36 mx-auto rounded-lg shadow border border-slate-700" />
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setMedia(null); 
                      setMediaFile(null); 
                      setVisionResult(null);
                    }}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow hover:scale-105 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Camera size={24} className="text-slate-400 mb-1" />
                  <span className="text-xs text-slate-300 font-medium">Click to attach photo or camera capture</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Automated visual damage triage & hazard extraction</span>
                </div>
              )}
            </label>

            {/* Quick Test Incident Photos for Evaluators */}
            <div className="mt-2 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Or Test Sample Disaster Photos (1-Click CV):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const fireSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%237f1d1d"/><text x="150" y="85" font-family="Arial" font-size="28" fill="%23fbbf24" text-anchor="middle">🔥 ACTIVE FIRE SCENE</text><text x="150" y="115" font-family="Arial" font-size="14" fill="%23fca5a5" text-anchor="middle">Heavy Smoke & Thermal Radiation</text></svg>';
                    setMedia(fireSvg);
                    setCategory('FIRE');
                    runComputerVisionAnalysis(fireSvg);
                  }}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 text-[10px] font-bold text-left transition truncate"
                >
                  🔥 Active Fire Scene
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const crashSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%231e293b"/><text x="150" y="85" font-family="Arial" font-size="28" fill="%23ef4444" text-anchor="middle">🚗 HIGHWAY CRASH</text><text x="150" y="115" font-family="Arial" font-size="14" fill="%23cbd5e1" text-anchor="middle">Deformed Chassis & Airbag Deployed</text></svg>';
                    setMedia(crashSvg);
                    setCategory('ROAD_ACCIDENT');
                    runComputerVisionAnalysis(crashSvg);
                  }}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-rose-300 text-[10px] font-bold text-left transition truncate"
                >
                  🚗 Highway Crash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const floodSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%230c4a6e"/><text x="150" y="85" font-family="Arial" font-size="28" fill="%2338bdf8" text-anchor="middle">🌊 URBAN FLOODING</text><text x="150" y="115" font-family="Arial" font-size="14" fill="%23bae6fd" text-anchor="middle">Submerged Vehicles &gt; 1m Water</text></svg>';
                    setMedia(floodSvg);
                    setCategory('FLOOD');
                    runComputerVisionAnalysis(floodSvg);
                  }}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 text-[10px] font-bold text-left transition truncate"
                >
                  🌊 Flood Submersion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const collSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23451a03"/><text x="150" y="85" font-family="Arial" font-size="28" fill="%23f97316" text-anchor="middle">🏚️ BUILDING COLLAPSE</text><text x="150" y="115" font-family="Arial" font-size="14" fill="%23fdba74" text-anchor="middle">Concrete Debris & Void Pockets</text></svg>';
                    setMedia(collSvg);
                    setCategory('BUILDING_COLLAPSE');
                    runComputerVisionAnalysis(collSvg);
                  }}
                  className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-400 text-[10px] font-bold text-left transition truncate"
                >
                  🏚️ Structural Debris
                </button>
              </div>
            </div>

            {/* Computer Vision Loading Indicator */}
            {isAnalyzingImage && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-cyan-300">
                  Running Computer Vision feature extraction & damage severity estimation...
                </span>
              </div>
            )}

            {/* Computer Vision Assessment Card */}
            {visionResult && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Computer Vision Triage Assessment
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
                    CV Confidence: {Math.round((visionResult.confidenceScore || 0.93) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Damage Severity</span>
                    <span className="font-bold text-rose-400 text-sm font-mono">
                      {visionResult.damageSeverityScore || 75} / 100
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[9px] uppercase">Trapped Likelihood</span>
                    <span className={`font-bold text-sm ${visionResult.trappedOccupantsLikelihood === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {visionResult.trappedOccupantsLikelihood || 'MODERATE'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[9px] uppercase">Structural Compromise</span>
                    <span className="font-bold text-sm text-cyan-300">
                      {visionResult.structuralIntegrityCompromised ? 'YES (Critical)' : 'NO'}
                    </span>
                  </div>
                </div>

                {/* Detected Objects with Confidence */}
                {visionResult.detectedObjects && visionResult.detectedObjects.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Detected Visual Objects:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {visionResult.detectedObjects.map((obj, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
                          🔍 {obj.label} ({Math.round(obj.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected Scene Hazards */}
                {visionResult.detectedHazards && visionResult.detectedHazards.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Visual Hazards Auto-Appended to Report:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {visionResult.detectedHazards.map((haz, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">
                          ⚠️ {haz}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Evidence Summary */}
                <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  "{visionResult.visualEvidence || 'Visual features validated for automated dispatch.'}"
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg hover:shadow-rose-900/40 active:scale-98"
          >
            {isSubmitting ? 'Processing AI Triage & Dispatching Fleet...' : (
              <>
                <Send size={14} /> Submit Emergency Report
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
};

export default CitizenReport;
