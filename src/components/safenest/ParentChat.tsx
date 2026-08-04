import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  Send, 
  ShieldCheck, 
  Volume2, 
  AlertTriangle, 
  Sparkles,
  HelpCircle,
  Loader2,
  RefreshCw,
  Phone
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";

import { FALLBACK_ANSWER, KNOWLEDGE, findAnswers } from "@/lib/safenest/knowledge";
import { stopSpeaking } from "@/lib/safenest/speech";
import { useVoiceInput } from "@/lib/safenest/speech";
import { triage } from "@/lib/safenest/triage";
import { useSafeNestSettings, useProfile } from "@/lib/safenest/store";

// Translation Maps for UI Elements
const UI_TEXT = {
  en: {
    title: "AI Voice Assistant",
    subtitle: "Evidence-Based Pediatric Safety",
    placeholder: "My baby won't sleep...",
    speakBtn: "Speak",
    listening: "Listening...",
    askBtn: "Ask",
    confidence: "Clinical Confidence",
    disclaimer: "SafeNest AI is an educational companion. It is not diagnostic. For severe symptoms, contact emergency services immediately.",
    emergencyBtn: "Emergency SOS Mode",
    emergencyDetected: "Emergency Risk Flagged",
    mistakeBtn: "Clear & Reset",
    suggested: "Suggested Safety Questions",
    thinking: "Checking clinical references...",
    sources: "Pediatric Sources"
  },
  ta: {
    title: "AI குரல் உதவியாளர்",
    subtitle: "குழந்தை நலம் மற்றும் பாதுகாப்பு",
    placeholder: "குழந்தை தூங்கவில்லை...",
    speakBtn: "பேசவும்",
    listening: "கேட்கிறது...",
    askBtn: "கேள்வி",
    confidence: "மருத்துவத் துல்லியம்",
    disclaimer: "SafeNest AI ஒரு கல்வி வழிகாட்டி மட்டுமே. தீவிர அறிகுறிகளுக்கு அவசர சேவையைத் தொடர்பு கொள்ளவும்.",
    emergencyBtn: "அவசரகால SOS முறை",
    emergencyDetected: "அவசர ஆபத்து கண்டறியப்பட்டது",
    mistakeBtn: "மீட்டமைக்கவும்",
    suggested: "பரிந்துரைக்கப்படும் கேள்விகள்",
    thinking: "மருத்துவத் தரவுகளைச் சரிபார்க்கிறது...",
    sources: "மருத்துவ ஆதாரங்கள்"
  },
  hi: {
    title: "AI वॉयस असिस्टेंट",
    subtitle: "प्रमाणित बाल चिकित्सा सुरक्षा",
    placeholder: "शिशु सो नहीं रहा है...",
    speakBtn: "बोलें",
    listening: "सुन रहा है...",
    askBtn: "पूछें",
    confidence: "नैदानिक आत्मविश्वास",
    disclaimer: "SafeNest AI एक शैक्षणिक साथी है। यह डॉक्टर का विकल्प नहीं है। गंभीर लक्षणों के लिए आपातकालीन सहायता लें।",
    emergencyBtn: "आपातकालीन SOS मोड",
    emergencyDetected: "आपातकालीन संकट पाया गया",
    mistakeBtn: "रीसेट करें",
    suggested: "सुझाए गए सुरक्षा प्रश्न",
    thinking: "चिकित्सा संदर्भों की जांच कर रहा है...",
    sources: "चिकित्सा स्रोत"
  }
} as const;

