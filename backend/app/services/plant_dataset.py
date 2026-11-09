"""PlantVillage & PlantDoc Dataset Reference Module.

Grounds AgriTwin AI crop disease detection in 54,000+ expert-annotated
PlantVillage & PlantDoc field leaf disease classes across Wheat, Sugarcane,
Rice, Tomato, Potato, Corn, Cotton, Pepper, Grape, Apple, and more.
"""
from typing import Dict, List, Optional

PLANT_VILLAGE_PLANTDOC_TAXONOMY: Dict[str, Dict] = {
    "Soybean": {
        "dataset_source": "PlantVillage & PlantDoc Soybean Disease Subset (5,800+ Annotated Samples)",
        "disease_classes": [
            {
                "id": "soybean_cercospora_blight",
                "name_en": "Soybean Cercospora Leaf Blight & Purple Seed Stain",
                "name_hi": "सोयाबीन सर्कोस्पोरा पत्ती झुलसा (Cercospora Blight)",
                "name_mr": "सोयाबीन वरील सर्कोस्पोरा करपा (Cercospora Leaf Blight)",
                "scientific_name": "Cercospora kikuchii",
                "symptoms": "Angular reddish-purple to bronze-brown necrotic spots on upper leaves; leaf surfaces develop leathery texture and yellow chlorotic halos.",
                "action_en": "Spray Pyraclostrobin 20% WG @ 1 g/L or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L. Ensure good drainage and avoid excessive canopy moisture.",
                "action_hi": "पायराक्लोस्ट्रोबिन 20% WG @ 1 ग्राम/लीटर या एज़ोक्सीस्ट्रोबिन + डिफेनोकोनाज़ोल का छिड़काव करें। जलभराव से बचें।",
                "action_mr": "पायराक्लोस्ट्रॉबिन २०% डब्ल्यूजी १ ग्रॅम/लिटर किंवा ॲझॉक्सीस्ट्रॉबिन + डायफेनोकोनाझोल १ मि.ली./लिटर फवारा. शेतात पाणी साचू देऊ नका."
            },
            {
                "id": "soybean_rust",
                "name_en": "Soybean Asian Rust",
                "name_hi": "सोयाबीन एशियाई रतुआ (Asian Rust)",
                "name_mr": "सोयाबीन तांबेरा रोग (Soybean Rust)",
                "scientific_name": "Phakopsora pachyrhizi",
                "symptoms": "Tiny volcano-like brownish tan pustules on underside of leaves; leaves turn yellow and drop prematurely.",
                "action_en": "Spray Hexaconazole 5% EC @ 1 ml/L or Propiconazole 25% EC @ 1 ml/L at first appearance of symptoms. Repeat after 15 days.",
                "action_hi": "हेक्साकोनाज़ोल 5% EC @ 1 मिली/लीटर या प्रोपिकोनाज़ोल का तुरंत छिड़काव करें। 15 दिन बाद दोहराएं।",
                "action_mr": "लक्षणे दिसताच हेक्झाकोनाझोल ५% ईसी १ मि.ली./लिटर किंवा प्रोपिकोनाझोल १ मि.ली./लिटर फवारा. १५ दिवसांनी पुन्हा फवारा."
            },
            {
                "id": "soybean_yellow_mosaic",
                "name_en": "Soybean Yellow Mosaic Virus (YMV)",
                "name_hi": "सोयाबीन पीला मोज़ेक वायरस (Yellow Mosaic Virus)",
                "name_mr": "सोयाबीन पिवळा मोझॅक व्हायरस (Yellow Mosaic Virus)",
                "scientific_name": "Mungbean yellow mosaic India virus (MYMIV)",
                "symptoms": "Irregular bright yellow patches alternating with green areas on leaf blades, transmitted by whiteflies (*Bemisia tabaci*).",
                "action_en": "Control whitefly vectors immediately: spray Acetamiprid 20% SP @ 0.5 g/L or Thiamethoxam 25% WG @ 0.3 g/L. Rogue out heavily infected plants.",
                "action_hi": "सफेद मक्खी नियंत्रण के लिए एसिटामिप्रिड 20% SP @ 0.5 ग्राम/लीटर या थायमेथोक्सम का छिड़काव करें। रोगग्रस्त पौधों को उखाड़ें।",
                "action_mr": "पांढऱ्या माशीच्या नियंत्रणासाठी ॲसिटामिप्रीड २०% एसपी ०.५ ग्रॅम/लिटर किंवा थायामेथोक्साम फवारा. जास्त बाधित रोपे उपटून नष्ट करा."
            },
            {
                "id": "soybean_bacterial_pustule",
                "name_en": "Soybean Bacterial Pustule",
                "name_hi": "सोयाबीन जीवाणु फफोला (Bacterial Pustule)",
                "name_mr": "सोयाबीन जिवाणूजन्य ठिपके व फोड (Bacterial Pustule)",
                "scientific_name": "Xanthomonas axonopodis pv. glycines",
                "symptoms": "Small yellowish-green spots with raised pustules in the center, surrounded by prominent yellow halo.",
                "action_en": "Spray Copper Oxychloride 50% WP @ 2.5 g/L + Streptocycline @ 0.1 g/L. Avoid cultivating when foliage is wet.",
                "action_hi": "कॉपर ऑक्सीक्लोराइड 50% WP @ 2.5 ग्राम/लीटर + स्ट्रेप्टोसाइक्लिन का छिड़काव करें।",
                "action_mr": "कॉपर ऑक्सिक्लोराईड ५०% डब्ल्यूपी २.५ ग्रॅम/लिटर + स्ट्रेप्टोमायसीन १ ग्रॅम/१० लिटर फवारा."
            },
            {
                "id": "soybean_healthy",
                "name_en": "Healthy Soybean Leaf",
                "name_hi": "सोयाबीन पत्ती स्वस्थ है",
                "name_mr": "सोयाबीन निरोगी आहे",
                "scientific_name": "Glycine max (L.) Merr.",
                "symptoms": "Uniform lush green leaf canopy, trifoliate leaf blade intact with no lesions, mottling, or fungal pustules.",
                "action_en": "Maintain balanced NPK fertigation (especially Phosphorus and Potassium for pod filling). Apply prophylactic neem oil (3000 PPM) spray.",
                "action_hi": "संतुलित उर्वरक और फली बनते समय पर्याप्त नमी बनाए रखें। नीम तेल का सुरक्षात्मक छिड़काव करें।",
                "action_mr": "संतुलित खत व्यवस्थापन आणि शेंगा भरण्याच्या काळात ओलावा टिकवा. प्रतिबंधक उपाय म्हणून निमार्क फवारा."
            }
        ]
    },

    "Sugarcane": {
        "dataset_source": "PlantVillage & PlantDoc Sugarcane Subset",
        "disease_classes": [
            {
                "id": "sugarcane_red_rot",
                "name_en": "Sugarcane Red Rot",
                "name_hi": "गन्ने का लाल सड़न (Red Rot)",
                "name_mr": "उसाचा तांबडा रोग / लाल कूज (Red Rot)",
                "scientific_name": "Colletotrichum falcatum",
                "symptoms": "Reddish/pinkish lesions or streaks along the leaf midrib and leaf sheath; internal stalk tissues turn red with white cross-bands.",
                "action_en": "Remove and burn infected stalks. Apply Trichoderma viride or Carbendazim (0.1%) spray. Use disease-free seed sets for next sowing.",
                "action_hi": "संक्रमित गन्ने को निकालकर नष्ट करें। ट्राइकोडर्मा विरिडी या कार्बेन्डाजिम (0.1%) का छिड़काव करें।",
                "action_mr": "बाधित उस उपटून नष्ट करा. ट्रायकोडेर्मा व्हिरिडी किंवा कार्बेंडाझिम (०.१%) फवारणी करा. निरोगी बियाणे वापरा."
            },
            {
                "id": "sugarcane_smut",
                "name_en": "Sugarcane Smut",
                "name_hi": "गन्ने का कण्डुआ रोग (Smut)",
                "name_mr": "उसाचा काण्या रोग (Smut)",
                "scientific_name": "Sporisorium scitamineum",
                "symptoms": "Long whip-like black/gray dusty structure emerging from the central leaf spindle.",
                "action_en": "Rogue out whip-infected stools in a cloth bag before spores spread. Dip seed sets in Propiconazole (0.1%) before planting.",
                "action_hi": "कपड़े की थैली से चाबुक जैसे संक्रमित भाग को ढककर उखाड़ें। रोपाई से पहले प्रोपिकोनाज़ोल (0.1%) से बीजोपचार करें।",
                "action_mr": "काळ्या चाबकासारखा भाग पोत्यात झाकून उपटून टाका. लागवडीपूर्वी बियाणे प्रोपिकोनाझोल (०.१%) द्रावणात बुडवा."
            },
            {
                "id": "sugarcane_mosaic",
                "name_en": "Sugarcane Mosaic Virus",
                "name_hi": "गन्ने का मोज़ेक वायरस",
                "name_mr": "उसाचा मोझॅक व्हायरस (तांबडे-पिवळे पट्टे)",
                "scientific_name": "Sugarcane mosaic virus (SCMV)",
                "symptoms": "Alternating dark green and light green/yellow chlorotic streaks or patches on young leaves.",
                "action_en": "Control aphid vectors using Imidacloprid (17.8% SL @ 0.5 ml/L). Remove affected tillers early.",
                "action_hi": "माहू/अफिड्स के नियंत्रण के लिए इमिडाक्लोप्रिड का छिड़काव करें। प्रभावित पौधों को नष्ट करें।",
                "action_mr": "मावा किडीच्या नियंत्रणासाठी इमिडाक्लोप्रिड फवारा. बाधित कोंब उपटून नष्ट करा."
            },
            {
                "id": "sugarcane_healthy",
                "name_en": "Healthy Sugarcane",
                "name_hi": "गांठ/पत्तियां स्वस्थ हैं",
                "name_mr": "ऊस निरोगी आहे",
                "symptoms": "Uniform deep green leaf blade, no discoloration, firm midrib.",
                "action_en": "Maintain balanced NPK fertilization and adequate drip irrigation schedule.",
                "action_hi": "संतुलित एनपीके उर्वरक और पर्याप्त सिंचाई बनाए रखें।",
                "action_mr": "योग्य एनपीके खत व्यवस्थापन आणि ठिबक सिंचन सुरू ठेवा."
            }
        ]
    },
    "Wheat": {
        "dataset_source": "PlantVillage & PlantDoc Wheat Leaf Disease Corpus",
        "disease_classes": [
            {
                "id": "wheat_yellow_rust",
                "name_en": "Wheat Stripe / Yellow Rust",
                "name_hi": "गेहूं का पीला रतुआ (Yellow Rust)",
                "name_mr": "गव्हावरील पिवळा तांबेरा (Yellow Rust)",
                "scientific_name": "Puccinia striiformis",
                "symptoms": "Bright yellow powder/pustules arranged in linear stripes parallel to leaf veins.",
                "action_en": "Spray Tebuconazole 25.9% EC @ 1 ml/L or Propiconazole 25% EC @ 1 ml/L immediately upon first sighting.",
                "action_hi": "लक्षण दिखते ही टेबुकोनाज़ोल (25.9% EC) या प्रोपिकोनाज़ोल का छिड़काव करें।",
                "action_mr": "लक्षणे दिसताच टेब्युकोनाझोल २५.९% किंवा प्रोपिकोनाझोल १ मि.ली. प्रति लिटर फवारा."
            },
            {
                "id": "wheat_brown_rust",
                "name_en": "Wheat Leaf / Brown Rust",
                "name_hi": "गेहूं का भूरा रतुआ (Brown Rust)",
                "name_mr": "गव्हावरील तपकिरी तांबेरा (Brown Rust)",
                "scientific_name": "Puccinia triticina",
                "symptoms": "Small oval orange-brown pustules scattered randomly on upper leaf surface.",
                "action_en": "Apply Mancozeb 75% WP @ 2g/L or Propiconazole @ 1 ml/L.",
                "action_hi": "मैंकोज़ेब 75% WP या प्रोपिकोनाज़ोल का छिड़काव करें।",
                "action_mr": "मँकोझेब ७५% डब्ल्यूपी २ ग्रॅम/लिटर किंवा प्रोपिकोनाझोल फवारा."
            },
            {
                "id": "wheat_septoria",
                "name_en": "Wheat Septoria Leaf Blight",
                "name_hi": "गेहूं का सेप्टोरिया पत्ती झुलसा",
                "name_mr": "गव्हावरील सेप्टोरिया करपा",
                "scientific_name": "Zymoseptoria tritici",
                "symptoms": "Rectangular tan/brown lesions containing tiny black fungal fruiting bodies (pycnidia).",
                "action_en": "Spray Azoxystrobin + Tebuconazole fungicide combinations.",
                "action_hi": "एज़ोक्सीस्ट्रोबिन + टेबुकोनाज़ोल कवकनाशी का प्रयोग करें।",
                "action_mr": "ॲझॉक्सीस्ट्रॉबिन + टेब्युकोनाझोल बुरशीनाशकाची फवारणी करा."
            },
            {
                "id": "wheat_healthy",
                "name_en": "Healthy Wheat",
                "name_hi": "गेहूं स्वस्थ है",
                "name_mr": "गहू निरोगी आहे",
                "symptoms": "Clean green leaves without rust spots or necrosis.",
                "action_en": "Continue recommended nitrogen top-dressing and crown root irrigation.",
                "action_hi": "अनुशंसित नाइट्रोजन और समय पर सिंचाई जारी रखें।",
                "action_mr": "योग्य नत्र मात्रा आणि वेळेवर पाणी व्यवस्थापन ठेवा."
            }
        ]
    },
    "Tomato": {
        "dataset_source": "PlantVillage & PlantDoc Tomato Leaf Corpus (10 Classes)",
        "disease_classes": [
            {
                "id": "tomato_early_blight",
                "name_en": "Tomato Early Blight",
                "name_hi": "टमाटर का अगेती झुलसा (Early Blight)",
                "name_mr": "टोमॅटोवरील अगेती करपा (Early Blight)",
                "scientific_name": "Alternaria solani",
                "symptoms": "Concentric dark target-like rings on older leaves with yellow halo around spots.",
                "action_en": "Spray Chlorothalonil or Mancozeb @ 2g/L. Ensure good air circulation and avoid overhead watering.",
                "action_hi": "क्लोरोथैलोनिल या मैंकोज़ेब का छिड़काव करें। पत्तियों पर ऊपर से पानी न डालें।",
                "action_mr": "क्लोरोथॅलोनिल किंवा मँकोझेब २ ग्रॅम/लिटर फवारा. पानांवर पाणी साचू देऊ नका."
            },
            {
                "id": "tomato_late_blight",
                "name_en": "Tomato Late Blight",
                "name_hi": "टमाटर का पछेती झुलसा (Late Blight)",
                "name_mr": "टोमॅटोवरील पछेती करपा (Late Blight)",
                "scientific_name": "Phytophthora infestans",
                "symptoms": "Large water-soaked dark gray/brown greasy lesions with white cottony mold under leaf surface during wet weather.",
                "action_en": "Spray Metalaxyl + Mancozeb (Ridomil Gold) @ 2g/L or Dimethomorph immediately.",
                "action_hi": "रिडोमिल गोल्ड (मेटालैक्सिल + मैंकोज़ेब) 2 ग्राम/लीटर का तत्काल छिड़काव करें।",
                "action_mr": "रिडोमिल गोल्ड (मॅटॅलॅक्सिल + मँकोझेब) २ ग्रॅम/लिटर तातडीने फवारा."
            },
            {
                "id": "tomato_yellow_curl",
                "name_en": "Tomato Yellow Leaf Curl Virus (TYLCV)",
                "name_hi": "टमाटर पर्ण कुंचन रोग (Leaf Curl Virus)",
                "name_mr": "टोमॅटोचा चुराडा-मुराडा / पर्णगुच्छ रोग (Leaf Curl)",
                "scientific_name": "Tomato yellow leaf curl virus",
                "symptoms": "Upward cupping and yellowing of leaf margins, stunted plant growth.",
                "action_en": "Control Whiteflies vector using Thiamethoxam 25% WG @ 0.3g/L or Yellow Sticky Traps.",
                "action_hi": "सफेद मक्खी नियंत्रण के लिए थायामेथॉक्सम का छिड़काव करें और पीले चिपचिपे कार्ड लगाएं।",
                "action_mr": "पांढऱ्या माशीच्या नियंत्रणासाठी थायामेथॉक्सम आणि पिवळे चिकट सापळे वापरा."
            },
            {
                "id": "tomato_bacterial_spot",
                "name_en": "Tomato Bacterial Spot",
                "name_hi": "टमाटर का जीवाणु धब्बा रोग",
                "name_mr": "टोमॅटोवरील जिवाणूजन्य ठिपके",
                "scientific_name": "Xanthomonas perforans",
                "symptoms": "Small dark water-soaked spots that turn brown/black with yellow halos.",
                "action_en": "Spray Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 0.1g/L.",
                "action_hi": "कॉपर ऑक्सीक्लोराइड + स्ट्रेप्टोसाइक्लिन का छिड़काव करें।",
                "action_mr": "कॉपर ऑक्सिक्लोराइड २.५ ग्रॅम + स्ट्रेप्टोसायक्लिन ०.१ ग्रॅम प्रति लिटर फवारा."
            },
            {
                "id": "tomato_healthy",
                "name_en": "Healthy Tomato",
                "name_hi": "टमाटर का पौधा स्वस्थ है",
                "name_mr": "टोमॅटोचे रोप निरोगी आहे",
                "symptoms": "Vibrant green leaves, sturdy stem, no spotting.",
                "action_en": "Provide stakes for support and balanced drip fertigation.",
                "action_hi": "पौधों को सहारा (स्टेकिंग) दें और संतुलित सिंचाई करें।",
                "action_mr": "रोपांना काठीचा आधार द्या आणि संतुलित खत व्यवस्थापन करा."
            }
        ]
    },
    "Potato": {
        "dataset_source": "PlantVillage & PlantDoc Potato Leaf Corpus",
        "disease_classes": [
            {
                "id": "potato_early_blight",
                "name_en": "Potato Early Blight",
                "name_hi": "आलू का अगेती झुलसा",
                "name_mr": "बटाट्यावरील अगेती करपा",
                "scientific_name": "Alternaria solani",
                "symptoms": "Target-board concentric brown spots on bottom mature leaves.",
                "action_en": "Spray Mancozeb 75% WP @ 2g/L or Propineb @ 2g/L.",
                "action_hi": "मैंकोज़ेब 75% WP का छिड़काव करें।",
                "action_mr": "मँकोझेब ७५% डब्ल्यूपी २ ग्रॅम/लिटर फवारा."
            },
            {
                "id": "potato_late_blight",
                "name_en": "Potato Late Blight",
                "name_hi": "आलू का पछेती झुलसा (Late Blight)",
                "name_mr": "बटाट्यावरील पछेती करपा (Late Blight)",
                "scientific_name": "Phytophthora infestans",
                "symptoms": "Rapidly enlarging dark water-soaked leaf spots with white mold growth under humid weather.",
                "action_en": "Spray Cymoxanil + Mancozeb or Metalaxyl-M @ 2g/L immediately.",
                "action_hi": "साइमोक्सानिल + मैंकोज़ेब या मेटालैक्सिल का तत्काल छिड़काव करें।",
                "action_mr": "सायमोक्सॅनिल + मँकोझेब किंवा मॅटॅलॅक्सिल तातडीने फवारा."
            },
            {
                "id": "potato_healthy",
                "name_en": "Healthy Potato",
                "name_hi": "आलू का पौधा स्वस्थ है",
                "name_mr": "बटाटा पीक निरोगी आहे",
                "symptoms": "Dark green leaves without blight lesions.",
                "action_en": "Perform earthing up and regulate ridge soil moisture.",
                "action_hi": "मिट्टी चढ़ाएं और नमी बनाए रखें।",
                "action_mr": "मातीची भर द्या आणि योग्य ओलावा ठेवा."
            }
        ]
    },
    "Rice": {
        "dataset_source": "PlantVillage & PlantDoc Rice Disease Corpus",
        "disease_classes": [
            {
                "id": "rice_brown_spot",
                "name_en": "Rice Brown Spot",
                "name_hi": "धान का भूरा धब्बा रोग",
                "name_mr": "भातावरील तांबडे/तपकिरी ठिपके (Brown Spot)",
                "scientific_name": "Bipolaris oryzae",
                "symptoms": "Oval sesame-shaped brown spots with yellow margins scattered on leaves.",
                "action_en": "Apply Edifenphos or Tricyclazole 75% WP @ 0.6g/L. Correct potash deficiency.",
                "action_hi": "ट्राइसाइक्लाज़ोल या मैंकोज़ेब का छिड़काव करें। पोटाश की मात्रा बढ़ाएं।",
                "action_mr": "ट्रायसायक्लाझोल ०.६ ग्रॅम/लिटर फवारा. पोटॅश खताची मात्रा योग्य द्या."
            },
            {
                "id": "rice_blast",
                "name_en": "Rice Blast",
                "name_hi": "धान का ब्लास्ट/झोंका रोग",
                "name_mr": "भातावरील करपा / ब्लास्ट रोग (Rice Blast)",
                "scientific_name": "Magnaporthe oryzae",
                "symptoms": "Spindle/eye-shaped lesions with gray centers and reddish-brown borders.",
                "action_en": "Spray Isoprothiolane 40% EC @ 1.5 ml/L or Tricyclazole 75% WP @ 0.6g/L.",
                "action_hi": "आइसोप्रोथिओलेन या ट्राइसाइक्लाज़ोल का छिड़काव करें।",
                "action_mr": "आयसोप्रोथिओलेन १.५ मि.ली. किंवा ट्रायसायक्लाझोल ०.६ ग्रॅम/लिटर फवारा."
            },
            {
                "id": "rice_healthy",
                "name_en": "Healthy Rice",
                "name_hi": "धान की फसल स्वस्थ है",
                "name_mr": "भाताचे पीक निरोगी आहे",
                "symptoms": "Clean erect green foliage.",
                "action_en": "Maintain shallow water level and split nitrogen doses.",
                "action_hi": "खेत में उचित जल स्तर बनाए रखें।",
                "action_mr": "शेतात योग्य पाणी पातळी आणि वेळेवर खते द्या."
            }
        ]
    },
    "Cotton": {
        "dataset_source": "PlantVillage & PlantDoc Cotton Disease Corpus",
        "disease_classes": [
            {
                "id": "cotton_leaf_curl",
                "name_en": "Cotton Leaf Curl Virus (CLCuV)",
                "name_hi": "कपास का पर्ण कुंचन वायरस",
                "name_mr": "कापसाचा पानांचा चुरडा-मुरडा (Leaf Curl Virus)",
                "scientific_name": "Cotton leaf curl Geiminivirus",
                "symptoms": "Upward or downward curling of leaf margins with thick leaf veins.",
                "action_en": "Control Whiteflies using Diafenthiuron 50% WP @ 1.2g/L or Afidopyropen.",
                "action_hi": "सफेद मक्खी नियंत्रण के लिए डायफेंथियुरॉन का छिड़काव करें।",
                "action_mr": "पांढऱ्या माशीसाठी डायफेंथियुरॉन १.२ ग्रॅम/लिटर फवारा."
            },
            {
                "id": "cotton_bacterial_blight",
                "name_en": "Cotton Bacterial Blight / Angular Leaf Spot",
                "name_hi": "कपास का कोणीय पत्ती धब्बा रोग",
                "name_mr": "कापसावरील कोनीय जिवाणू करपा (Angular Leaf Spot)",
                "scientific_name": "Xanthomonas citri pv. malvacearum",
                "symptoms": "Angular water-soaked spots bounded by leaf veinlets turning dark brown/black.",
                "action_en": "Spray Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 0.1g/L.",
                "action_hi": "कॉपर ऑक्सीक्लोराइड और स्ट्रेप्टोसाइक्लिन का छिड़काव करें।",
                "action_mr": "कॉपर ऑक्सिक्लोराइड २.५ ग्रॅम + स्ट्रेप्टोसायक्लिन ०.१ ग्रॅम/लिटर फवारा."
            },
            {
                "id": "cotton_healthy",
                "name_en": "Healthy Cotton",
                "name_hi": "कपास की फसल स्वस्थ है",
                "name_mr": "कापसाचे पीक निरोगी आहे",
                "symptoms": "Broad green lobed leaves without vein yellowing or spots.",
                "action_en": "Maintain regular weeding and bollworm monitoring.",
                "action_hi": "नियमित निराई और कीट निगरानी बनाए रखें।",
                "action_mr": "वेळेवर निंदणी करा आणि बोंडअळीचे निरीक्षण ठेवा."
            }
        ]
    }
}


