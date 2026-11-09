import React, { useEffect, useState } from "react";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import ServiceDiscoveryMap, { INDIAN_STATE_HUBS } from "../components/ServiceDiscoveryMap.jsx";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Download,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  X,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronRight,
  FileText,
  Check,
  Plane,
  Scissors,
  FlaskConical,
  Compass,
  Droplets,
  Tractor,
  Snowflake,
  Truck,
  Layers,
  ArrowRight,
  CheckCircle,
  Phone,
  Star,
  Wallet,
  Lock,
  Upload,
  BadgeCheck,
  IndianRupee,
  Zap,
  Activity,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { notifier } from "../utils/notifications.js";

const STATUS_BADGE = {
  pending: "badge-moderate",
  confirmed: "badge-healthy",
  completed: "badge-healthy",
  cancelled: "badge-stressed",
};

const CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "drone", label: "🛸 Drone & Precision" },
  { id: "machinery", label: "🚜 Heavy Machinery" },
  { id: "soil", label: "🧪 Soil & Irrigation" },
  { id: "storage", label: "❄️ Storage & Logistics" },
];

export default function ServiceHub({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState([]);
  const [farms, setFarms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeService, setActiveService] = useState(null);

  // ── Regional Location & Proximity Map State ───────────────────────────
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("agritwin_selected_state");
      if (saved) {
        const found = INDIAN_STATE_HUBS.find((s) => s.id === saved || s.name === saved);
        if (found) return found;
      }
    } catch (e) {}
    return INDIAN_STATE_HUBS[0]; // Maharashtra default
  });
  const [nearbyOperators, setNearbyOperators] = useState([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // Drone Spray Specific State
  const [sprayMode, setSprayMode] = useState("spot"); // "spot" | "full"
  const [droneTask, setDroneTask] = useState(null);

  // Soil Test Specific State
  const [soilDepth, setSoilDepth] = useState("topsoil"); // "topsoil" | "profile"

  const [form, setForm] = useState({ farm_id: "", scheduled_date: "", area_acres: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");

  // ── Phase Pipeline State ────────────────────────────────────────────────
  const [activeBookingId, setActiveBookingId] = useState(null); // booking being dispatched
  const [dispatchResult, setDispatchResult] = useState(null);   // Phase 2 operator + escrow result
  const [dispatching, setDispatching] = useState(false);
  const [proofLogName, setProofLogName] = useState("flight_agras_T40.tlog");
  const [tlogFile, setTlogFile] = useState(null);               // real .tlog file object
  const [proofResult, setProofResult] = useState(null);         // Phase 4 settlement result
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState(null);
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [upiUtr, setUpiUtr] = useState("");
  const [expandedBooking, setExpandedBooking] = useState(null); // booking card expanded

  // ── Operator Self-Registration Modal State ─────────────────────────────
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeringOp, setRegisteringOp] = useState(false);
  const [operatorRegisteredMsg, setOperatorRegisteredMsg] = useState("");
  const [operatorForm, setOperatorForm] = useState({
    name: "",
    phone: "",
    equipment_type: "",
    category: "drone",
    base_location: "Khed, Pune Rural",
    operating_radius_km: 25,
    dgca_license: "",
  });

  const handleRegisterOperator = async (e) => {
    e.preventDefault();
    setRegisteringOp(true);
    try {
      const res = await api.registerOperator(operatorForm);
      setOperatorRegisteredMsg(`✓ Successfully registered ${res.name}! Active in dispatch registry.`);
      notifier.playChime("success");
      setTimeout(() => {
        setShowRegisterModal(false);
        setOperatorRegisteredMsg("");
        setOperatorForm({
          name: "",
          phone: "",
          equipment_type: "",
          category: "drone",
          base_location: "Khed, Pune Rural",
          operating_radius_km: 25,
          dgca_license: "",
        });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to register operator");
    } finally {
      setRegisteringOp(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (!dispatchResult?.escrow_amount || !activeBookingId) return;
    setPaying(true);
    try {
      const order = await api.createPaymentOrder({
        amount: dispatchResult.escrow_amount,
        booking_id: activeBookingId,
      });

      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: "INR",
          name: "FarmTwin Escrow Ledger",
          description: `UPI AutoPay Escrow: Booking #${activeBookingId.slice(0, 8)}`,
          image: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png",
          order_id: order.mode === "razorpay_live" ? order.order_id : undefined,
          handler: function (response) {
            const payId = response.razorpay_payment_id || `pay_test_${Math.random().toString(36).substring(2, 9)}`;
            setRazorpayPaymentId(payId);
            notifier.playChime("success");
          },
          prefill: {
            name: user?.name || "Aditya Dhumal",
            email: user?.email || "farmer@farmtwin.ai",
            contact: user?.phone || "+919823045120",
          },
          theme: {
            color: "#16a34a",
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (resp) {
          setError(resp.error.description || "Payment failed");
        });
        rzp.open();
      } else {
        const mockPayId = `pay_sim_${Math.random().toString(36).substring(2, 10)}`;
        setRazorpayPaymentId(mockPayId);
        notifier.playChime("success");
      }
    } catch (err) {
      setError(err.message || "Failed to initialize payment gateway");
    } finally {
      setPaying(false);
    }
  };

  // Proximity Service Radar Query
  useEffect(() => {
    if (!selectedLocation) return;
    setOperatorsLoading(true);
    api
      .getOperators({
        category: activeCategory !== "all" ? activeCategory : undefined,
        state: selectedLocation.name,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      })
      .then((data) => {
        setNearbyOperators(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setOperatorsLoading(false));

    if (selectedLocation?.id) {
      localStorage.setItem("agritwin_selected_state", selectedLocation.id);
    }
  }, [selectedLocation, activeCategory]);

  const handleSelectLocation = (loc) => {
    if (loc.id && String(loc.id).startsWith("farm_")) {
      const farmId = String(loc.id).replace("farm_", "");
      const f = farms.find((farm) => String(farm.id) === farmId);
      if (f) {
        setSelectedLocation({
          id: `farm_${f.id}`,
          name: f.farm_name,
          state: f.state || "Maharashtra",
          region: `${f.crop || "Farm"} · ${f.district || f.location || "Field"}`,
          lat: f.centroid?.lat || 17.6521,
          lng: f.centroid?.lon || 74.1133,
          zoom: 12,
        });
        setForm((prev) => ({ ...prev, farm_id: f.id }));
        return;
      }
    }
    setSelectedLocation(loc);
  };

  const handleBookOperator = (op) => {
    let targetServiceId = "spray";
    if (op.category === "drone") targetServiceId = "spray";
    else if (op.category === "machinery") targetServiceId = "crop_cutting";
    else if (op.category === "soil") targetServiceId = "soil_test";
    else if (op.category === "storage") targetServiceId = "cold_storage";

    const service = catalog.find((s) => s.id === targetServiceId) || catalog[0];
    if (service) {
      openBooking(service);
      setForm((prev) => ({
        ...prev,
        notes: `[Dispatched via Service Radar: ${op.name} (${op.distance_km != null ? op.distance_km.toFixed(1) + "km" : "Nearby"})]`,
      }));
    }
  };

  const refreshBookings = () => {
    if (!user?.id) return;
    api.listBookings(user.id).then(setBookings).catch(() => {});
  };

  useEffect(() => {
    api
      .getServiceCatalog()
      .then((data) => {
        setCatalog(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    if (user?.id) {
      api.listFarms(user.id).then((f) => {
        setFarms(f || []);
        if (f && f.length > 0) {
          setForm((prev) => ({
            ...prev,
            farm_id: f[0].id,
            area_acres: f[0].area_acres || 2.5,
          }));
        }
      });
      refreshBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (activeService?.id === "spray") {
      const selectedFarm = farms.find((f) => f.id === form.farm_id);
      const totalAcres = Number(form.area_acres) || selectedFarm?.area_acres || 2.5;
      api
        .getDroneTask({ farmId: form.farm_id, mode: sprayMode, totalAcres })
        .then(setDroneTask)
        .catch(() => {});
    }
  }, [activeService, form.farm_id, form.area_acres, sprayMode, farms]);

  const openBooking = (service) => {
    setActiveService(service);
    setError("");
    setBookingSuccessMsg("");
    if (service.id === "spray") {
      setSprayMode("spot");
    }
  };

  const handleDownloadKml = () => {
    if (!droneTask?.kml_content) return;
    const blob = new Blob([droneTask.kml_content], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Drone_FlightPath_${(droneTask.farm_name || "Farm").replace(/ /g, "_")}_${sprayMode.toUpperCase()}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifier.playChime("info");
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!form.scheduled_date) {
      setError("Please select a scheduled service date.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      let finalNotes = form.notes || "";
      if (activeService.id === "spray") {
        const modeLabel =
          sprayMode === "spot" ? "Precision Spot Spraying (Stressed Zones)" : "Complete Farm Spraying (100% Full Field)";
        const savingsInfo = sprayMode === "spot" ? ` | Chemical Savings: ${droneTask?.chemical_savings_pct || 60}%` : "";
        finalNotes = `[Strategy: ${modeLabel}${savingsInfo}] ${finalNotes}`;
      } else if (activeService.id === "soil_test") {
        finalNotes = `[Sample Depth: ${soilDepth === "topsoil" ? "0–15cm Topsoil" : "0–30cm Dual Profile"}] ${finalNotes}`;
      }

      const treatedAcres =
        activeService.id === "spray" && sprayMode === "spot"
          ? droneTask?.treated_acres || Number(form.area_acres) * 0.4
          : Number(form.area_acres) || null;

      const newBooking = await api.createBooking({
        user_id: user?.id,
        farm_id: form.farm_id || null,
        service_type: activeService.id,
        scheduled_date: form.scheduled_date,
        area_acres: treatedAcres,
        notes: finalNotes || null,
      });

      notifier.playChime("success");
      setBookingSuccessMsg(`✓ Booking confirmed! Now dispatching nearest operator...`);
      setActiveService(null);
      setActiveBookingId(newBooking.id);
      setDispatchResult(null);
      setProofResult(null);
      setTlogFile(null);
      setRazorpayPaymentId(null);

      // Auto-trigger Phase 2 dispatch
      setTimeout(async () => {
        setDispatching(true);
        try {
          const result = await api.dispatchOperator(newBooking.id);
          setDispatchResult(result);
          notifier.playChime("info");
        } catch (err) {
          // dispatch failed silently — user can retry
        } finally {
          setDispatching(false);
          refreshBookings();
        }
      }, 800);

      setTimeout(() => {
        setForm({
          farm_id: farms[0]?.id || "",
          scheduled_date: "",
          area_acres: farms[0]?.area_acres || 2.5,
          notes: "",
        });
        setBookingSuccessMsg("");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to confirm service booking.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter catalog
  const filteredCatalog = catalog.filter((item) => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  const getServiceIcon = (id) => {
    switch (id) {
      case "spray":
        return <Plane className="w-6 h-6 text-emerald-700" />;
      case "crop_cutting":
        return <Scissors className="w-6 h-6 text-amber-700" />;
      case "soil_test":
        return <FlaskConical className="w-6 h-6 text-sky-700" />;
      case "laser_leveling":
        return <Compass className="w-6 h-6 text-indigo-700" />;
      case "drip_maintenance":
        return <Droplets className="w-6 h-6 text-teal-700" />;
      case "deep_tillage":
        return <Tractor className="w-6 h-6 text-orange-700" />;
      case "cold_storage":
        return <Snowflake className="w-6 h-6 text-blue-700" />;
      case "reefer_logistics":
        return <Truck className="w-6 h-6 text-emerald-800" />;
      default:
        return <Sliders className="w-6 h-6 text-slate-700" />;
    }
  };

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("services.title", "Farm Service Hub & Mechanization Center")}
      subtitle={t(
        "services.subtitle",
        "Book certified precision spray drones, heavy machinery, soil lab diagnostics & cold-chain logistics."
      )}
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Top Header Hero Card */}
        <div
          className="p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow)",
            border: "1px solid rgba(255, 255, 255, 0.7)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                boxShadow: "var(--clay-card-shadow-sm)",
              }}
            >
              <Tractor className="w-7 h-7 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Farm Service Hub & Precision Mechanization
                </h2>
                <span className="badge badge-healthy text-[10px] py-0.5 px-2.5 font-black uppercase">
                  ● OPERATORS ON STANDBY
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1 max-w-xl leading-relaxed">
                On-demand verified agricultural services covering precision drone spraying, combine harvesting, certified soil testing & cold-chain warehousing with transparent per-acre pricing.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-end md:self-auto">
            <div
              className="p-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-700"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-inset-sm)",
              }}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Doorstep Dispatch within 24h</span>
            </div>
            <div
              className="p-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800"
              style={{
                background: "rgba(45, 122, 79, 0.08)",
                boxShadow: "var(--clay-inset-sm)",
              }}
            >
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>0% Extra Brokerage</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="btn-primary p-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Tractor className="w-4 h-4" />
              <span>Join as CHC / Pilot</span>
            </button>
          </div>
        </div>

        {/* Interactive State Service Discovery Map & Proximity Radar */}
        <ServiceDiscoveryMap
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          operators={nearbyOperators}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onBookOperator={handleBookOperator}
          farms={farms}
        />

        {/* Nearby Active Operators Rapid Dispatch Tray */}
        <div
          className="p-6 rounded-3xl mb-4"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow-sm)",
            border: "1px solid rgba(255, 255, 255, 0.7)",
          }}
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>⚡ Verified Local Operators in {selectedLocation?.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                    {nearbyOperators.length} Active Hubs
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                Real-time GPS proximity matching for {selectedLocation?.region || selectedLocation?.name}. Instant 1-click booking and dispatch.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live 24H Dispatch Standby
            </div>
          </div>

          {operatorsLoading ? (
            <div className="flex items-center justify-center p-8 text-slate-500 font-bold text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" /> Scanning regional operator network...
            </div>
          ) : nearbyOperators.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/70 text-center text-xs font-bold text-slate-600 border border-slate-200">
              No verified operators in this specific filter for {selectedLocation?.name}. Try selecting "All Services" or register as an operator!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyOperators.slice(0, 6).map((op) => (
                <div
                  key={op.id}
                  className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {op.category === "drone" ? "🛸 Drone Hub" : op.category === "machinery" ? "🚜 Machinery CHC" : op.category === "soil" ? "🧪 Soil Lab" : "❄️ Logistics"}
                      </span>
                      <span className="text-xs font-black text-emerald-700 font-mono">
                        {op.distance_km != null ? `${op.distance_km.toFixed(1)} km away` : "Nearby"}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{op.name}</h4>
                    <p className="text-[11px] text-slate-500 font-bold mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {op.base_location}
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 font-bold mb-3">
                      <div>🛠️ {op.equipment_type}</div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{op.dgca_license || "Verified Partner"}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-600">⭐ {op.rating ? op.rating.toFixed(1) : "4.9"} ({op.completed_jobs} jobs)</span>
                    <button
                      type="button"
                      onClick={() => handleBookOperator(op)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <span>⚡ Dispatch</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter Pills (Clay Inset Tray) */}
        <div
          className="p-1.5 rounded-2xl flex flex-wrap gap-2"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-inset)",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial justify-center ${
                activeCategory === cat.id ? "text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              }`}
              style={
                activeCategory === cat.id
                  ? {
                      background: "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))",
                      boxShadow: "var(--clay-card-shadow-sm)",
                    }
                  : {}
              }
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-2 py-0.2 rounded-full font-black ${
                  activeCategory === cat.id ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {cat.id === "all" ? catalog.length : catalog.filter((c) => c.category === cat.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Service Cards Grid (Clay Bento Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCatalog.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl flex flex-col justify-between space-y-4 transition-all"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-card-shadow)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
              }}
            >
              <div>
                {/* Header: Icon + Category + Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "var(--clay-surface)",
                      boxShadow: "var(--clay-card-shadow-sm)",
                    }}
                  >
                    {getServiceIcon(service.id)}
                  </div>

                  <span className="badge badge-healthy text-[10px] font-black uppercase">
                    {service.badge || service.category_label}
                  </span>
                </div>

                {/* Service Name & Description */}
                <h3 className="text-base font-black text-slate-900 mt-3">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-600 font-semibold mt-1 leading-relaxed">
                  {service.description}
                </p>

                {/* Highlights List */}
                {service.highlights && service.highlights.length > 0 && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200/70">
                    {service.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom: Price + ETA + Book Button */}
              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black text-slate-900">
                      ₹{service.price_per_acre}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ml-1">
                      {service.unit_label || "/ acre"}
                    </span>
                  </div>

                  <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {service.eta || "Within 24 Hours"}
                  </span>
                </div>

                <button
                  onClick={() => openBooking(service)}
                  className="btn-primary w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE BOOKING MODAL DIALOG                          */}
        {/* ========================================================= */}
        <AnimatePresence>
          {activeService && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg p-6 md:p-8 rounded-3xl space-y-5 max-h-[90vh] overflow-y-auto"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow-lg)",
                  border: "1px solid rgba(255, 255, 255, 0.9)",
                }}
              >
                {/* Modal Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-card-shadow-sm)",
                      }}
                    >
                      {getServiceIcon(activeService.id)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                        Service Reservation
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">
                        Book {activeService.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-bold">
                        ₹{activeService.price_per_acre} {activeService.unit_label || "/ acre"} &middot; {activeService.eta}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveService(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Success Message inside modal */}
                {bookingSuccessMsg && (
                  <div
                    className="p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900"
                    style={{
                      background: "rgba(45, 122, 79, 0.12)",
                      border: "1px solid rgba(45, 122, 79, 0.3)",
                      boxShadow: "var(--clay-inset-sm)",
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>{bookingSuccessMsg}</span>
                  </div>
                )}

                {error && (
                  <div
                    className="p-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-900"
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      boxShadow: "var(--clay-inset-sm)",
                    }}
                  >
                    <X className="w-4 h-4 text-red-700 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={submitBooking} className="space-y-4">
                  {/* Farm Selection */}
                  {farms.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Select Farm Field *
                      </label>
                      <select
                        value={form.farm_id}
                        onChange={(e) => {
                          const farmId = e.target.value;
                          const selectedFarm = farms.find((f) => f.id === farmId);
                          setForm({
                            ...form,
                            farm_id: farmId,
                            area_acres: selectedFarm?.area_acres || form.area_acres,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        style={{
                          background: "var(--clay-surface)",
                          boxShadow: "var(--clay-inset-sm)",
                          border: "1px solid rgba(255, 255, 255, 0.6)",
                        }}
                      >
                        {farms.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.farm_name} ({f.crop || "Crop"} &middot; {f.area_acres || 2.5} acres)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* SPECIALIZED MODULE: DRONE SPRAY SPOT vs FULL STRATEGY */}
                  {activeService.id === "spray" && (
                    <div
                      className="p-4 rounded-2xl space-y-3"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                        <Target className="w-4 h-4 text-emerald-700" />
                        <span>Drone Targeting Strategy & Chemical Optimization</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div
                          onClick={() => setSprayMode("spot")}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${
                            sprayMode === "spot" ? "border-2 border-emerald-600" : "border border-slate-300"
                          }`}
                          style={{
                            background: sprayMode === "spot" ? "rgba(45, 122, 79, 0.08)" : "#ffffff",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-emerald-900">🎯 Spot Spraying</span>
                            <span className="text-[9px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                              RECOMMENDED
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-semibold mt-1">
                            Targets AI NDVI stressed vegetation zones only. Saves 50%–60% chemicals.
                          </p>
                        </div>

                        <div
                          onClick={() => setSprayMode("full")}
                          className={`p-3 rounded-xl cursor-pointer transition-all ${
                            sprayMode === "full" ? "border-2 border-slate-800" : "border border-slate-300"
                          }`}
                          style={{
                            background: sprayMode === "full" ? "rgba(15, 23, 42, 0.05)" : "#ffffff",
                          }}
                        >
                          <span className="text-xs font-black text-slate-900">🚜 Full Coverage</span>
                          <p className="text-[11px] text-slate-600 font-semibold mt-1">
                            100% uniform blanket spraying across entire farm perimeter.
                          </p>
                        </div>
                      </div>

                      {/* Flight Path Summary & KML Download */}
                      {droneTask && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-2 mt-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-bold">Targeted Spray Area:</span>
                            <span className="font-black text-slate-900">
                              {droneTask.treated_acres} Acres{" "}
                              <span className="text-[10px] text-slate-400">
                                (of {droneTask.total_acres} acres)
                              </span>
                            </span>
                          </div>

                          {sprayMode === "spot" && (
                            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                              <span>⚡ Chemical Savings: {droneTask.chemical_savings_pct}%</span>
                              <span>₹{droneTask.savings_inr} Saved</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleDownloadKml}
                            className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-sky-700 hover:bg-sky-600 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Drone Flight Path (KML / GeoJSON)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SPECIALIZED MODULE: SOIL TEST SAMPLING DEPTH */}
                  {activeService.id === "soil_test" && (
                    <div
                      className="p-3.5 rounded-2xl space-y-2"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                      }}
                    >
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Lab Sampling Core Depth
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setSoilDepth("topsoil")}
                          className={`p-2.5 rounded-xl font-bold cursor-pointer transition-all ${
                            soilDepth === "topsoil"
                              ? "btn-primary text-white"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          🌱 0–15 cm Topsoil (Standard)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSoilDepth("profile")}
                          className={`p-2.5 rounded-xl font-bold cursor-pointer transition-all ${
                            soilDepth === "profile"
                              ? "btn-primary text-white"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          🧪 0–30 cm Dual Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Date & Area Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        Scheduled Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={form.scheduled_date}
                        onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        style={{
                          background: "var(--clay-surface)",
                          boxShadow: "var(--clay-inset-sm)",
                          border: "1px solid rgba(255, 255, 255, 0.6)",
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                        {activeService.id === "cold_storage" ? "Quantity (Quintals)" : "Area (Acres) *"}
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={form.area_acres}
                        onChange={(e) => setForm({ ...form, area_acres: e.target.value })}
                        placeholder="e.g. 2.5"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        style={{
                          background: "var(--clay-surface)",
                          boxShadow: "var(--clay-inset-sm)",
                          border: "1px solid rgba(255, 255, 255, 0.6)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Estimated Price Total Chip */}
                  <div
                    className="p-3 rounded-2xl flex items-center justify-between text-xs"
                    style={{
                      background: "rgba(45, 122, 79, 0.08)",
                      boxShadow: "var(--clay-inset-sm)",
                    }}
                  >
                    <span className="font-bold text-slate-700">Estimated Total Cost:</span>
                    <span className="text-base font-black text-emerald-800">
                      ₹
                      {Math.round(
                        (Number(form.area_acres) || 1) * (activeService.price_per_acre || 350)
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Notes & Special Requests */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Special Field Notes & Operator Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. Electric lines on the south boundary, prefer morning dispatch before 10 AM..."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary flex-1 py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Confirming Booking...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Confirm & Dispatch Operator
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveService(null)}
                      className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-card-shadow-sm)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* OPERATOR / CHC ONBOARDING REGISTRATION MODAL               */}
        {/* ========================================================= */}
        <AnimatePresence>
          {showRegisterModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg p-6 md:p-8 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow-lg)",
                  border: "1px solid rgba(255, 255, 255, 0.9)",
                }}
              >
                <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                      <Tractor className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Partner with FarmTwin</h3>
                      <p className="text-xs text-slate-500 font-bold">Register as a Drone Pilot, CHC Center or Machinery Owner</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRegisterModal(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {operatorRegisteredMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{operatorRegisteredMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterOperator} className="space-y-3 text-xs">
                  <div>
                    <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                      Full Name / CHC Center Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kisan Drone Fleet / Ramesh Shinde"
                      value={operatorForm.name}
                      onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                        Mobile WhatsApp Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98230 45120"
                        value={operatorForm.phone}
                        onChange={(e) => setOperatorForm({ ...operatorForm, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                        Equipment Category *
                      </label>
                      <select
                        value={operatorForm.category}
                        onChange={(e) => setOperatorForm({ ...operatorForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                      >
                        <option value="drone">🛸 Drone & Precision</option>
                        <option value="machinery">🚜 Heavy Machinery</option>
                        <option value="soil">🧪 Soil & Irrigation</option>
                        <option value="storage">❄️ Cold-Chain Storage</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                      Equipment Model & Specifications *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DJI Agras T40 40L Dual-Nozzle / John Deere 5050D Harvester"
                      value={operatorForm.equipment_type}
                      onChange={(e) => setOperatorForm({ ...operatorForm, equipment_type: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                        Base Location / Village *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Khed, Pune Rural"
                        value={operatorForm.base_location}
                        onChange={(e) => setOperatorForm({ ...operatorForm, base_location: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                        Operating Radius (km)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={operatorForm.operating_radius_km}
                        onChange={(e) => setOperatorForm({ ...operatorForm, operating_radius_km: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-600 uppercase text-[10px] block mb-1">
                      DGCA License / SMAM CHC Registration ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DGCA-RPC-2025-MH-9102 / CHC-SMAM-PUN-019"
                      value={operatorForm.dgca_license}
                      onChange={(e) => setOperatorForm({ ...operatorForm, dgca_license: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl font-bold bg-white border border-slate-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={registeringOp}
                      className="btn-primary flex-1 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {registeringOp ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Registering Machinery...</>
                      ) : (
                        <><Check className="w-4 h-4" /> Complete Registration</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(false)}
                      className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* PHASE PIPELINE: OPERATOR DISPATCH + ESCROW + PROOF        */}
        {/* ========================================================= */}
        <AnimatePresence>
          {(activeBookingId || bookingSuccessMsg) && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="p-6 md:p-8 rounded-3xl space-y-5"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-card-shadow)",
                border: "2px solid rgba(45, 122, 79, 0.25)",
              }}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", boxShadow: "var(--clay-card-shadow-sm)" }}
                  >
                    <Activity className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Real-Time Dispatch Pipeline</h3>
                    <p className="text-xs text-slate-500 font-semibold">Uber-style operator matching &middot; Escrow &middot; Proof of Work</p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveBookingId(null); setDispatchResult(null); setProofResult(null); setBookingSuccessMsg(""); }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Phase Progress Bar */}
              <div className="flex items-center gap-0 overflow-x-auto pb-1">
                {[
                  { label: "Booking Created", done: !!activeBookingId },
                  { label: "Operator Dispatched", done: !!dispatchResult },
                  { label: "Escrow Held", done: !!dispatchResult },
                  { label: "Proof & Settlement", done: !!proofResult },
                ].map((step, i) => (
                  <React.Fragment key={i}>
                    <div className={`flex flex-col items-center min-w-[78px] ${step.done ? "opacity-100" : "opacity-40"}`}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                        style={step.done ? { background: "linear-gradient(135deg,#16a34a,#059669)", color: "#fff" } : { background: "#e2e8f0", color: "#64748b" }}
                      >
                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-600 mt-1 text-center leading-tight w-16">{step.label}</span>
                    </div>
                    {i < 3 && (
                      <div className={`flex-1 h-0.5 mx-1 rounded-full ${(i < 2 && dispatchResult) || (i === 2 && proofResult) ? "bg-emerald-500" : "bg-slate-200"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Phase 1 banner */}
              {bookingSuccessMsg && (
                <div className="p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900"
                  style={{ background: "rgba(45,122,79,0.1)", border: "1px solid rgba(45,122,79,0.3)" }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{bookingSuccessMsg}</span>
                </div>
              )}

              {/* Phase 2 dispatching loader */}
              {dispatching && (
                <div className="p-4 rounded-2xl flex items-center gap-3"
                  style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-inset-sm)" }}>
                  <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin flex-shrink-0" />
                  <div>
                    <div className="text-sm font-black text-slate-900">Finding nearest verified operator...</div>
                    <div className="text-xs text-slate-500 font-semibold mt-0.5">Scanning 15km radius &middot; Matching equipment &middot; Checking availability</div>
                  </div>
                </div>
              )}

              {/* Phase 2 + 3 + 4 Results */}
              {dispatchResult && !dispatching && (
                <div className="space-y-4">

                  {/* Operator Card */}
                  <div className="p-4 rounded-2xl space-y-3"
                    style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-inset-sm)", border: "1px solid rgba(255,255,255,0.7)" }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Phase 2 &middot; Operator Dispatched
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dispatchResult.sms_sent ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-sky-100 text-sky-800 border border-sky-300"}`}>
                          📱 {dispatchResult.sms_sent ? "SMS Sent (Textbelt)" : "SMS Gateway Ready"}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          💬 {dispatchResult.whatsapp_mode === "twilio" ? "Twilio Auto-Sent" : "WhatsApp Linked"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", boxShadow: "var(--clay-card-shadow-sm)" }}>
                        {(dispatchResult.service_category === "machinery" || (dispatchResult.operator?.equipment_type || "").toLowerCase().includes("harvester") || (dispatchResult.operator?.equipment_type || "").toLowerCase().includes("tractor"))
                          ? "🚜"
                          : dispatchResult.service_category === "soil"
                          ? "🧪"
                          : dispatchResult.service_category === "storage"
                          ? "❄️"
                          : "🚁"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900">{dispatchResult.operator?.name}</h4>
                          <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-black">VERIFIED ✓</span>
                        </div>
                        <p className="text-xs text-slate-600 font-bold mt-0.5 truncate">{dispatchResult.operator?.equipment_type}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                          <span className="font-extrabold text-amber-700 flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {dispatchResult.operator?.rating}
                          </span>
                          <span className="font-bold text-slate-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {dispatchResult.operator?.distance_km?.toFixed(1)} km away
                          </span>
                          <span className="font-bold text-slate-500">{dispatchResult.operator?.completed_jobs} jobs done</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">DGCA/CHC: {dispatchResult.operator?.dgca_license}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1 flex-wrap sm:flex-nowrap">
                      <a
                        href={dispatchResult.dispatch_whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
                        style={{ background: "#25D366" }}
                      >
                        <Phone className="w-3.5 h-3.5" /> Open WhatsApp Dispatch
                      </a>
                      <a
                        href={`tel:${dispatchResult.operator?.phone}`}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                        style={{ background: "var(--clay-surface)", boxShadow: "var(--clay-card-shadow-sm)" }}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> Call {dispatchResult.operator?.phone}
                      </a>
                    </div>
                  </div>

                  {/* Escrow Panel */}
                  <div className="p-4 rounded-2xl space-y-3"
                    style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))", boxShadow: "var(--clay-inset-sm)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-700" /> Phase 3 &middot; UPI Escrow Hold
                      </div>
                      {razorpayPaymentId || upiUtr ? (
                        <span className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ESCROW SECURED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-[10px] font-black text-indigo-900 bg-indigo-100/70 border border-indigo-300">
                          PENDING PAYMENT HOLD
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-2xl font-black text-slate-900">&#8377;{dispatchResult.escrow_amount?.toLocaleString("en-IN")}</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">
                          {razorpayPaymentId || upiUtr ? `Secured (Ref: ${razorpayPaymentId || upiUtr})` : "Will be held in escrow until proof of work verification"}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setShowUpiQr(!showUpiQr)}
                          disabled={Boolean(razorpayPaymentId || upiUtr)}
                          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                            razorpayPaymentId || upiUtr
                              ? "bg-slate-200 text-slate-400 cursor-default"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Direct UPI QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRazorpayCheckout}
                          disabled={paying || Boolean(razorpayPaymentId || upiUtr)}
                          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                            razorpayPaymentId || upiUtr
                              ? "bg-emerald-700 text-white opacity-90 cursor-default"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {paying ? "Opening..." : "Razorpay / Cards"}
                        </button>
                      </div>
                    </div>

                    {/* Instant Real-World UPI Direct QR (Zero KYC, Any Indian Phone) */}
                    {showUpiQr && !razorpayPaymentId && !upiUtr && (
                      <div className="p-4 rounded-xl bg-white border border-indigo-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">Scan with Any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">ZERO KYC REQUIRED</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`upi://pay?pa=farmtwin.escrow@icici&pn=FarmTwin%20Escrow&am=${dispatchResult.escrow_amount}&cu=INR&tn=Booking_${activeBookingId?.slice(0, 8)}`)}`}
                            alt="UPI QR Code"
                            className="w-32 h-32 rounded-xl border border-slate-200 p-1 shadow-xs"
                          />
                          <div className="flex-1 space-y-2 text-xs">
                            <div className="text-slate-600 font-semibold">
                              Merchant VPA: <span className="font-mono font-bold text-slate-900">farmtwin.escrow@icici</span>
                            </div>
                            <a
                              href={`upi://pay?pa=farmtwin.escrow@icici&pn=FarmTwin%20Escrow&am=${dispatchResult.escrow_amount}&cu=INR&tn=Booking_${activeBookingId?.slice(0, 8)}`}
                              className="inline-block py-1.5 px-3 bg-emerald-600 text-white rounded-lg font-black text-[11px]"
                            >
                              Tap to Open UPI App on Mobile
                            </a>
                            <div className="pt-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter 12-digit UPI UTR Ref No."
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                                id="manual-utr-input"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = document.getElementById("manual-utr-input")?.value || `UTR${Date.now()}`;
                                  setUpiUtr(val);
                                  setShowUpiQr(false);
                                  notifier.playChime("success");
                                }}
                                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Confirm UTR
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.7)" }}>
                        <div className="font-black text-emerald-800">&#8377;{(dispatchResult.escrow_amount * 0.9)?.toFixed(0)}</div>
                        <div className="text-slate-500 font-bold text-[10px] mt-0.5">Operator Payout (90%)</div>
                      </div>
                      <div className="p-2.5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.7)" }}>
                        <div className="font-black text-slate-700">&#8377;{(dispatchResult.escrow_amount * 0.1)?.toFixed(0)}</div>
                        <div className="text-slate-500 font-bold text-[10px] mt-0.5">FarmTwin Fee (10%)</div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 4: Dynamic Service-Aware Proof Upload or Settlement */}
                  {(() => {
                    const activeBookingObj = bookings.find((b) => b.id === activeBookingId) || {};
                    const sType = (activeBookingObj.service_type || dispatchResult?.service_type || activeService?.id || "").toLowerCase();
                    const sCat = (dispatchResult?.service_category || "").toLowerCase();

                    // Prioritize exact service_type / service_category first!
                    const isDrone = sCat === "drone" || sType === "spray" || sType.includes("drone") || sType.includes("spray");
                    const isSoil = !isDrone && (
                      sCat === "soil" ||
                      sType.includes("soil") ||
                      sType.includes("drip") ||
                      sType.includes("flush") ||
                      sType.includes("irrigation")
                    );
                    const isMachinery = !isDrone && !isSoil && (
                      sCat === "machinery" ||
                      sType.includes("crop_cutting") ||
                      sType.includes("harvester") ||
                      sType.includes("tillage") ||
                      sType.includes("leveling") ||
                      sType.includes("tractor")
                    );

                    const defaultDemoName = isSoil
                      ? "drip_flush_audit_passed.pdf"
                      : isMachinery
                      ? "harvester_telematics_log.json"
                      : "flight_agras_T40.tlog";

                    return !proofResult ? (
                      <div
                        className="p-4 rounded-2xl space-y-3"
                        style={{
                          background: "var(--clay-surface)",
                          boxShadow: "var(--clay-inset-sm)",
                          border: "1px solid rgba(255,255,255,0.7)",
                        }}
                      >
                        <div className="text-[11px] font-black text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-orange-700" />
                          {isSoil
                            ? "Phase 4 · Field Diagnostic & Flush Completion Audit"
                            : isMachinery
                            ? "Phase 4 · Machinery Acreage & GPS Telematics Verification"
                            : "Phase 4 · Drone Flight Telemetry Audit (.tlog / .bin)"}
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {isSoil
                            ? "Verify on-site execution: 14-nutrient spectrometer lab test report or emitter pressure test & flush sign-off. Releases the escrow payout to the operator."
                            : isMachinery
                            ? "Verify tractor / combine harvester GPS area boundary coverage and engine telemetry. Confirms worked acreage and releases escrow payout."
                            : "Upload the DJI / Pixhawk flight log (.tlog, .bin) from the drone. FarmTwin parses real MAVLink GPS packets, audits field coverage, and releases the escrow payout."}
                        </p>

                        {/* Sample File Downloader for Drones */}
                        {isDrone && (
                          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                            <span className="text-slate-600 font-semibold">Want to test with genuine flight data?</span>
                            <a
                              href={api.getSampleTlogUrl()}
                              download="DJI_Agras_T40_FarmTwin_Mission.tlog"
                              className="font-black text-sky-800 hover:text-sky-950 underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Sample .tlog (120 Waypoints)
                            </a>
                          </div>
                        )}

                        <div className="space-y-2">
                          {/* File Selector */}
                          <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer">
                              <Upload className="w-4 h-4 text-emerald-600" />
                              <span className="truncate">
                                {tlogFile
                                  ? tlogFile.name
                                  : isSoil
                                  ? "Select Soil Test Report / Flush Photo (optional)"
                                  : isMachinery
                                  ? "Select Machinery Telematics Log (optional)"
                                  : "Select MAVLink .tlog / .bin file (optional)"}
                              </span>
                              <input
                                type="file"
                                accept={isSoil ? ".pdf,.png,.jpg,.jpeg,.json" : isMachinery ? ".json,.csv,.bin,.log" : ".tlog,.bin,.log,.json"}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setTlogFile(e.target.files[0]);
                                    setProofLogName(e.target.files[0].name);
                                  }
                                }}
                              />
                            </label>
                            {tlogFile && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTlogFile(null);
                                  setProofLogName(defaultDemoName);
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 text-xs font-bold cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Or filename demo */}
                          {!tlogFile && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={proofLogName || defaultDemoName}
                                onChange={(e) => setProofLogName(e.target.value)}
                                placeholder={defaultDemoName}
                                className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                                style={{
                                  background: "var(--clay-surface)",
                                  boxShadow: "var(--clay-inset-sm)",
                                  border: "1px solid rgba(255,255,255,0.6)",
                                }}
                              />
                              <span className="text-[10px] text-slate-400 font-bold self-center">Verification File</span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            if (!activeBookingId) return;
                            setVerifying(true);
                            try {
                              const payload = tlogFile
                                ? { file: tlogFile, log_name: tlogFile.name }
                                : { log_name: proofLogName || defaultDemoName, coverage_pct: 100.0 };
                              const result = await api.uploadProof(activeBookingId, payload);
                              setProofResult(result);
                              notifier.playChime("success");
                              refreshBookings();
                            } catch (err) {
                              setError(err.message || "Failed to process service verification");
                            } finally {
                              setVerifying(false);
                            }
                          }}
                          disabled={verifying}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95"
                          style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)" }}
                        >
                          {verifying ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />{" "}
                              {isSoil
                                ? "Auditing Diagnostic Completion..."
                                : isMachinery
                                ? "Auditing Machinery Acreage..."
                                : "Auditing MAVLink Telemetry..."}
                            </>
                          ) : (
                            <>
                              <BadgeCheck className="w-3.5 h-3.5" />{" "}
                              {isSoil
                                ? "Verify Diagnostic Completion & Release Escrow"
                                : isMachinery
                                ? "Verify Worked Acreage & Release Escrow"
                                : "Parse Telemetry & Release Escrow"}
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 rounded-2xl space-y-4"
                        style={{
                          background: "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.08))",
                          border: "2px solid rgba(16,185,129,0.3)",
                        }}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Phase 4 &middot; Escrow Released &middot; Service Complete
                          </div>
                          <span className="text-[10px] bg-emerald-700 text-white font-black px-2.5 py-0.5 rounded-full">
                            100% SETTLED
                          </span>
                        </div>

                        {/* Financial Settlement */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.85)" }}>
                            <div className="text-xl font-black text-emerald-800">
                              &#8377;{proofResult.payout_to_operator?.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">Paid to Operator (90%)</div>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.85)" }}>
                            <div className="text-xl font-black text-slate-700">
                              &#8377;{proofResult.platform_commission?.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 mt-0.5">FarmTwin Platform Fee (10%)</div>
                          </div>
                        </div>

                        {/* Telemetry / Service Metrics Grid */}
                        {proofResult.telemetry && (
                          <div className="p-3.5 rounded-xl bg-white/90 border border-emerald-200/80 space-y-2 text-xs">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                              <span className="text-slate-500 font-bold">Verification Source:</span>
                              <span className="font-extrabold text-slate-900">
                                {isSoil
                                  ? "14-Nutrient Spectrometer & Emitter Flow Sensor"
                                  : isMachinery
                                  ? "CAN-bus GPS Acreage Telematics"
                                  : proofResult.telemetry.source === "real_tlog"
                                  ? "MAVLink Binary Stream (.tlog)"
                                  : "Autonomous Lawnmower Telemetry"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                                <div className="font-black text-emerald-900">{proofResult.coverage_pct}%</div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {isSoil ? "Flow Restored" : "Field Coverage"}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="font-black text-slate-800">
                                  {isSoil ? "14 / 14" : proofResult.telemetry.total_gps_points}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {isSoil ? "Nutrients Checked" : "GPS Points"}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="font-black text-slate-800">
                                  {proofResult.telemetry.flight_duration_min || 45} min
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {isSoil ? "Service Time" : "Flight Duration"}
                                </div>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <div className="font-black text-slate-800">
                                  {isSoil ? "Grade A" : `${proofResult.telemetry.avg_altitude_m || 0} m`}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {isSoil ? "Quality Rating" : "Avg Altitude"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div
                          className="p-2.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between flex-wrap gap-2"
                          style={{ background: "rgba(16,185,129,0.12)" }}
                        >
                          <div className="flex items-center gap-1.5">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                            <span>Audit File: {proofResult.proof_log_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Released: {proofResult.payout_released_at?.split("T")[0]} {proofResult.payout_released_at?.split("T")[1]?.split(".")[0]} UTC
                          </span>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* MY BOOKINGS HISTORY SECTION (CLAY CARD)                   */}
        {/* ========================================================= */}
        <div
          className="p-6 md:p-8 rounded-3xl space-y-4"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow)",
            border: "1px solid rgba(255, 255, 255, 0.7)",
          }}
        >
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {t("services.my_bookings", "My Service Bookings")}
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Track status and dispatched operator schedules for your registered fields.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {bookings.length} Total Bookings
            </span>
          </div>

          {bookings.length === 0 ? (
            <div
              className="p-8 text-center rounded-2xl space-y-2"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-inset-sm)",
              }}
            >
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-black text-slate-800">No active bookings yet</div>
              <div className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                Select any of the 8 services above to schedule a drone, combine harvester, or soil testing lab visit for your field.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const sInfo = catalog.find((c) => c.id === b.service_type);
                const sName = sInfo ? sInfo.name : b.service_type;

                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
                    style={{
                      background: "var(--clay-surface)",
                      boxShadow: "var(--clay-inset-sm)",
                      border: "1px solid rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "#ffffff",
                          boxShadow: "var(--clay-card-shadow-sm)",
                        }}
                      >
                        {getServiceIcon(b.service_type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{sName}</h4>
                        <div className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>📅 {b.scheduled_date}</span>
                          {b.area_acres && <span>&middot; {b.area_acres} Acres</span>}
                          {b.notes && <span className="text-slate-400 truncate max-w-xs">&middot; {b.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${STATUS_BADGE[b.status] || "badge-moderate"} text-xs font-black uppercase`}>
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
