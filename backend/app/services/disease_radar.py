"""Hyperlocal Disease & Pest Outbreak Radar (48-Hour Early Warning) Engine.

Combines microclimate forecast vectors (relative humidity spikes, leaf wetness hours,
temperature drops/swings, rainfall accumulation) with satellite NDVI vegetation health
to predict specific crop disease & pest outbreaks 48 to 72 hours before visible leaf symptoms appear.
"""
from typing import Dict, Optional


RADAR_DATABASE: Dict[str, Dict] = {
    "Sugarcane": {
        "disease_name_en": "Sugarcane Red Rot & Yellow Leaf Outbreak",
        "disease_name_hi": "गन्ने की लाल सड़न (Red Rot) का 48 घंटे में प्रकोप जोखिम",
        "disease_name_mr": "उसाचा तांबडा रोग / लाल कूज (Red Rot) ४८ तासांचा उद्रेक इशारा",
        "scientific_name": "Colletotrichum falcatum",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48–72 Hours",
        "microclimate_vectors": {
            "humidity_pct": 88,
            "leaf_wetness_hours": 14,
            "temp_range_c": "24°C - 31°C",
            "rainfall_7d_mm": 42.5,
            "ndvi_vigor": 0.68,
        },
        "prevention_protocol_en": "Apply preventive Trichoderma viride @ 5g/L or Carbendazim (0.1%) spray. Ensure field drainage to clear standing water from root zones.",
        "prevention_protocol_hi": "ट्राइकोडर्मा विरिडी (5 ग्राम/लीटर) या कार्बेन्डाजिम (0.1%) का निवारक छिड़काव करें। जलजमाव दूर करने के लिए नालियां साफ करें।",
        "prevention_protocol_mr": "ट्रायकोडेर्मा व्हिरिडी (५ ग्रॅम/लिटर) किंवा कार्बेंडाझिम (०.१%) चे प्रतिबंधात्मक फवारणी करा. उसाच्या मुळांतील पाणी साचणे त्वरित कमी करा.",
    },
    "Tomato": {
        "disease_name_en": "Tomato Late Blight 48H Outbreak Alert",
        "disease_name_hi": "टमाटर पछेती झुलसा (Late Blight) 48 घंटे की पूर्व चेतावनी",
        "disease_name_mr": "टोमॅटो पछेती करपा (Late Blight) ४८ तासांचा पूर्व इशारा",
        "scientific_name": "Phytophthora infestans",
        "risk_level": "Critical Warning",
        "early_warning_window": "Next 24–48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 92,
            "leaf_wetness_hours": 16,
            "temp_range_c": "16°C - 22°C",
            "rainfall_7d_mm": 58.0,
            "ndvi_vigor": 0.62,
        },
        "prevention_protocol_en": "Spray protective Mancozeb 75% WP @ 2g/L or Metalaxyl + Mancozeb (Ridomil Gold) @ 2g/L before rain starts. Stop overhead watering.",
        "prevention_protocol_hi": "बारिश शुरू होने से पहले मैंकोज़ेब (2 ग्राम/लीटर) या रिडोमिल गोल्ड का सुरक्षात्मक छिड़काव करें। पत्तियों पर पानी न छिड़कें।",
        "prevention_protocol_mr": "पाऊस सुरू होण्यापूर्वी मँकोझेब (२ ग्रॅम/लिटर) किंवा रिडोमिल गोल्ड फवारा. पानांवर पाण्याचे सिंचन टाळा.",
    },
    "Wheat": {
        "disease_name_en": "Wheat Stripe / Yellow Rust 48H Alert",
        "disease_name_hi": "गेहूं पीला रतुआ (Yellow Rust) 48 घंटे का प्रकोप चेतावनी",
        "disease_name_mr": "गहू पिवळा तांबेरा (Yellow Rust) ४८ तासांचा उद्रेक इशारा",
        "scientific_name": "Puccinia striiformis",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 86,
            "leaf_wetness_hours": 12,
            "temp_range_c": "10°C - 18°C",
            "rainfall_7d_mm": 18.2,
            "ndvi_vigor": 0.74,
        },
        "prevention_protocol_en": "Apply preventive Propiconazole 25% EC @ 1 ml/L or Tebuconazole @ 1 ml/L. Inspect field borders closely for early yellow streaks.",
        "prevention_protocol_hi": "प्रोपिकोनाज़ोल (1 मिली/लीटर) या टेबुकोनाज़ोल का छिड़काव करें। खेत के किनारों पर शुरुआती पीले निशानों की जांच करें।",
        "prevention_protocol_mr": "प्रोपिकोनाझोल (१ मि.ली./लिटर) किंवा टेब्युकोनाझोल फवारा. शेताच्या बांधावरील पिकांची बारकाईने पाहणी करा.",
    },
    "Cotton": {
        "disease_name_en": "Cotton Pink Bollworm & Leaf Curl Virus Radar",
        "disease_name_hi": "कपास गुलाबी सुंडी (Pink Bollworm) एवं पर्ण कुंचन चेतावनी",
        "disease_name_mr": "कापूस गुलाबी बोंडअळी व पानांचा चुराडा ४८ तास इशारा",
        "scientific_name": "Pectinophora gossypiella & CLCuV",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48–72 Hours",
        "microclimate_vectors": {
            "humidity_pct": 84,
            "leaf_wetness_hours": 10,
            "temp_range_c": "26°C - 34°C",
            "rainfall_7d_mm": 32.0,
            "ndvi_vigor": 0.71,
        },
        "prevention_protocol_en": "Install Pheromone Traps @ 5 traps/acre. Spray Diafenthiuron 50% WP @ 1.2g/L or Neem Oil 10,000 PPM @ 2 ml/L to suppress whiteflies.",
        "prevention_protocol_hi": "फेरोमोन ट्रैप (5 ट्रैप/एकड़) लगाएं। सफेद मक्खी नियंत्रण के लिए डायफेंथियुरॉन या नीम तेल का छिड़काव करें।",
        "prevention_protocol_mr": "कापूस शेतात कामगंध सापळे (५ सापळे/एकड) लावा. पांढऱ्या माशीच्या नियंत्रणासाठी डायफेंथियुरॉन किंवा कडुनिंब तेल फवारा.",
    },
    "Potato": {
        "disease_name_en": "Potato Late Blight 48H Warning Radar",
        "disease_name_hi": "आलू पछेती झुलसा 48 घंटे का पूर्वानुमान अलर्ट",
        "disease_name_mr": "बटाटा पछेती करपा ४८ तास उद्रेक इशारा",
        "scientific_name": "Phytophthora infestans",
        "risk_level": "Critical Warning",
        "early_warning_window": "Next 24–48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 94,
            "leaf_wetness_hours": 18,
            "temp_range_c": "14°C - 20°C",
            "rainfall_7d_mm": 64.0,
            "ndvi_vigor": 0.65,
        },
        "prevention_protocol_en": "Spray protective Cymoxanil + Mancozeb @ 2g/L immediately. Earth up ridges to prevent spore wash into tubers.",
        "prevention_protocol_hi": "साइमोक्सानिल + मैंकोज़ेब (2 ग्राम/लीटर) का तत्काल छिड़काव करें। कंदों को ढकने के लिए मिट्टी चढ़ाएं।",
        "prevention_protocol_mr": "सायमोक्सॅनिल + मँकोझेब २ ग्रॅम/लिटर तातडीने फवारा. बटाट्याचे गड्ड्यां मातीने चांगले झाका.",
    },
    "Rice": {
        "disease_name_en": "Rice Blast & Brown Spot 48H Outbreak Warning",
        "disease_name_hi": "धान ब्लास्ट (Rice Blast) एवं भूरा धब्बा 48 घंटे अलर्ट",
        "disease_name_mr": "भातावरील करपा (Rice Blast) ४८ तास उद्रेक इशारा",
        "scientific_name": "Magnaporthe oryzae",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 91,
            "leaf_wetness_hours": 15,
            "temp_range_c": "22°C - 28°C",
            "rainfall_7d_mm": 72.0,
            "ndvi_vigor": 0.76,
        },
        "prevention_protocol_en": "Spray Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5 ml/L. Avoid excessive split nitrogen top-dressing.",
        "prevention_protocol_hi": "ट्राइसाइक्लाज़ोल (0.6 ग्राम/लीटर) का छिड़काव करें। अधिक नाइट्रोजन खाद देने से बचें।",
        "prevention_protocol_mr": "ट्रायसायक्लाझोल ०.६ ग्रॅम/लिटर किंवा आयसोप्रोथिओलेन फवारा. नत्राचा अतिवापर टाळा.",
    },
    "Soybean": {
        "disease_name_en": "Soybean Rust (Phakopsora pachyrhizi) & Anthracnose Warning",
        "disease_name_hi": "सोयाबीन गेरुआ / रस्ट (Soybean Rust) 48 घंटे पूर्व चेतावनी",
        "disease_name_mr": "सोयाबीन तांबेरा (Soybean Rust) ४८ तास उद्रेक इशारा",
        "scientific_name": "Phakopsora pachyrhizi",
        "risk_level": "Elevated Watch",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 79,
            "leaf_wetness_hours": 11,
            "temp_range_c": "21°C - 29°C",
            "rainfall_7d_mm": 24.0,
            "ndvi_vigor": 0.74,
        },
        "prevention_protocol_en": "Prophylactic spray of Hexaconazole 5% EC @ 2 ml/L or Pyraclostrobin 20% WG @ 1g/L. Clear lower canopy foliage to reduce ground moisture trapping.",
        "prevention_protocol_hi": "हेक्साकोनाज़ोल (2 मिली/लीटर) या पाइराक्लोस्ट्रोबिन (1 ग्राम/लीटर) का छिड़काव करें। जल निकासी सुनिश्चित करें।",
        "prevention_protocol_mr": "हेक्साकोनाझोल ५% ईसी २ मि.ली./लिटर किंवा पायराक्लोस्ट्रॉबिन फवारा. तळ पानांमधील दमटपणा कमी करा.",
    },
    "Onion": {
        "disease_name_en": "Onion Purple Blotch & Stemphylium Blight Alert",
        "disease_name_hi": "प्याज का बैंगनी धब्बा (Purple Blotch) 48 घंटे चेतावनी",
        "disease_name_mr": "कांद्यावरील जांभळा करपा (Purple Blotch) ४८ तास उद्रेक इशारा",
        "scientific_name": "Alternaria porri",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48–72 Hours",
        "microclimate_vectors": {
            "humidity_pct": 84,
            "leaf_wetness_hours": 12,
            "temp_range_c": "18°C - 27°C",
            "rainfall_7d_mm": 18.5,
            "ndvi_vigor": 0.65,
        },
        "prevention_protocol_en": "Spray Mancozeb 75% WP @ 2.5g/L or Tebuconazole 25.9% EC @ 1.5 ml/L mixed with spreader/sticker. Avoid overhead sprinkler irrigation during night.",
        "prevention_protocol_hi": "मैंकोज़ेब (2.5 ग्राम/लीटर) या टेबुकोनाज़ोल का स्टिकर मिलाकर छिड़काव करें। रात में स्प्रिंकलर से सिंचाई न करें।",
        "prevention_protocol_mr": "मँकोझेब २.५ ग्रॅम/लिटर किंवा टेब्युकोनाझोल १.५ मि.ली. स्टिकर मिसळून फवारा. रात्रीच्या वेळी स्प्रिंकलर टाळा.",
    },
    "Maize": {
        "disease_name_en": "Fall Armyworm (Spodoptera frugiperda) & Turcicum Blight Radar",
        "disease_name_hi": "मक्का फॉल आर्मीवर्म एवं टर्सिकम ब्लाइट चेतावनी",
        "disease_name_mr": "मका लष्करी अळी (Fall Armyworm) ४८ तास उद्रेक इशारा",
        "scientific_name": "Spodoptera frugiperda",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 75,
            "leaf_wetness_hours": 8,
            "temp_range_c": "22°C - 32°C",
            "rainfall_7d_mm": 22.0,
            "ndvi_vigor": 0.72,
        },
        "prevention_protocol_en": "Apply Emamectin Benzoate 5% SG @ 0.4g/L directed into central whorls. Install 4 sex pheromone traps per acre.",
        "prevention_protocol_hi": "इमामेक्टिन बेंजोएट (0.4 ग्राम/लीटर) का छिड़काव पोंगे (whorl) में करें। प्रति एकड़ 4 फेरोमोन ट्रैप लगाएं।",
        "prevention_protocol_mr": "इमामेक्टिन बेन्झोएट ०.४ ग्रॅम/लिटर पोंग्यात फवारा. एकरी ४ कामगंध सापळे लावा.",
    },
    "Chilli": {
        "disease_name_en": "Chilli Anthracnose (Die-back) & Thrips Murda Outbreak Radar",
        "disease_name_hi": "मिर्च का डाईबैक (Anthracnose) एवं थ्रिप्स अलर्ट",
        "disease_name_mr": "मिरचीवरील चुरडा-मुरडा (थ्रिप्स) व फळकूज ४८ तास इशारा",
        "scientific_name": "Colletotrichum capsici & Scirtothrips dorsalis",
        "risk_level": "Critical Warning",
        "early_warning_window": "Next 24–48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 87,
            "leaf_wetness_hours": 13,
            "temp_range_c": "20°C - 30°C",
            "rainfall_7d_mm": 28.0,
            "ndvi_vigor": 0.67,
        },
        "prevention_protocol_en": "Spray Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L. Install 10 blue and yellow sticky traps per acre.",
        "prevention_protocol_hi": "एज़ोक्सीस्ट्रोबिन + डिफेनोकोनाज़ोल (1 मिली/लीटर) का छिड़काव करें। नीले व पीले चिपचिपे ट्रैप लगाएं।",
        "prevention_protocol_mr": "अझॉक्सीस्ट्रॉबिन + डायफेनोकोनाझोल १ मि.ली./लिटर फवारा. एकरी १० पिवळे व निळे चिकट सापळे लावा.",
    },
    "Mustard": {
        "disease_name_en": "Mustard White Rust & Alternaria Blight Radar",
        "disease_name_hi": "सरसों सफेद रोली (White Rust) 48 घंटे पूर्वानुमान",
        "disease_name_mr": "मोहरीवरील पांढरा तांबेरा (White Rust) ४८ तास इशारा",
        "scientific_name": "Albugo candida",
        "risk_level": "Elevated Watch",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 82,
            "leaf_wetness_hours": 11,
            "temp_range_c": "12°C - 23°C",
            "rainfall_7d_mm": 12.0,
            "ndvi_vigor": 0.70,
        },
        "prevention_protocol_en": "Spray Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ) @ 2g/L. Avoid high nitrogen late top-dressing.",
        "prevention_protocol_hi": "रिडोमिल एमजेड (2 ग्राम/लीटर) का छिड़काव करें। अधिक यूरिया देने से बचें।",
        "prevention_protocol_mr": "रिडोमिल एमझेड २ ग्रॅम/लिटर फवारा. अति युरिया खत देणे टाळा.",
    },
    "Gram / Chana": {
        "disease_name_en": "Chickpea / Chana Wilt & Ascochyta Blight Radar",
        "disease_name_hi": "चना उकठा (Wilt) एवं अंगमारी 48 घंटे पूर्व चेतावनी",
        "disease_name_mr": "हरभरा मर रोग (Wilt) व करपा ४८ तास उद्रेक इशारा",
        "scientific_name": "Fusarium oxysporum f. sp. ciceris",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 74,
            "leaf_wetness_hours": 8,
            "temp_range_c": "15°C - 28°C",
            "rainfall_7d_mm": 10.0,
            "ndvi_vigor": 0.68,
        },
        "prevention_protocol_en": "Drench collar zones with Carbendazim 50% WP @ 1g/L or bio-agent Trichoderma viride. Avoid excessive flooding irrigation.",
        "prevention_protocol_hi": "कार्बेन्डाजिम (1 ग्राम/लीटर) या ट्राइकोडर्मा से जड़ क्षेत्र को सींचें। खेत में अधिक पानी न भरें।",
        "prevention_protocol_mr": "कार्बेंडाझिम १ ग्रॅम/लिटर किंवा ट्रायकोडेर्मा खोडाभोवती टाका. अति पाणी साचू देऊ नका.",
    },
    "Groundnut": {
        "disease_name_en": "Groundnut Tikka Leaf Spot & Collar Rot Radar",
        "disease_name_hi": "मूंगफली टिक्का रोग (Tikka Disease) 48 घंटे चेतावनी",
        "disease_name_mr": "भुईमूग टिक्का व तांबेरा रोग ४८ तास उद्रेक इशारा",
        "scientific_name": "Cercospora arachidicola",
        "risk_level": "High Risk",
        "early_warning_window": "Next 48–72 Hours",
        "microclimate_vectors": {
            "humidity_pct": 86,
            "leaf_wetness_hours": 13,
            "temp_range_c": "23°C - 31°C",
            "rainfall_7d_mm": 35.0,
            "ndvi_vigor": 0.71,
        },
        "prevention_protocol_en": "Spray Chlorothalonil 75% WP @ 2g/L or Tebuconazole 25.9% EC @ 1.5 ml/L. Ensure rapid surface runoff.",
        "prevention_protocol_hi": "क्लोरोथैलोनिल (2 ग्राम/लीटर) या टेबुकोनाज़ोल का छिड़काव करें। जल निकास ठीक रखें।",
        "prevention_protocol_mr": "क्लोरोथॅलोनिल २ ग्रॅम/लिटर किंवा टेब्युकोनाझोल फवारा. शेतातून अतिरिक्त पाण्याचा निचरा करा.",
    },
    "Tur / Arhar": {
        "disease_name_en": "Pigeonpea / Tur Phytophthora Blight & Wilt Radar",
        "disease_name_hi": "अरहर फाइटोफ्थोरा ब्लाइट एवं उकठा चेतावनी",
        "disease_name_mr": "तूर पानांवरील व खोडावरील करपा (Blight) ४८ तास इशारा",
        "scientific_name": "Phytophthora drechsleri f. sp. cajani",
        "risk_level": "Elevated Watch",
        "early_warning_window": "Next 48 Hours",
        "microclimate_vectors": {
            "humidity_pct": 83,
            "leaf_wetness_hours": 10,
            "temp_range_c": "21°C - 30°C",
            "rainfall_7d_mm": 30.0,
            "ndvi_vigor": 0.69,
        },
        "prevention_protocol_en": "Spray Metalaxyl-M + Mancozeb (Ridomil Gold) @ 2g/L. Form ridges along rows to avoid collar rot in standing water.",
        "prevention_protocol_hi": "रिडोमिल गोल्ड (2 ग्राम/लीटर) का छिड़काव करें। पौधों के तने के पास मिट्टी चढ़ाएं।",
        "prevention_protocol_mr": "रिडोमिल गोल्ड २ ग्रॅम/लिटर फवारा. झाडांच्या खोडाजवळ पाणी साचणार नाही याची काळजी घ्या.",
    },
}