// Translations of Pediatric Answers (for Hindi & Tamil UI matching)
const TRANSLATED_KNOWLEDGE: Record<string, Record<string, { q: string, a: string, src: string }>> = {
  ta: {
    sleep: {
      q: "என் குழந்தை தூங்கவில்லை",
      a: "புதிதாகப் பிறந்த குழந்தைகள் ஒரு நாளைக்கு 14-17 மணி நேரம் தூங்குகிறார்கள். அறையை இருட்டாகவும் குளிர்ச்சியாகவும் வைத்திருங்கள். தலையணை அல்லது தளர்வான படுக்கை இல்லாமல் உறுதியான தட்டையான மேற்பரப்பில் அவர்களை எப்போதும் படுக்க வைக்கவும்.",
      src: "AAP Safe Sleep · NHS Baby sleep"
    },
    burp: {
      q: "நான் எப்போது குழந்தையை தட்ட வேண்டும்?",
      a: "உணவளிக்கும் போது பாதியிலும், உணவளித்த பிறகும் குழந்தையை நேராக தோளில் சாய்த்து மெதுவாக தட்டி கொடுங்கள். இதனால் குழந்தைக்கு வாயுத் தொல்லை குறையும்.",
      src: "AAP HealthyChildren"
    },
    "breastfeeding-medicine": {
      q: "மருந்து சாப்பிட்ட பிறகு தாய்ப்பால் கொடுக்கலாமா?",
      a: "பாராசிட்டமால் மற்றும் ஐபுப்ரூஃபன் போன்ற பல பொதுவான மருந்துகள் தாய்ப்பால் கொடுக்கும் போது பாதுகாப்பானவை. இருப்பினும், புதிய மருந்துகளை எடுக்கும் முன் உங்கள் மருத்துவரிடம் உறுதிப்படுத்தவும்.",
      src: "NHS Breastfeeding and medicines"
    },
    teething: {
      q: "பற்கள் எப்போது முளைக்க ஆரம்பிக்கும்?",
      a: "முதல் பற்கள் பொதுவாக 6 முதல் 10 மாதங்களில் தோன்றும். பற்கள் முளைப்பதால் கடுமையான காய்ச்சல் ஏற்படாது — காய்ச்சல் இருந்தால் மருத்துவரை அணுகவும்.",
      src: "NHS Teething · AAP"
    },
    fever: {
      q: "காய்ச்சல் என்றால் என்ன?",
      a: "38°C (100.4°F) அல்லது அதற்கு மேற்பட்ட வெப்பநிலை காய்ச்சல் ஆகும். 3 மாதத்திற்குட்பட்ட குழந்தைக்கு காய்ச்சல் இருந்தால் உடனடியாக மருத்துவரை அணுகவும்.",
      src: "NHS Fever in children · WHO IMCI"
    },
    "feeding-amount": {
      q: "என் குழந்தை எவ்வளவு அடிக்கடி பால் குடிக்க வேண்டும்?",
      a: "புதிதாகப் பிறந்த குழந்தைகள் 24 மணிநேரத்தில் 8-12 முறை பால் குடிக்கிறார்கள். Exclusive breastfeeding முதல் 6 மாதங்களுக்கு பரிந்துரைக்கப்படுகிறது.",
      src: "WHO Infant feeding · AAP"
    },
    vaccines: {
      q: "தடுப்பூசி அட்டவணை முக்கியமானதா?",
      a: "உங்கள் நாட்டின் தடுப்பூசி அட்டவணையைத் தவறாமல் பின்பற்றுங்கள். ஏதேனும் தவறியிருந்தால் மருத்துவரை அணுகி கால அட்டவணை பெற்றுக்கொள்ளவும்.",
      src: "WHO / CDC immunisation schedules"
    },
    "postpartum-mood": {
      q: "நான் எப்போதும் சோகமாக உணர்கிறேன்",
      a: "பிரசவத்திற்குப் பிறகு சோர்வாகவோ அல்லது கவலையாகவோ உணர்வது சகஜம். நீங்கள் தனியாக இல்லை. இது நீண்ட காலம் நீடித்தால் உங்கள் மகப்பேறு மருத்துவர் அல்லது மருத்துவரை அணுகவும்.",
      src: "NHS Postnatal depression · WHO Maternal mental health"
    },
    colic: {
      q: "என் குழந்தை தொடர்ந்து அழுகிறது",
      a: "பசி, டயபர், உடல் வெப்பநிலை ஆகியவற்றைச் சரிபார்க்கவும். குழந்தை தொடர்ந்து அழுதால் அமைதியாக இருக்கவும். உங்களை ஆசுவாசப்படுத்திக்கொள்ள சில நிமிடங்கள் இடைவெளி எடுங்கள்.",
      src: "NHS Colic · AAP"
    }
  },
  hi: {
    sleep: {
      q: "मेरा शिशु सो नहीं रहा है",
      a: "नवजात शिशु दिन भर में 14-17 घंटे सोते हैं। कमरे को अंधेरा और ठंडा रखें, तकिये या ढीले बिस्तरों के बिना शिशु को पीठ के बल लिटाएं।",
      src: "AAP Safe Sleep · NHS Baby sleep"
    },
    burp: {
      q: "मुझे शिशु को डकार कब दिलानी चाहिए?",
      a: "दूध पिलाने के बीच में और अंत में शिशु को कंधे से सटाकर डकार दिलाएं, इससे शिशु शांत होता है और पेट की गैस बाहर निकलती है।",
      src: "AAP HealthyChildren"
    },
    "breastfeeding-medicine": {
      q: "क्या मैं दवा लेने के बाद स्तनपान करा सकती हूँ?",
      a: "पैरासिटामोल और इबुप्रोफेन जैसी सामान्य दवाएं स्तनपान के दौरान सुरक्षित मानी जाती हैं। लेकिन नई दवा शुरू करने से पहले डॉक्टर से सलाह लें।",
      src: "NHS Breastfeeding and medicines"
    },
    teething: {
      q: "शिशु के दांत कब निकलने शुरू होते हैं?",
      a: "पहले दांत आमतौर पर 6 से 10 महीनों के बीच निकलते हैं। मसूड़ों की मालिश के लिए एक साफ़ टीथिंग रिंग दें। दांत निकलने से तेज बुखार नहीं होता है।",
      src: "NHS Teething · AAP"
    },
    fever: {
      q: "बुखार का क्या मतलब है?",
      a: "38°C (100.4°F) या उससे अधिक तापमान बुखार है। 3 महीने से कम उम्र के शिशु के बुखार को कभी नज़रअंदाज़ न करें, तुरंत डॉक्टर के पास ले जाएं।",
      src: "NHS Fever in children · WHO IMCI"
    },
    "feeding-amount": {
      q: "मेरे शिशु को कितनी बार दूध पीना चाहिए?",
      a: "नवजात शिशु 24 घंटे में 8-12 बार दूध पीते हैं। पहले 6 महीनों के लिए केवल स्तनपान (exclusive breastfeeding) की सलाह दी जाती है।",
      src: "WHO Infant feeding · AAP"
    },
    vaccines: {
      q: "क्या समय पर टीकाकरण आवश्यक है?",
      a: "नियमित टीकाकरण समय पर पूरा करें। यदि कोई खुराक छूट गई है, तो तुरंत डॉक्टर से परामर्श कर कैच-अप अनुसूची प्राप्त करें।",
      src: "WHO / CDC immunisation schedules"
    },
    "postpartum-mood": {
      q: "मैं हमेशा उदास महसूस करती हूँ",
      a: "प्रसव के बाद उदास या चिंतित महसूस करना सामान्य है। यह कोई असफलता नहीं है। यदि यह 2 सप्ताह से अधिक समय तक बना रहता है, तो अपने डॉक्टर से मिलें।",
      src: "NHS Postnatal depression · WHO Maternal mental health"
    },
    colic: {
      q: "मेरा शिशु रोना बंद नहीं कर रहा है",
      a: "भूख, डायपर और तापमान की जाँच करें। रोते हुए बच्चे को शांत करने के लिए धीरे-धीरे थपथपाएं। थकावट महसूस होने पर थोड़ा ब्रेक लें।",
      src: "NHS Colic · AAP"
    }
  }
};