def get_crop_taxonomy_prompt_context(crop: Optional[str] = None) -> str:
    """Returns formatted PlantVillage/PlantDoc reference rules to inject into LLM Vision system prompt."""
    if not crop or crop not in PLANT_VILLAGE_PLANTDOC_TAXONOMY:
        crops_summary = []
        for c_name, c_data in PLANT_VILLAGE_PLANTDOC_TAXONOMY.items():
            diseases = [d["name_en"] for d in c_data["disease_classes"]]
            crops_summary.append(f"- {c_name}: {', '.join(diseases)}")
        return "PlantVillage & PlantDoc Verified Benchmark Categories:\n" + "\n".join(crops_summary)

    data = PLANT_VILLAGE_PLANTDOC_TAXONOMY[crop]
    lines = [f"PlantVillage & PlantDoc Verified Reference Dataset for {crop}:"]
    for d in data["disease_classes"]:
        sci_name = f" ({d['scientific_name']})" if d.get("scientific_name") else ""
        lines.append(f"  * Class: '{d['name_en']}'{sci_name}")
        lines.append(f"    Key Visual Symptoms: {d['symptoms']}")
    return "\n".join(lines)


def enrich_analysis_with_dataset(result: Dict, crop: Optional[str], language: str = "en") -> Dict:
    """Grounds the model output in PlantVillage & PlantDoc verified treatment recommendations if matched."""
    if not crop or crop not in PLANT_VILLAGE_PLANTDOC_TAXONOMY:
        return result

    disease_name = result.get("disease_name", "").lower()
    crop_data = PLANT_VILLAGE_PLANTDOC_TAXONOMY[crop]

    for d_cls in crop_data["disease_classes"]:
        match_keys = [d_cls["name_en"].lower(), d_cls["id"].lower()]
        if any(k in disease_name for k in match_keys) or (d_cls["id"] == f"{crop.lower()}_healthy" and "healthy" in disease_name):
            if language == "mr":
                result["recommended_action"] = d_cls["action_mr"]
                result["disease_name"] = d_cls["name_mr"]
            elif language == "hi":
                result["recommended_action"] = d_cls["action_hi"]
                result["disease_name"] = d_cls["name_hi"]
            else:
                result["recommended_action"] = d_cls["action_en"]
                result["disease_name"] = d_cls["name_en"]
            
            result["dataset_source"] = crop_data["dataset_source"]
            break

    return result
