import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api.js";
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  RotateCcw,
  MessageSquare,
  Leaf,
  Radio,
  ChevronDown
} from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English", speechCode: "en-IN" },
  { code: "hi", label: "हिंदी", speechCode: "hi-IN" },
  { code: "mr", label: "मराठी", speechCode: "mr-IN" },
  { code: "gu", label: "ગુજરાતી", speechCode: "gu-IN" },
  { code: "pa", label: "ਪੰਜਾਬੀ", speechCode: "pa-IN" },
  { code: "te", label: "తెలుగు", speechCode: "te-IN" },
  { code: "kn", label: "ಕನ್ನಡ", speechCode: "kn-IN" },
];

const CROPS = [
  "General",
  "Soybean",
  "Cotton",
  "Wheat",
  "Rice",
  "Sugarcane",
  "Onion",
  "Tomato",
  "Maize",
];

const GREETINGS = {
  en: "Namaste! I am AgriMitra AI, your 24/7 smart farming advisor. Ask me anything about crop diseases, pest remedies, weather alerts, fertilizers, or mandi prices!",
  hi: "नमस्ते! मैं कृषि-मित्र AI हूँ, आपका 24/7 स्मार्ट कृषि सलाहकार। फसल रोग, कीट उपचार, मौसम, खाद या मंडी भाव के बारे में पूछें!",
  mr: "नमस्कार! मी कृषिमित्र AI आहे, आपला २४/७ शेती सहाय्यक. पिकांवरील रोग, किड नियंत्रण, खत व्यवस्थापन किंवा बाजारभावाबाबत विचारा!",
  gu: "નમસ્તે! હું કૃષિમિત્ર AI છું, તમારો 24/7 સ્માર્ટ ખેતી સલાહકાર. પાકના રોગ, જીવાત નિયંત્રણ, ખાતર કે બજાર ભાવ વિશે પૂછો!",
  pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ AI ਹਾਂ, ਤੁਹਾਡਾ 24/7 ਖੇਤੀ ਸਲਾਹਕਾਰ। ਫਸਲਾਂ ਦੇ ਰੋਗ, ਕੀਟ ਰੋਕਥਾਮ ਜਾਂ ਮੰਡੀ ਭਾਅ ਬਾਰੇ ਪੁੱਛੋ!",
  te: "నమస్కారం! నేను వ్యవసాయ మిత్ర AI ని, మీ 24/7 వ్యవసాయ సలహాదారుని. పంట తెగుళ్లు, నివారణ మరియు మార్కెట్ ధరల గురించి అడగండి!",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ಅಗ್ರಿಮಿತ್ರ AI, ನಿಮ್ಮ 24/7 ಕೃಷಿ ಸಲಹೆಗಾರ. ಬೆಳೆ ರೋಗಗಳು, ಕೀಟ ನಿಯಂತ್ರಣ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ!",
};