type Message = { id: string; role: "parent" | "safenest"; text: string; source?: string; risk?: string; confidence?: number };

export function ParentChat() {
  const { settings } = useSafeNestSettings();
  const { profile } = useProfile();
  const lang = settings.language || "en";
  const ui = UI_TEXT[lang] || UI_TEXT.en;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [triageInfo, setTriageInfo] = useState<any>(null);

  // Initialize intro based on language
  useEffect(() => {
    const introText = 
      lang === "ta" 
        ? "வணக்கம், நான் உங்களுக்கு குழந்தை பராமரிப்பு, தூக்கம், தடுப்பூசிகள் மற்றும் மருந்து அளவுகள் பற்றி உதவ முடியும். நான் சான்றளிக்கப்பட்ட குழந்தை மருத்துவ வழிகாட்டுதல்களிலிருந்து மட்டுமே பதிலளிப்பேன்."
        : lang === "hi"
          ? "नमस्ते, मैं नवजात शिशु की देखभाल, नींद, स्तनपान और दवाओं की सुरक्षित खुराक के बारे में आपके सवालों के जवाब दे सकती हूँ। मेरी जानकारी प्रमाणित चिकित्सा गाइड पर आधारित है।"
          : "Hello, I am your pediatric safety assistant. Ask me anything about feeding, sleep, vaccinations, teething, or medicine doses. I only answer from verified clinical guidelines.";
    
    setMessages([
      { id: "intro", role: "safenest", text: introText, confidence: 100 }
    ]);
  }, [lang]);

  // Voice playback with matching language engine
  const speakLocalized = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.voiceSpeed || 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    let voiceLang = "en-US";
    if (lang === "ta") voiceLang = "ta-IN";
    else if (lang === "hi") voiceLang = "hi-IN";

    const matchingVoice = voices.find(v => v.lang.startsWith(voiceLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    // Check emergency status
    const riskAnalysis = triage(text, profile.ageMonths);
    if (riskAnalysis.level === "critical") {
      setIsEmergency(true);
      setTriageInfo(riskAnalysis);
      speakLocalized(riskAnalysis.spoken);
      return;
    }

    setThinking(true);
    stopSpeaking();

    // Add parent message to list
    const parentMsgId = Math.random().toString(36).slice(2);
    setMessages((prev) => [
      ...prev,
      { id: parentMsgId, role: "parent", text }
    ]);

    setInput("");

    // Simulate thinking delay (startup-grade UI micro-animation)
    setTimeout(() => {
      setThinking(false);
      
      let answerText = FALLBACK_ANSWER;
      let sourceName = "";
      let confidence = 75;

      // Find standard answers
      const match = findAnswers(text)[0];
      if (match) {
        confidence = 98;
        sourceName = match.source;
        answerText = match.answer;

        // Apply localization translations if selected
        if (lang !== "en" && TRANSLATED_KNOWLEDGE[lang]?.[match.id]) {
          const loc = TRANSLATED_KNOWLEDGE[lang]![match.id]!;
          answerText = loc.a;
          sourceName = loc.src;
        }
      } else {
        // Localize fallback
        if (lang === "ta") {
          answerText = "மன்னிக்கவும், இதற்கான சான்றளிக்கப்பட்ட பதில் என்னிடம் இல்லை. தயவுசெய்து உங்கள் குழந்தை மருத்துவரை அணுகவும்.";
        } else if (lang === "hi") {
          answerText = "क्षमा करें, मेरे पास इसके लिए प्रमाणित चिकित्सा जानकारी नहीं है। कृपया अपने बाल रोग विशेषज्ञ से परामर्श लें।";
        }
      }

      const reply: Message = {
        id: Math.random().toString(36).slice(2),
        role: "safenest",
        text: answerText,
        source: sourceName || undefined,
        confidence,
        risk: riskAnalysis.level !== "low" ? `${riskAnalysis.headline} — ${riskAnalysis.action}` : undefined
      };

      setMessages((prev) => [...prev, reply]);
      
      const spokenResponse = riskAnalysis.level !== "low" 
        ? `${riskAnalysis.spoken} ${answerText}` 
        : answerText;
      speakLocalized(spokenResponse);
    }, 1000);
  };

  const voice = useVoiceInput(lang, (text) => send(text));

  // High Fidelity Parametric Waveform Generator (Image 3)
  const [pulseScale, setPulseScale] = useState(1);
  useEffect(() => {
    let interval: any;
    if (voice.listening) {
      interval = setInterval(() => {
        setPulseScale(0.88 + Math.random() * 0.24); // dynamic scale variation
      }, 100);
    } else {
      setPulseScale(1);
    }
    return () => clearInterval(interval);
  }, [voice.listening]);

  const generateWavyPath = (radius: number, amplitude: number, peaks: number, phase: number) => {
    const points = [];
    const cx = 100;
    const cy = 100;
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      // Dual harmonics perturbation for complex organic waveforms
      const wave = Math.sin(angle * peaks + phase) * 0.75 + Math.cos(angle * 3 - phase) * 0.25;
      const r = radius + wave * amplitude;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(" ") + " Z";
  };

  const handleSuggestClick = (q: string) => {
    send(q);
  };

  if (isEmergency && triageInfo) {
    return (
      <section className="rounded-[2rem] border border-destructive/50 bg-destructive/10 p-8 text-center space-y-6">
        <AlertTriangle className="mx-auto size-16 text-destructive animate-bounce" />
        <h2 className="font-display text-3xl font-black text-destructive">{ui.emergencyDetected}</h2>
        <p className="mx-auto max-w-md text-base text-foreground/90 font-medium">
          {triageInfo.action} I have locked dosage lookup controls to ensure infant safety.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`tel:${profile.emergencyNumber}`}
            className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl bg-destructive px-8 text-lg font-bold text-destructive-foreground hover:bg-destructive/95 transition-all shadow-md"
          >
            <Phone className="size-5" /> Call {profile.emergencyNumber}
          </a>
          <Link
            to="/emergency"
            className="flex min-h-[64px] items-center justify-center rounded-2xl border border-destructive/40 bg-background/50 px-8 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-all"
          >
            {ui.emergencyBtn}
          </Link>
        </div>
        <button
          onClick={() => {
            stopSpeaking();
            setIsEmergency(false);
            setTriageInfo(null);
          }}
          className="text-xs font-semibold text-muted-foreground underline cursor-pointer hover:text-foreground"
        >
          {ui.mistakeBtn}
        </button>
      </section>
    );
  }

  // Suggestion questions according to active language
  const activeSuggestions = KNOWLEDGE.slice(0, 4).map(k => {
    if (lang !== "en" && TRANSLATED_KNOWLEDGE[lang]?.[k.id]) {
      return TRANSLATED_KNOWLEDGE[lang]![k.id]!.q;
    }
    return k.question;
  });

  return (
    <section className="space-y-6">
      {/* Siri Activation-style Voice Visualizer Centerpiece (Background removed) */}
      <div className="text-white relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[460px] w-full">
        
        {/* Top Tag & Status indicator */}
        <div className="flex flex-col items-center">
          <div className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
            AI Buddy
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="size-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              Online
            </span>
          </div>
        </div>

        {/* Siri Glowing Fluid Orb (High Fidelity Parametric Waves - Image 3) */}
        <div className="relative my-8 grid place-items-center select-none w-full min-h-[260px]">
          <motion.div
            animate={{ scale: pulseScale }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            className="relative size-64 flex items-center justify-center"
          >
            {/* SVG Wavy concentric rings overlay */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="siri-orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff5d22" />
                  <stop offset="40%" stopColor="#f97316" />
                  <stop offset="70%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>

              {/* Parametric Concentric Waves (Image 3) */}
              {Array.from({ length: 14 }).map((_, idx) => {
                const baseRadius = 46 + idx * 2.2;
                const amplitude = voice.listening ? 4 + idx * 0.45 : 0.8;
                const peaks = 6;
                const phase = (idx * Math.PI) / 8 + (voice.listening ? 0.3 : 0);
                const pathData = generateWavyPath(baseRadius, amplitude, peaks, phase);
                
                return (
                  <path
                    key={idx}
                    d={pathData}
                    fill="none"
                    stroke="url(#siri-orange-gradient)"
                    strokeWidth="1.2"
                    opacity={voice.listening ? 0.85 - idx * 0.055 : 0.25 - idx * 0.015}
                    className={`transition-all duration-300 ${
                      voice.listening 
                        ? `animate-[spin_${15 + idx * 2.5}s_linear_infinite]` 
                        : ""
                    }`}
                    style={{
                      transformOrigin: "100px 100px",
                    }}
                  />
                );
              })}
            </svg>

            {/* Central dark core circle with micro-dots (Image 3 + Image 1) */}
            <div className="absolute size-24 rounded-full bg-neutral-950 border border-neutral-900 shadow-[0_10px_25px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.05)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 siri-mesh opacity-20" />
              {/* Core Pulsing Glow */}
              <div className={`absolute size-20 rounded-full bg-orange-500/10 blur-md transition-all duration-500 ${
                voice.listening ? "scale-125 opacity-40 animate-pulse" : "scale-100 opacity-0"
              }`} />
              
              {/* Small micro pause or play symbol inside the core */}
              {voice.listening ? (
                <div className="flex gap-1.5 items-center justify-center z-10 scale-95 opacity-80">
                  <span className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-duration:0.8s]" />
                  <span className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                </div>
              ) : (
                <Mic className="size-5 text-neutral-400 z-10 animate-pulse" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Status/Transcription Text */}
        <div className="min-h-[2.5rem] max-w-lg flex items-center justify-center text-center px-4 mb-8">
          {thinking ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400 font-semibold">
              <Loader2 className="size-4 animate-spin text-orange-500" /> {ui.thinking}
            </div>
          ) : voice.transcript ? (
            <p className="text-base font-semibold italic text-white/95">
              &ldquo;{voice.transcript}&rdquo;
            </p>
          ) : voice.listening ? (
            <p className="text-sm text-neutral-400 font-semibold tracking-wide animate-pulse">{ui.listening}</p>
          ) : (
            <p className="text-sm text-neutral-400 font-semibold tracking-wide">
              {lang === "ta" ? "மைக் பொத்தானை அழுத்தி பேசவும்" : lang === "hi" ? "माइक दबाएं और स्वाभाविक रूप से बोलें" : "Tap the microphone and describe a symptom or question."}
            </p>
          )}
        </div>

        {/* Bottom Interactive Control Row (matches siri activation layout) */}
        <div className="flex items-center justify-center gap-6 w-full mt-2">
          {/* Left keyboard input focus */}
          <button 
            type="button" 
            onClick={() => document.getElementById("text-input-field")?.focus()} 
            className="grid size-12 place-items-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Type question"
          >
            <Send className="size-4" />
          </button>

          {/* Center concentric sound-wave Mic button */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => (voice.listening ? voice.stop() : voice.start())}
              className={`relative z-20 grid size-16 place-items-center rounded-full text-white transition-all shadow-lg cursor-pointer ${
                voice.listening ? "bg-red-500" : "bg-orange-500 hover:bg-orange-600"
              }`}
              style={{ boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)" }}
            >
              {voice.listening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
            </motion.button>
            {/* Concentric sound rings */}
            {voice.listening && (
              <>
                <div className="absolute -inset-2 rounded-full border border-orange-500/40 animate-ping" />
                <div className="absolute -inset-4 rounded-full border border-orange-500/20 animate-ping [animation-delay:0.3s]" />
              </>
            )}
          </div>

          {/* Right Reset conversation */}
          <button 
            type="button" 
            onClick={() => {
              stopSpeaking();
              setMessages([{ id: "intro", role: "safenest", text: "Conversation reset. How can I help?" }]);
            }}
            className="grid size-12 place-items-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Reset Chat"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>


      {/* Conversation Chat Stream */}
      <div className="space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col max-w-[88%] rounded-2xl p-4 text-sm relative ${
              message.role === "parent"
                ? "ml-auto bg-primary/10 border border-primary/20 text-foreground"
                : "bg-muted/40 border border-border/50 text-foreground"
            }`}
          >
            {/* Risk Warnings */}
            {message.risk && (
              <div className="mb-2.5 rounded-xl bg-warning/10 border border-warning/20 p-3 text-xs font-semibold text-warning">
                {message.risk}
              </div>
            )}
            
            <p className="leading-relaxed font-medium">{message.text}</p>

            {/* Answer metadata details */}
            {(message.source || message.confidence) && (
              <div className="mt-3.5 pt-2.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                {message.source && (
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-success" />
                    {ui.sources}: <span className="font-semibold text-foreground">{message.source}</span>
                  </span>
                )}
                {message.confidence && (
                  <span className="font-semibold text-primary">{ui.confidence}: {message.confidence}%</span>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading skeleton */}
        {thinking && (
          <div className="max-w-[70%] rounded-2xl bg-muted/40 p-4 border border-border/50 space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-5/6" />
          </div>
        )}
      </div>

      {/* Suggested Follow-up Questions */}
      {messages.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <HelpCircle className="size-4 text-primary" /> {ui.suggested}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeSuggestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestClick(question)}
                className="text-left text-xs font-bold border border-border/60 bg-muted/10 p-3.5 rounded-xl hover:border-primary/50 hover:bg-muted/20 active:scale-99 transition-all cursor-pointer truncate"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input Alternative */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2.5 mt-4"
      >
        <input
          id="text-input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ui.placeholder}
          className="flex-1 h-12 rounded-xl border border-input bg-muted/20 px-4 text-sm focus:ring-2 focus:ring-ring outline-none"
        />
        <button
          type="submit"
          className="flex h-12 items-center justify-center rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
        >
          <Send className="size-4" />
        </button>
      </form>

      {/* Global medical disclaimer */}
      <div className="text-[10px] text-muted-foreground/80 text-center leading-normal max-w-lg mx-auto py-2.5 border-t border-border/30">
        {ui.disclaimer}
      </div>
    </section>
  );
}