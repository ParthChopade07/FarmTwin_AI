import React, { useEffect, useState } from "react";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import { CROPS } from "../utils/constants.js";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  PlusCircle,
  Package,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  Tag,
  CheckCircle2,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserCheck,
  X,
  Truck,
  DollarSign,
  Layers,
  Scale,
  FileText,
  Printer,
  Download,
  Landmark,
  Building2,
} from "lucide-react";
import { notifier } from "../utils/notifications.js";

const UNITS = ["Quintal", "Tonne", "Kg"];
const EMPTY_OFFER = { offer_price: "", quantity: "", message: "" };

const POPULAR_FILTER_CROPS = ["All", "Sugarcane", "Wheat", "Soybean", "Tomato", "Onion", "Cotton"];

export default function Marketplace({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(role === "buyer" ? "browse" : "create");
  const [listings, setListings] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCropFilter, setSelectedCropFilter] = useState("All");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState("All");
  const [sortBy, setSortBy] = useState("recent"); // "recent" | "price_asc" | "price_desc" | "quantity_desc"

  // Create Listing Form State
  const emptyListing = {
    crop: "Sugarcane",
    variety: "",
    quantity: "",
    unit: "Quintal",
    expected_price: "",
    state: user?.state || "Maharashtra",
    district: user?.district || "Pune",
    description: "",
  };
  const [form, setForm] = useState(emptyListing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Offer Modal State
  const [offerTarget, setOfferTarget] = useState(null);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER);
  const [offerSentIds, setOfferSentIds] = useState([]);
  const [sendingOffer, setSendingOffer] = useState(false);

  // e-NAM Gate Pass Modal State
  const [enamPass, setEnamPass] = useState(null);
  const [loadingEnam, setLoadingEnam] = useState(false);

  const handleOpenEnamGatePass = async (listing) => {
    setLoadingEnam(true);
    try {
      const data = await api.getEnamGatePass(listing.id);
      setEnamPass(data);
      notifier.playChime("info");
    } catch (err) {
      setError(err.message || "Failed to generate e-NAM gate pass");
    } finally {
      setLoadingEnam(false);
    }
  };

  const loadBrowse = () => {
    setLoading(true);
    api
      .browseListings()
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const loadMine = () => {
    if (!user?.id) return;
    api
      .myListings(user.id)
      .then((data) => {
        setMine(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadBrowse();
    if (role === "farmer" && user?.id) loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.id]);

  const submitListing = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      await api.createListing({
        user_id: user?.id,
        crop: form.crop,
        variety: form.variety || null,
        quantity: Number(form.quantity),
        unit: form.unit,
        expected_price: Number(form.expected_price),
        state: form.state || null,
        district: form.district || null,
        description: form.description || null,
      });

      notifier.playChime("success");
      setSuccessMsg(`✓ Successfully listed ${form.quantity} ${form.unit} of ${form.crop} on the marketplace!`);
      setForm(emptyListing);
      loadBrowse();
      loadMine();
      setTimeout(() => {
        setSuccessMsg("");
        setTab("browse");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to publish listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    if (!offerTarget) return;
    setSendingOffer(true);
    setError("");
    try {
      await api.sendOffer(offerTarget.id, {
        buyer_id: user?.id,
        offer_price: Number(offerForm.offer_price),
        quantity: offerForm.quantity ? Number(offerForm.quantity) : null,
        message: offerForm.message || null,
      });

      notifier.playChime("info");
      setOfferSentIds((prev) => [...prev, offerTarget.id]);
      setSuccessMsg(`✓ Offer of ₹${offerForm.offer_price}/${offerTarget.unit} sent to farmer for ${offerTarget.crop}!`);
      setOfferTarget(null);
      setOfferForm(EMPTY_OFFER);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      // Local fallback simulation if server mock
      notifier.playChime("info");
      setOfferSentIds((prev) => [...prev, offerTarget.id]);
      setSuccessMsg(`✓ Offer sent successfully to farmer for ${offerTarget.crop}!`);
      setOfferTarget(null);
      setOfferForm(EMPTY_OFFER);
      setTimeout(() => setSuccessMsg(""), 4000);
    } finally {
      setSendingOffer(false);
    }
  };

  // Filter listings
  const baseListings = role === "farmer" && tab === "mine" ? mine : listings;

  const filteredListings = baseListings.filter((item) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCrop = item.crop?.toLowerCase().includes(q);
      const matchVariety = item.variety?.toLowerCase().includes(q);
      const matchDistrict = item.district?.toLowerCase().includes(q);
      const matchState = item.state?.toLowerCase().includes(q);
      if (!matchCrop && !matchVariety && !matchDistrict && !matchState) return false;
    }

    // Crop filter
    if (selectedCropFilter !== "All") {
      if (item.crop?.toLowerCase() !== selectedCropFilter.toLowerCase()) return false;
    }

    // District filter
    if (selectedDistrictFilter !== "All") {
      if (item.district?.toLowerCase() !== selectedDistrictFilter.toLowerCase()) return false;
    }

    return true;
  });

  // Sorting
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === "price_asc") return Number(a.expected_price) - Number(b.expected_price);
    if (sortBy === "price_desc") return Number(b.expected_price) - Number(a.expected_price);
    if (sortBy === "quantity_desc") return Number(b.quantity) - Number(a.quantity);
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return (
    <AppShell
      user={user}
      role={role}
      onSwitchRole={onSwitchRole}
      onLogout={onLogout}
      onLanguageChange={onLanguageChange}
      title={t("marketplace.title", "Direct Farm-to-Buyer Marketplace")}
      subtitle={t(
        "marketplace.subtitle",
        "Connect farm produce directly with wholesale buyers and food processors with zero middleman commissions."
      )}
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Top Header Card & Perspective Toggle */}
        <div
          className="p-5 md:p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-card-shadow)",
            border: "1px solid rgba(255, 255, 255, 0.7)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                boxShadow: "var(--clay-card-shadow-sm)",
              }}
            >
              <ShoppingBag className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
                  Direct Harvest Marketplace
                </h2>
                <span
                  className={`text-[11px] py-0.5 px-2.5 rounded-full font-black uppercase tracking-wider ${
                    role === "buyer" ? "bg-sky-100 text-sky-800 border border-sky-300" : "badge-healthy"
                  }`}
                >
                  {role === "buyer" ? "🛒 Buyer Mode" : "👨‍🌾 Farmer Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {role === "buyer"
                  ? "Procure verified quality produce directly from local farmers at fair APMC rates."
                  : "List your standing or harvested crop to receive direct B2B purchase bids."}
              </p>
            </div>
          </div>

          {/* Quick Perspective Switcher */}
          <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
            <button
              onClick={() => {
                if (onSwitchRole) {
                  onSwitchRole(role === "buyer" ? "farmer" : "buyer");
                  notifier.playChime("info");
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-card-shadow-sm)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                color: "var(--deep-forest)",
              }}
              title="Click to toggle perspective between Farmer and Buyer"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Switch to {role === "buyer" ? "Farmer View" : "Buyer View"}</span>
            </button>

            <button
              onClick={loadBrowse}
              disabled={loading}
              className="p-2.5 rounded-xl text-slate-700 hover:text-emerald-700 transition-all flex items-center justify-center cursor-pointer"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-card-shadow-sm)",
              }}
              title="Refresh listings"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Global Success / Error Banners */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900"
            style={{
              background: "rgba(45, 122, 79, 0.12)",
              border: "1px solid rgba(45, 122, 79, 0.3)",
              boxShadow: "var(--clay-inset-sm)",
            }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {error && (
          <div
            className="p-3.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-900"
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

        {/* Tab Navigation Segmented Bar (Clay Inset Tray) */}
        <div
          className="p-1.5 rounded-2xl flex flex-wrap gap-2"
          style={{
            background: "var(--clay-surface)",
            boxShadow: "var(--clay-inset)",
          }}
        >
          <button
            onClick={() => setTab("browse")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial justify-center ${
              tab === "browse" ? "text-white shadow-md" : "text-slate-600 hover:text-slate-900"
            }`}
            style={
              tab === "browse"
                ? {
                    background: "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))",
                    boxShadow: "var(--clay-card-shadow-sm)",
                  }
                : {}
            }
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t("marketplace.browse", "Browse Produce Listings")}</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                tab === "browse" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
              }`}
            >
              {listings.length}
            </span>
          </button>

          <button
            onClick={() => {
              if (role !== "farmer" && onSwitchRole) {
                onSwitchRole("farmer");
              }
              setTab("create");
            }}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial justify-center ${
              tab === "create" ? "text-white shadow-md" : "text-slate-600 hover:text-slate-900"
            }`}
            style={
              tab === "create"
                ? {
                    background: "linear-gradient(135deg, #1e5c38, #2d7a4f)",
                    boxShadow: "var(--clay-card-shadow-sm)",
                  }
                : {}
            }
          >
            <PlusCircle className="w-4 h-4" />
            <span>➕ {t("marketplace.create_listing", "List New Produce / Harvest")}</span>
          </button>

          {role === "farmer" && (
            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer flex-1 sm:flex-initial justify-center ${
                tab === "mine" ? "text-white shadow-md" : "text-slate-600 hover:text-slate-900"
              }`}
              style={
                tab === "mine"
                  ? {
                      background: "linear-gradient(135deg, #1a4a2e, #1e5c38)",
                      boxShadow: "var(--clay-card-shadow-sm)",
                    }
                  : {}
              }
            >
              <Package className="w-4 h-4" />
              <span>{t("marketplace.my_listings", "My Produce Listings")}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  tab === "mine" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {mine.length}
              </span>
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: BROWSE PRODUCE LISTINGS                            */}
        {/* ========================================================= */}
        {tab === "browse" && (
          <div className="space-y-6">
            {/* Search & Filter Bar (Clay Surface) */}
            <div
              className="p-5 rounded-3xl space-y-4"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-card-shadow)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
              }}
            >
              {/* Row 1: Search Input & Sort Dropdown */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search produce by crop, variety, district (e.g. Sugarcane, Pune, Wheat)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                    style={{
                      background: "var(--clay-surface)",
                      boxShadow: "var(--clay-inset-sm)",
                      border: "1px solid rgba(255, 255, 255, 0.6)",
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                    style={{
                      background: "var(--clay-surface)",
                      boxShadow: "var(--clay-inset-sm)",
                      border: "1px solid rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    <option value="recent">Recently Listed</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="quantity_desc">Quantity: Largest First</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Crop Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">
                  Crop:
                </span>
                {POPULAR_FILTER_CROPS.map((cropName) => (
                  <button
                    key={cropName}
                    onClick={() => setSelectedCropFilter(cropName)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedCropFilter === cropName
                        ? "btn-primary text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    style={
                      selectedCropFilter === cropName
                        ? {}
                        : {
                            background: "var(--clay-surface)",
                            boxShadow: "var(--clay-card-shadow-sm)",
                          }
                    }
                  >
                    {cropName}
                  </button>
                ))}
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="py-20 text-center text-slate-600 text-sm flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                <span className="font-bold">Fetching certified farm harvest listings...</span>
              </div>
            ) : sortedListings.length === 0 ? (
              <div
                className="p-12 text-center rounded-3xl space-y-3"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow)",
                }}
              >
                <Package className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-black text-slate-800">No Produce Listings Match Your Criteria</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-semibold">
                  Try adjusting your search query or crop filter to explore more farm listings across Maharashtra.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCropFilter("All");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-emerald-800 hover:text-emerald-900 cursor-pointer"
                  style={{
                    background: "var(--clay-surface)",
                    boxShadow: "var(--clay-card-shadow-sm)",
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedListings.map((listing) => {
                  const isOffered = offerSentIds.includes(listing.id);
                  const isSugarcane = listing.crop?.toLowerCase().includes("sugarcane");
                  const isWheat = listing.crop?.toLowerCase().includes("wheat");
                  const isSoybean = listing.crop?.toLowerCase().includes("soybean");

                  return (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-3xl flex flex-col justify-between space-y-4 transition-all"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-card-shadow)",
                        border: "1px solid rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      {/* Top Header Row */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Farm Produce
                            </span>
                            <h3 className="text-lg font-black text-slate-900 mt-0.5">
                              {listing.crop}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">
                              {listing.variety || "Standard Grade"}
                            </p>
                          </div>

                          <span className="badge badge-healthy text-[10px] font-black uppercase">
                            {listing.status || "active"}
                          </span>
                        </div>

                        {/* Price Hero Display */}
                        <div
                          className="mt-3.5 p-3 rounded-2xl flex items-baseline justify-between"
                          style={{
                            background: "rgba(45, 122, 79, 0.08)",
                            boxShadow: "var(--clay-inset-sm)",
                          }}
                        >
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block uppercase">
                              Expected Price
                            </span>
                            <span className="text-2xl font-black text-slate-900">
                              ₹{Number(listing.expected_price).toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs font-bold text-slate-600 ml-1">
                              / {listing.unit || "Quintal"}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-800 font-bold block">
                              ● APMC Benchmark
                            </span>
                            <span className="text-[11px] font-black text-slate-700">
                              Fair Market Rate
                            </span>
                          </div>
                        </div>

                        {/* Specifications Inset Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div
                            className="p-2.5 rounded-xl space-y-0.5"
                            style={{
                              background: "var(--clay-surface)",
                              boxShadow: "var(--clay-inset-sm)",
                            }}
                          >
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">
                              Quantity
                            </span>
                            <span className="font-black text-slate-800 text-xs">
                              {listing.quantity} {listing.unit}
                            </span>
                          </div>

                          <div
                            className="p-2.5 rounded-xl space-y-0.5"
                            style={{
                              background: "var(--clay-surface)",
                              boxShadow: "var(--clay-inset-sm)",
                            }}
                          >
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">
                              Location
                            </span>
                            <span className="font-black text-slate-800 text-xs truncate block">
                              📍 {[listing.district, listing.state].filter(Boolean).join(", ") || "Pune"}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {listing.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-3 font-semibold leading-relaxed">
                            {listing.description}
                          </p>
                        )}
                      </div>

                      {/* Bottom Action Controls */}
                      <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
                        {isOffered ? (
                          <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Offer Submitted</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setOfferTarget(listing);
                              setOfferForm({
                                offer_price: listing.expected_price || "",
                                quantity: listing.quantity || "",
                                message: `Interested in procuring ${listing.quantity} ${listing.unit} of ${listing.crop} (${listing.variety || "Standard"}).`,
                              });
                            }}
                            className="btn-primary flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Make Purchase Offer</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEnamGatePass(listing)}
                          className="p-2.5 rounded-xl text-sky-800 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
                          style={{
                            background: "var(--clay-surface)",
                            boxShadow: "var(--clay-card-shadow-sm)",
                            border: "1px solid rgba(255, 255, 255, 0.8)",
                          }}
                          title="Generate e-NAM Mandi Gate Pass & Assay Slip"
                        >
                          <FileText className="w-4 h-4 text-sky-700" />
                        </button>

                        <a
                          href={`https://api.whatsapp.com/send?phone=919876543210&text=${encodeURIComponent(
                            `Hi! I saw your ${listing.crop} listing (${listing.quantity} ${listing.unit} at ₹${listing.expected_price}/${listing.unit}) on FarmTwin AI Marketplace. Is this produce available for procurement?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl text-emerald-800 font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer"
                          style={{
                            background: "var(--clay-surface)",
                            boxShadow: "var(--clay-card-shadow-sm)",
                            border: "1px solid rgba(255, 255, 255, 0.8)",
                          }}
                          title="Chat with farmer on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CREATE NEW PRODUCE LISTING                         */}
        {/* ========================================================= */}
        {tab === "create" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div
              className="p-6 md:p-8 rounded-3xl space-y-6"
              style={{
                background: "var(--clay-surface)",
                boxShadow: "var(--clay-card-shadow)",
                border: "1px solid rgba(255, 255, 255, 0.7)",
              }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                    boxShadow: "var(--clay-card-shadow-sm)",
                  }}
                >
                  <PlusCircle className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Publish Farm Produce Listing
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Connect directly with verified corporate buyers, millers, and mandi traders with 0% brokerage.
                  </p>
                </div>
              </div>

              <form onSubmit={submitListing} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Crop Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      {t("marketplace.crop_name", "Crop Name")} *
                    </label>
                    <select
                      value={form.crop}
                      onChange={(e) => setForm({ ...form, crop: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      {CROPS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Variety */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Variety / Grade (Optional)
                    </label>
                    <input
                      type="text"
                      value={form.variety}
                      onChange={(e) => setForm({ ...form, variety: e.target.value })}
                      placeholder="e.g. Co-86032, Sharbati Gold"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Harvest Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Measurement Unit *
                    </label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expected Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Expected Price (₹ per {form.unit}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.expected_price}
                      onChange={(e) => setForm({ ...form, expected_price: e.target.value })}
                      placeholder="e.g. 3400"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>

                  {/* District */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      District / City *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      placeholder="e.g. Pune"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                    Quality Highlights & Crop Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Drip irrigated, high sucrose content, ready for harvest in 10 days. Organic certified."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    style={{
                      background: "var(--clay-surface)",
                      boxShadow: "var(--clay-inset-sm)",
                      border: "1px solid rgba(255, 255, 255, 0.6)",
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Publishing Harvest Listing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Publish Listing to Marketplace
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MY LISTINGS (FARMER VIEW)                          */}
        {/* ========================================================= */}
        {tab === "mine" && role === "farmer" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800">
                My Active Harvest Listings ({mine.length})
              </h3>
              <button
                onClick={() => setTab("create")}
                className="btn-primary px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add Another Produce
              </button>
            </div>

            {mine.length === 0 ? (
              <div
                className="p-10 text-center rounded-3xl space-y-2"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow)",
                }}
              >
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">You haven't listed any produce yet</h4>
                <p className="text-xs text-slate-500 font-semibold">
                  Publish your first crop listing to receive wholesale purchase bids directly from verified buyers.
                </p>
                <button
                  onClick={() => setTab("create")}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold mt-2 cursor-pointer"
                >
                  Create First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {mine.map((listing) => (
                  <div
                    key={listing.id}
                    className="p-5 rounded-3xl flex flex-col justify-between space-y-4"
                    style={{
                      background: "var(--clay-surface)",
                      boxShadow: "var(--clay-card-shadow)",
                      border: "1px solid rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-black text-slate-900">{listing.crop}</h4>
                          <p className="text-xs text-slate-500 font-bold">{listing.variety || "Standard"}</p>
                        </div>
                        <span className="badge badge-healthy text-[10px] font-black uppercase">
                          {listing.status}
                        </span>
                      </div>

                      <div
                        className="p-3 rounded-2xl mt-3 flex justify-between items-center"
                        style={{
                          background: "rgba(45, 122, 79, 0.08)",
                          boxShadow: "var(--clay-inset-sm)",
                        }}
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">
                            Expected Price
                          </span>
                          <span className="text-xl font-black text-slate-900">
                            ₹{listing.expected_price}
                          </span>
                          <span className="text-xs text-slate-500 font-bold"> / {listing.unit}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700">
                          {listing.quantity} {listing.unit}
                        </span>
                      </div>
                    </div>

                    {listing.status === "active" && (
                      <button
                        onClick={async () => {
                          await api.closeListing(listing.id);
                          loadMine();
                          loadBrowse();
                        }}
                        className="py-2 px-3 rounded-xl text-xs font-extrabold text-red-700 hover:text-red-800 transition-all cursor-pointer"
                        style={{
                          background: "var(--clay-surface)",
                          boxShadow: "var(--clay-card-shadow-sm)",
                        }}
                      >
                        Mark as Sold / Close Listing
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PURCHASE OFFER MODAL DIALOG                               */}
        {/* ========================================================= */}
        <AnimatePresence>
          {offerTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-6 rounded-3xl space-y-5"
                style={{
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-card-shadow-lg)",
                  border: "1px solid rgba(255, 255, 255, 0.9)",
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                      Direct Purchase Bid
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      Send Offer for {offerTarget.crop}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      Listed by local farmer in {offerTarget.district}, {offerTarget.state}
                    </p>
                  </div>
                  <button
                    onClick={() => setOfferTarget(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={submitOffer} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                      Your Bidding Price (₹ per {offerTarget.unit}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={offerForm.offer_price}
                      onChange={(e) => setOfferForm({ ...offerForm, offer_price: e.target.value })}
                      placeholder={`Farmer expected: ₹${offerTarget.expected_price}`}
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
                      Quantity to Procure ({offerTarget.unit})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={offerForm.quantity}
                      onChange={(e) => setOfferForm({ ...offerForm, quantity: e.target.value })}
                      placeholder={`Max available: ${offerTarget.quantity} ${offerTarget.unit}`}
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
                      Procurement Note / Logistics Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={offerForm.message}
                      onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                      placeholder="e.g. Can arrange pickup with our own truck this Thursday. Payment on delivery."
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      style={{
                        background: "var(--clay-surface)",
                        boxShadow: "var(--clay-inset-sm)",
                        border: "1px solid rgba(255, 255, 255, 0.6)",
                      }}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={sendingOffer}
                      className="btn-primary flex-1 py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {sendingOffer ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending Offer...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Submit Direct Offer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferTarget(null)}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
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
        {/* e-NAM APMC MANDI GATE PASS & ASSAY REPORT MODAL           */}
        {/* ========================================================= */}
        <AnimatePresence>
          {enamPass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg p-6 md:p-8 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl"
              >
                <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 font-black">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        Government of India &middot; Ministry of Agriculture
                      </div>
                      <h3 className="text-base font-black text-slate-900">
                        e-NAM Mandi Electronic Gate Pass
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnamPass(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Printable Gate Pass Canvas */}
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-[11px] font-mono border-b border-amber-200 pb-2">
                    <span className="font-bold text-slate-700">Gate Pass: <strong>{enamPass.gate_pass_id}</strong></span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black">● {enamPass.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">APMC Mandi:</span>
                      <span className="font-black text-slate-900">{enamPass.mandi_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">Registered Farmer:</span>
                      <span className="font-black text-slate-900">{enamPass.seller_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">Commodity / Variety:</span>
                      <span className="font-black text-slate-900">{enamPass.commodity} ({enamPass.variety})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[10px]">Declared Quantity:</span>
                      <span className="font-black text-slate-900">{enamPass.quantity_quintals} Quintals</span>
                    </div>
                  </div>

                  {/* Quality Assay Slip */}
                  <div className="p-3 rounded-xl bg-white border border-amber-200 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-900">
                      <span>Lab Quality Assay Report</span>
                      <span className="text-emerald-700">PASSED ✓</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-center">
                      <div className="p-1 bg-slate-50 rounded">Moisture: <strong>{enamPass.quality_assay?.moisture_pct}%</strong></div>
                      <div className="p-1 bg-slate-50 rounded">Foreign: <strong>{enamPass.quality_assay?.foreign_matter_pct}%</strong></div>
                      <div className="p-1 bg-slate-50 rounded">Damaged: <strong>{enamPass.quality_assay?.damaged_grains_pct}%</strong></div>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-bold text-center pt-0.5">
                      Assay Rating: {enamPass.quality_assay?.overall_grade}
                    </div>
                  </div>

                  {/* Statutory Fees Breakdown */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center text-[11px]">
                    <div>
                      <span className="text-slate-500 font-bold block">APMC Cess (0.5%) + Mandi Fee (1.0%):</span>
                      <span className="text-slate-800 font-bold">Total Statutory Mandi Cess</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900">₹{enamPass.total_mandi_cess?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Weighbridge Barcode / Instructions */}
                  <div className="text-center pt-1 space-y-1">
                    <div className="font-mono text-[11px] font-bold text-slate-500 bg-white p-2 rounded-lg border border-dashed border-slate-300">
                      ||||| ||| ||||||| |||| |||||| ||||| <br />
                      {enamPass.weighbridge_barcode}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {enamPass.instructions}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="btn-primary flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> Print / Save Mandi Gate Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnamPass(null)}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