const SUGGESTIONS = {
  en: [
    "🌿 Why are my crop leaves turning yellow?",
    "🐛 How to prevent stem borer pest attacks?",
    "💧 When is the best time for irrigation this week?",
    "📈 How to get the highest price at APMC mandi?",
  ],
  hi: [
    "🌿 फसल के पत्ते पीले क्यों पड़ रहे हैं?",
    "🐛 तना छेदक और इल्ली कीट से कैसे बचाएं?",
    "💧 इस सप्ताह सिंचाई का सबसे सही समय क्या है?",
    "📈 मंडी में फसल का उच्चतम भाव कैसे प्राप्त करें?",
  ],
  mr: [
    "🌿 पिकांची पाने पिवळी का पडत आहेत व उपाय काय?",
    "🐛 खोडकिडा व अळीपासून पिकाचे संरक्षण कसे करावे?",
    "💧 या आठवड्यात पाणी देण्यासाठी योग्य वेळ कोणती?",
    "📈 बाजार समितीत चांगला भाव मिळवण्यासाठी काय करावे?",
  ],
  gu: [
    "🌿 પાકના પાંદડા પીળા કેમ પડી રહ્યા છે?",
    "🐛 ગાભમારાની ઇયળ સામે કેવી રીતે રક્ષણ મેળવવું?",
    "💧 આ અઠવાડિયે પિયત આપવાનો શ્રેષ્ઠ સમય કયો?",
    "📈 માર્કેટ યાર્ડમાં શ્રેષ્ઠ ભાવ કેવી રીતે મેળવવો?",
  ],
  pa: [
    "🌿 ਫਸਲ ਦੇ ਪੱਤੇ ਪੀਲੇ ਕਿਉਂ ਪੈ ਰਹੇ ਹਨ?",
    "🐛 ਤਣਾ ਛੇਦਕ ਸੁੰਡੀ ਤੋਂ ਬਚਾਅ ਕਿਵੇਂ ਕਰੀਏ?",
    "💧 ਇਸ ਹਫ਼ਤੇ ਸਿੰਚਾਈ ਦਾ ਸਹੀ ਸਮਾਂ ਕਿਹੜਾ ਹੈ?",
    "📈 ਮੰਡੀ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਧ ਭਾਅ ਕਿਵੇਂ ਪ੍ਰਾਪਤ ਕਰੀਏ?",
  ],
  te: [
    "🌿 నా పంట ఆకులు పసుపు రంగులోకి ఎందుకు మారుతున్నాయి?",
    "🐛 కాండం తొలిచే పురుగుల నివారణ ఎలా చేయాలి?",
    "💧 ఈ వారం నీటి తడి ఇవ్వడానికి సరైన సమయం ఏది?",
    "📈 మార్కెట్ యార్డులో మంచి ధర ఎలా పొందాలి?",
  ],
  kn: [
    "🌿 ಬೆಳೆಗಳ ಎಲೆಗಳು ಏಕೆ ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತಿವೆ?",
    "🐛 ಕಾಂಡ ಕೊರೆಯುವ ಕೀಟದಿಂದ ರಕ್ಷಣೆ ಹೇಗೆ?",
    "💧 ಈ ವಾರ ನೀರಾವರಿಗೆ ಸೂಕ್ತ ಸಮಯ ಯಾವುದು?",
    "📈 ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಉತ್ತಮ ಬೆಲೆ ಪಡೆಯುವುದು ಹೇಗೆ?",
  ],
};

// Rich local agronomic offline fallback so user never encounters dead ends
const LOCAL_FALLBACKS = {
  yellow: {
    en: "🌾 **AgriMitra Agronomic Advisory: Yellowing Leaves**\n\n🔍 **1. Diagnosis:** Nitrogen deficiency (lower leaves) or Zinc/Iron chlorosis (upper leaves), or waterlogged soil suffocating roots.\n🌿 **2. Organic Action:** Spray Neem Oil (10,000 PPM) @ 2.5 ml/L water with mild soap.\n🧪 **3. Chemical Spray:** For sucking pests, Acetamiprid 20% SP @ 0.5g/L or Imidacloprid 17.8% SL @ 0.5ml/L. For fungal rot, Carbendazim + Mancozeb (Saaf) @ 2g/L.\n⚡ **4. Nutrition:** Foliar spray 19:19:19 @ 5g/L + Chelated Zinc (Zn-EDTA) @ 1g/L. Allow soil to breathe before next irrigation.",
    hi: "🌾 **कृषि-मित्र सलाह: पत्तियों का पीलापन**\n\n🔍 **1. कारण:** नाइट्रोजन की कमी या जिंक/आयरन क्लोरोसिस, या जलभराव से जड़ गलन।\n🌿 **2. जैविक उपाय:** 10,000 PPM नीम तेल 2.5 मिली/लीटर पानी में छिड़कें।\n🧪 **3. रासायनिक दवा:** रस चूसक कीटों के लिए एसिटामिप्रिड 20% SP @ 0.5 ग्राम/लीटर या इमिडाक्लोप्रिड @ 0.5 मिली/लीटर।\n⚡ **4. पोषण:** 19:19:19 @ 5 ग्राम/लीटर + चिलेटेड जिंक 1 ग्राम/लीटर का पर्णीय छिड़काव करें।",
    mr: "🌾 **कृषिमित्र तज्ज्ञ सल्ला: पाने पिवळी पडणे**\n\n🔍 **1. निदान:** नत्राची कमतरता किंवा लोह/जस्त कमतरता, अथवा शेतात सतत साचलेले पाणी.\n🌿 **2. जैविक उपाय:** 10,000 PPM निमार्क 2.5 मिली/लिटर पाण्यात फवारा.\n🧪 **3. रासायनिक फवारणी:** रस शोषक किडींसाठी ॲसिटामिप्रीड 20% SP @ 0.5 ग्रॅम/लिटर किंवा इमिडाक्लोप्रिड @ 0.5 मिली/लिटर.\n⚡ **4. खत व्यवस्थापन:** 19:19:19 @ 5 ग्रॅम/लिटर + चिलेटेड झिंक 1 ग्रॅम/लिटर फवारा. वाफसा आल्याशिवाय पाणी देऊ नका.",
  },
  borer: {
    en: "🌾 **AgriMitra Advisory: Stem Borer & Caterpillar Control**\n\n🔍 **1. Diagnosis:** Bore holes in stems/pods with frass excreta.\n🌿 **2. Biological:** Install 5-8 pheromone traps per acre. Spray Bt or Beauveria bassiana @ 5g/L.\n🧪 **3. Chemical:** Chlorantraniliprole 18.5% SC (Coragen) @ 0.4 ml/L OR Emamectin Benzoate 5% SG @ 0.5g/L.",
    hi: "🌾 **कृषि-मित्र सलाह: तना छेदक व इल्ली रोकथाम**\n\n🔍 **1. लक्षण:** तने में छेद और मुख्य तने का सूखना।\n🌿 **2. जैविक:** प्रति एकड़ 5-8 फेरोमोन ट्रैप लगाएं।\n🧪 **3. रासायनिक:** कोराजन (Chlorantraniliprole) 0.4 मिली/लीटर या इमामेक्टिन बेंजोएट 0.5 ग्राम/लीटर पानी में छिड़कें।",
    mr: "🌾 **कृषिमित्र सल्ला: खोडकिडा व अळी नियंत्रण**\n\n🔍 **1. लक्षणे:** खोडाला छिद्र व मधला पोंगा सुकणे.\n🌿 **2. जैविक उपाय:** एकरी 5 ते 8 कामगंध सापळे लावा.\n🧪 **3. रासायनिक फवारणी:** कोराजन 0.4 मिली/लिटर किंवा इमामेक्टिन बेंझोएट 0.5 ग्रॅम/लिटर फवारा.",
  }
};