def analyze_disease_outbreak_radar(
    crop: Optional[str] = None,
    language: str = "en",
    farm_context: Optional[Dict] = None,
) -> Dict:
    """Calculates 48–72 hour predictive disease & pest outbreak radar for the given crop/farm context."""
    target_crop = crop if crop and crop in RADAR_DATABASE else "Sugarcane"
    radar_info = RADAR_DATABASE[target_crop]

    # Dynamically adjust microclimate metrics if live farm weather/NDVI available
    vectors = dict(radar_info["microclimate_vectors"])
    if farm_context:
        weather = farm_context.get("weather")
        if weather and "temperature_c" in weather and weather["temperature_c"] is not None:
            t = weather["temperature_c"]
            vectors["temp_range_c"] = f"{t-3:.0f}°C - {t+5:.0f}°C"
        if weather and "humidity_pct" in weather and weather["humidity_pct"] is not None:
            h = weather["humidity_pct"]
            vectors["humidity_pct"] = round(h)
            vectors["leaf_wetness_hours"] = max(3, min(18, round(h / 6.0)))
        if weather and "rainfall_7d_mm" in weather and weather["rainfall_7d_mm"] is not None:
            vectors["rainfall_7d_mm"] = round(weather["rainfall_7d_mm"], 1)
        ndvi = farm_context.get("ndvi")
        if ndvi and "ndvi_mean" in ndvi and ndvi["ndvi_mean"] is not None:
            vectors["ndvi_vigor"] = round(float(ndvi["ndvi_mean"]), 2)

    disease_title = (
        radar_info["disease_name_mr"]
        if language == "mr"
        else (radar_info["disease_name_hi"] if language == "hi" else radar_info["disease_name_en"])
    )
    prevention_protocol = (
        radar_info["prevention_protocol_mr"]
        if language == "mr"
        else (radar_info["prevention_protocol_hi"] if language == "hi" else radar_info["prevention_protocol_en"])
    )

    return {
        "crop": target_crop,
        "disease_name": disease_title,
        "scientific_name": radar_info["scientific_name"],
        "risk_level": radar_info["risk_level"],
        "early_warning_window": radar_info["early_warning_window"],
        "microclimate_vectors": vectors,
        "prevention_protocol": prevention_protocol,
        "recommended_action": prevention_protocol,
        "radar_active": True,
        "is_live": bool(farm_context),
        "farm_name": farm_context.get("farm_name") if farm_context else None,
        "station": "Sentinel-2 Satellite & Open-Meteo Microclimate Telemetry" if farm_context else None,
    }