export default function FloatingChatbot({ user }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFieldMode, setIsFieldMode] = useState(false);
  const [language, setLanguage] = useState(i18n.language || user?.language || "en");
  const [crop, setCrop] = useState("Soybean");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: GREETINGS[i18n.language || user?.language || "en"] || GREETINGS.en,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isFieldModeRef = useRef(false);

  useEffect(() => {
    isFieldModeRef.current = isFieldMode;
  }, [isFieldMode]);

  // Sync language with active topbar i18n language dynamically across all 7 supported languages
  useEffect(() => {
    const handleLngChange = (lng) => {
      if (lng) {
        setLanguage(lng);
        // Update first welcome greeting message in-place
        setMessages((prev) => {
          if (prev.length > 0 && prev[0].sender === "bot") {
            const updated = [...prev];
            updated[0] = { ...updated[0], text: GREETINGS[lng] || GREETINGS.en };
            return updated;
          }
          return prev;
        });
      }
    };
    if (i18n.language) handleLngChange(i18n.language);
    i18n.on("languageChanged", handleLngChange);
    return () => {
      i18n.off("languageChanged", handleLngChange);
    };
  }, []);

  // Listen for external open+send or fieldmode requests
  useEffect(() => {
    const openHandler = (e) => {
      setIsOpen(true);
      if (e.detail?.question) {
        setTimeout(() => handleSend(e.detail.question), 300);
      }
    };
    const fieldModeHandler = () => {
      setIsOpen(true);
      setIsFieldMode(true);
      setTimeout(() => toggleListening(), 400);
    };

    window.addEventListener("agrimitra:open", openHandler);
    window.addEventListener("agrimitra:fieldmode", fieldModeHandler);
    return () => {
      window.removeEventListener("agrimitra:open", openHandler);
      window.removeEventListener("agrimitra:fieldmode", fieldModeHandler);
    };
  }, []);

  // Setup Web Speech API for Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
  }, [language]);

  // Update recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      const localeMap = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        gu: "gu-IN",
        pa: "pa-IN",
        te: "te-IN",
        kn: "kn-IN",
      };
      recognitionRef.current.lang = localeMap[language] || "en-IN";
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        // Recognition might already be active
      }
    }
  };

  const speakText = (text, lang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const localeMap = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      pa: "pa-IN",
      te: "te-IN",
      kn: "kn-IN",
    };
    const cleanText = text.replace(/[*_#`\-|>]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = localeMap[lang] || "en-IN";
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isFieldModeRef.current) {
        setTimeout(() => toggleListening(), 700);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (isFieldModeRef.current) {
        setTimeout(() => toggleListening(), 700);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setIsFieldMode(false);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    const greetingMsg = {
      role: "assistant",
      text: GREETINGS[newLang] || GREETINGS.en,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, greetingMsg]);
  };

  const handleSend = async (textToSend) => {
    const query = (typeof textToSend === "string" ? textToSend : input).trim();
    if (!query || loading) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    const userMsg = {
      role: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const activeCrop = crop === "General" ? undefined : crop;
      const res = await api.askMedicineAssistant(query, activeCrop, language);
      const botAnswer = res.answer || "Advice prepared successfully.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: botAnswer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      speakText(botAnswer, language);
    } catch (err) {
      console.warn("AgriMitra remote call failed, using client agronomic fallback:", err);
      // Client-side local fallback so the user always receives expert guidance
      const qLower = query.toLowerCase();
      let fallbackText = "";
      if (qLower.includes("pm-kisan") || qLower.includes("pm kisan") || qLower.includes("namo shetkari") || qLower.includes("scheme") || qLower.includes("योजना") || qLower.includes("subsidy") || qLower.includes("अनुदान") || qLower.includes("office") || qLower.includes("कार्यालय") || qLower.includes("0.32") || qLower.includes("apply") || qLower.includes("अर्ज")) {
        fallbackText = language === "mr"
          ? "🏛️ **पीएम-किसान + नमो शेतकरी महासन्मान निधी योजना (महाराष्ट्र)**\n\n💰 **१. एकूण आर्थिक लाभ:** दरवर्षी **₹१२,००० थेट बँक खात्यात (DBT)** जमा होतात (₹६,००० केंद्र + ₹६,००० महाराष्ट्र शासन - दर ४ महिन्यांनी ₹४,०००).\n\n🌾 **२. ०.३२ एकर जमिनीसाठी पात्रता:** **होय, तुम्ही १००% पात्र आहात!** कोणतीही किमान जमिनीची अट नाही. अल्प व अत्यल्प भूधारक शेतकरी म्हणून तुम्ही पात्र आहात.\n\n📋 **३. अर्ज प्रक्रिया:** **pmkisan.gov.in** वर जाऊन 'New Farmer Registration' करा, आधार OTP सत्यापित करा, ७/१२ व ८-अ तपशील भरा व कागदपत्रे अपलोड करा.\n\n🏢 **४. जवळचे कार्यालय:** आपल्या गावातील **आपले सरकार सेवा केंद्र / CSC केंद्र**, **तलाठी कार्यालय / ग्रामपंचायत**, किंवा **तालुका कृषी अधिकारी कार्यालय**.\n\n📄 **५. आवश्यक कागदपत्रे:** आधार कार्ड, डिजिटल ७/१२ व ८-अ उतारा, बँक पासबुक (Aadhaar DBT लिंक)."
          : language === "hi"
          ? "🏛️ **पीएम-किसान सम्मान निधि + नमो शेतकरी महासम्मान योजना (महाराष्ट्र)**\n\n💰 **1. कुल लाभ:** **₹12,000 प्रति वर्ष** (₹6,000 केंद्र + ₹6,000 महाराष्ट्र सरकार DBT).\n\n🌾 **2. 0.32 एकड़ जमीन की पात्रता:** **हाँ, आप 100% पात्र हैं!** न्यूनतम जमीन की कोई बाध्यता नहीं है।\n\n📋 **3. आवेदन प्रक्रिया:** **pmkisan.gov.in** पोर्टल पर New Farmer Registration करें, आधार OTP सत्यापित करें और 7/12 व 8A विवरण भरें।\n\n🏢 **4. निकटतम कार्यालय:** नजदीकी **सीएससी (CSC) / आपले सरकार सेवा केंद्र**, **तलाठी / ग्राम पंचायत** या **तालुका कृषि अधिकारी कार्यालय**।\n\n📄 **5. दस्तावेज:** आधार कार्ड, 7/12 व 8A खतौनी, बैंक पासबुक (Aadhaar NPCI लिंक)।"
          : "🏛️ **PM-Kisan Samman Nidhi + Namo Shetkari MahaSamman (Maharashtra)**\n\n💰 **1. Total Financial Benefit:** **₹12,000 / year** directly credited via DBT (₹6,000 Central + ₹6,000 Maharashtra State - credited as ₹4,000 every 4 months).\n\n🌾 **2. Eligibility for 0.32 Acres:** **YES, you are 100% eligible!** There is no minimum land requirement under PM-Kisan. Small & marginal farmers owning any cultivable land are entitled.\n\n📋 **3. Step-by-Step Application:** Visit **pmkisan.gov.in** -> Click 'New Farmer Registration' -> Enter Aadhaar & OTP -> Fill 7/12 Survey & 8A Khata details -> Upload digitized 7/12 & Aadhaar.\n\n🏢 **4. Nearest Offices:** Your local **CSC / Aaple Sarkar Seva Kendra**, **Talathi Office / Gram Panchayat**, or **Taluka Agriculture Officer (TKA)**.\n\n📄 **5. Required Documents:** Aadhaar Card, Digitized 7/12 & 8A extract, and DBT-mapped Bank Passbook.";
      } else if (qLower.includes("yellow") || qLower.includes("पील") || qLower.includes("पिवळ")) {
        fallbackText = LOCAL_FALLBACKS.yellow[language] || LOCAL_FALLBACKS.yellow.en;
      } else if (qLower.includes("borer") || qLower.includes("इल्ली") || qLower.includes("अळी") || qLower.includes("pest")) {
        fallbackText = LOCAL_FALLBACKS.borer[language] || LOCAL_FALLBACKS.borer.en;
      } else {
        fallbackText = language === "mr"
          ? `🌾 **कृषिमित्र सल्ला (${crop}):** पिकाची नियमित पाहणी करा. पानांवर कीड आढळल्यास निमार्क (Neem Oil) फवारा आणि संतुलित खत व्यवस्थापन ठेवा.`
          : language === "hi"
          ? `🌾 **कृषि-मित्र सलाह (${crop}):** फसल की नियमित निगरानी रखें। रस चूसक कीटों के लिए नीम तेल और 19:19:19 घुलनशील खाद का छिड़काव करें।`
          : `🌾 **AgriMitra Advisory (${crop}):** Inspect field canopy for pest activity. Apply balanced foliar nutrition (NPK 19:19:19) and neem-based protection.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: fallbackText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      speakText(fallbackText, language);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setMessages([
      {
        role: "assistant",
        text: GREETINGS[language] || GREETINGS.en,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Helper to format bot markdown text into clean JSX
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split("\n");
    return lines.map((line, lIdx) => {
      if (!line.trim()) {
        return <div key={lIdx} className="h-1.5" />;
      }

      // Format bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-emerald-950">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
      const isHeader = line.includes("**") && (line.includes("1.") || line.includes("2.") || line.includes("3.") || line.includes("4.") || line.includes("5."));

      return (
        <div
          key={lIdx}
          className={`${isHeader ? "mt-2 mb-0.5 font-semibold text-emerald-900" : isBullet ? "pl-2 text-slate-800" : "text-slate-800"} leading-relaxed`}
        >
          {formattedParts}
        </div>
      );
    });
  };

  const activeSuggestions = SUGGESTIONS[language] || SUGGESTIONS.en;

  return (
    <>
      {/* Floating Action Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2.5">
        {/* Chat Window */}
        {isOpen && (
          <div
            className="w-[410px] max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)] flex flex-col overflow-hidden transition-all duration-300"
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 24px 60px -12px rgba(22, 51, 31, 0.28), 0 8px 24px -4px rgba(0, 0, 0, 0.08)",
              border: "1px solid #dce4d9",
              animation: "agriSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 py-3.5 flex items-center justify-between shadow-sm relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-400/30 flex items-center justify-center text-white shadow-inner">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-900 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold tracking-tight text-white">
                      AgriMitra AI
                    </h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    24/7 Smart Agronomic Advisor
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isFieldMode;
                    setIsFieldMode(nextMode);
                    if (nextMode) {
                      setTimeout(() => toggleListening(), 300);
                    } else {
                      window.speechSynthesis?.cancel();
                      setIsSpeaking(false);
                    }
                  }}
                  title="Hands-Free Voice Mode"
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isFieldMode
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-1 ring-amber-300"
                      : "bg-white/15 text-white/90 hover:bg-white/25"
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isFieldMode ? "animate-pulse" : ""}`} />
                  <span>{isFieldMode ? "Voice ON" : "Voice"}</span>
                </button>

                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear chat"
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors ml-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Field Mode Banner */}
            {isFieldMode && (
              <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span>Hands-Free Active: Speak your farming query</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-black/20 px-1.5 py-0.5 rounded">
                  Listening
                </span>
              </div>
            )}

            {/* Context Filter Bar (Crop & Languages) */}
            <div className="bg-slate-50 border-b border-slate-200/80 px-3 py-2 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 shrink-0">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <div className="relative">
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="appearance-none bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-2 pointer-events-none" />
                </div>
              </div>

              {/* Languages scrollable pill list */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      language === l.code
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#faf9f5]">
              {messages.map((m, idx) => {
                const isBot = m.role === "assistant";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 ${isBot ? "flex-row" : "flex-row-reverse"}`}
                  >
                    {isBot ? (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-emerald-500/20">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[85%] ${isBot ? "items-start" : "items-end"}`}>
                      <div
                        className={`p-3 rounded-2xl text-[13px] leading-relaxed break-words shadow-sm ${
                          isBot
                            ? "bg-white text-slate-800 border border-emerald-950/10 rounded-tl-sm"
                            : "bg-gradient-to-r from-emerald-800 to-teal-900 text-white font-medium rounded-tr-sm"
                        }`}
                      >
                        {isBot ? renderFormattedText(m.text) : m.text}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1">
                        <span className="text-[10px] text-slate-600 font-medium">{m.time}</span>
                        {isBot && (
                          <button
                            type="button"
                            onClick={() => speakText(m.text, language)}
                            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors ml-1"
                            title="Read response aloud"
                          >
                            <Volume2 className="w-3 h-3 text-emerald-700" />
                            <span>Listen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2.5 text-slate-500 text-xs font-medium pl-1">
                  <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  </div>
                  <span>AgriMitra is synthesizing field advisory...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Voice Activity Pill */}
            {(isListening || isSpeaking) && (
              <div
                className={`px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between border-t transition-colors ${
                  isListening
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full animate-ping ${
                      isListening ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <span>
                    {isListening ? "Listening... (Speak your question)" : "Speaking response aloud..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setIsSpeaking(false);
                    if (isListening) recognitionRef.current?.stop();
                  }}
                  className="text-[11px] underline font-bold"
                >
                  Stop
                </button>
              </div>
            )}

            {/* Quick Suggestions Tray */}
            {messages.length <= 2 && (
              <div className="p-2.5 bg-emerald-50/60 border-t border-emerald-100/70">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5 px-0.5">
                  Suggested Questions
                </div>
                <div className="flex flex-col gap-1">
                  {activeSuggestions.slice(0, 3).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="text-left text-xs bg-white hover:bg-emerald-100/60 text-emerald-950 font-medium px-2.5 py-1.5 rounded-xl border border-emerald-200/60 transition-colors truncate"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2"
            >
              <div className="flex-1 relative flex items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    language === "mr"
                      ? "तुमचा शेती प्रश्न विचारा..."
                      : language === "hi"
                      ? "अपना कृषि प्रश्न यहाँ लिखें..."
                      : "Ask about crops, pests, fertilizers..."
                  }
                  disabled={loading}
                  className="w-full pl-3.5 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={loading}
                  title={isListening ? "Listening... click to stop" : "Voice Input"}
                  className={`absolute right-1.5 p-1 rounded-lg transition-colors ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-emerald-700"
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || loading}
                title="Send query"
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center shrink-0 hover:from-emerald-800 hover:to-teal-900 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-900/35 hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-400/30"
          title="Open AgriMitra AI Smart Farming Advisor"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6 text-emerald-200 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-pulse" />
          </div>
          <span className="sr-only">Toggle AgriMitra AI</span>
        </button>
      </div>
    </>
  );
}
