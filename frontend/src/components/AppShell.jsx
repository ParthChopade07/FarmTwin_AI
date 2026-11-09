import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api.js";
import {
  IconDashboard,
  IconFarm,
  IconAdvisor,
  IconWeather,
  IconLeaf,
  IconServices,
  IconMarketplace,
  IconInbox,
  IconSettings,
  IconLogout,
  IconSearch,
  IconSliders,
  IconBell,
} from "./icons.jsx";
import NotificationBell from "./NotificationBell.jsx";
import FloatingChatbot from "./FloatingChatbot.jsx";
import { ToastProvider, useToast } from "./Toast.jsx";
import i18n, { SUPPORTED_LANGUAGES } from "../i18n.js";
import { ChevronDown, ChevronRight, Wifi, WifiOff, TrendingUp, Landmark, Award, Globe, Check } from "lucide-react";

const LANG_OPTIONS = SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: l.label, title: l.full }));

function greeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t("greeting.morning");
  if (h < 17) return t("greeting.afternoon");
  return t("greeting.evening");
}

function AppShellContent({
  user,
  role,
  onSwitchRole,
  onLogout,
  onLanguageChange,
  title,
  subtitle,
  actions,
  children,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const searchInputRef = useRef(null);
  const langMenuRef = useRef(null);

  // Click outside to close language dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showLangMenu]);

  // Accordion State: collapse non-active categories by default
  const [openGroups, setOpenGroups] = useState({
    overview: true,
    intelligence: false,
    ai_support: false,
    market: false,
    schemes_credits: false,
    communication: false,
    system: false,
  });

  // Offline / Online Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("✓ Connection restored");
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("⚠ You're offline. Showing latest cached data.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  // Ctrl+K Shortcut Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const SEARCH_ITEMS = [
    { label: "AI What-If Simulation", path: "/what-if", keywords: ["what if", "simulation", "simulate", "yield", "risk", "decision", "lab"] },
    { label: "Alerts & Outbreak Radar", path: "/alerts", keywords: ["alerts", "outbreak", "radar", "48 hours", "25km", "sentinel", "notification"] },
    { label: "Yield Predictor & Season ROI", path: "/yield-predictor", keywords: ["yield", "yield predictor", "harvest", "roi", "profit", "profitability", "season simulator"] },
    { label: "AI Seller & Market Advisor", path: "/advisor", keywords: ["ai seller", "seller", "advisor", "market", "mandi", "price", "sell", "crop price"] },
    { label: "Weather & Soil Information", path: "/weather", keywords: ["weather", "soil", "rain", "temperature", "humidity", "forecast", "sun", "wind"] },
    { label: "Dashboard & Farm Digital Twin", path: "/dashboard", keywords: ["dashboard", "home", "farm", "twin", "risk", "soil", "acres", "field"] },
    { label: "Disease Detection", path: "/disease-detection", keywords: ["disease", "pests", "detection", "leaf", "scan", "crop health", "diagnosis"] },
    { label: "Service Hub", path: "/services", keywords: ["services", "service hub", "spray", "harvester", "drone", "booking"] },
    { label: "Marketplace", path: "/marketplace", keywords: ["marketplace", "buy", "sell", "listing", "offers", "trade", "crop"] },
    { label: "Government Schemes & Subsidies", path: "/schemes", keywords: ["scheme", "subsidy", "pm kisan", "dbt", "pmfby", "government"] },
    { label: "Soil Carbon & Carbon Credits", path: "/carbon-credits", keywords: ["carbon", "carbon credits", "soil organic carbon", "esg", "sequestration", "passport"] },
    { label: "Inbox & Messages", path: "/inbox", keywords: ["inbox", "messages", "offers", "chat", "notification"] },
    { label: "Settings", path: "/settings", keywords: ["settings", "profile", "language", "account", "logout"] },
  ];

  const searchFiltered = searchTerm.trim()
    ? SEARCH_ITEMS.filter((item) => {
        const query = searchTerm.toLowerCase();
        return (
          item.label.toLowerCase().includes(query) ||
          item.keywords.some((k) => k.includes(query))
        );
      })
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchFiltered.length > 0) {
      navigate(searchFiltered[0].path);
      setSearchTerm("");
      setShowSearchDropdown(false);
    }
  };

  // Structured Accordion Navigation Schema
  const NAV_GROUPS = [
    {
      id: "overview",
      title: t("nav.groups.overview", "OVERVIEW"),
      items: [
        { to: "/dashboard", label: t("nav.dashboard", "Dashboard"), icon: IconDashboard },
      ],
    },
    {
      id: "intelligence",
      title: t("nav.groups.intelligence", "FARM INTELLIGENCE"),
      items: [
        { to: "/weather", label: t("nav.weather_soil", "Weather & Soil"), icon: IconWeather },
        { to: "/disease-detection", label: t("nav.disease", "Disease Detection"), icon: IconLeaf },
      ],
    },
    {
      id: "ai_support",
      title: t("nav.groups.ai_support", "AI & DECISION SUPPORT"),
      items: [
        { to: "/what-if", label: t("nav.what_if", "What-if Simulation"), icon: IconSliders },
        { to: "/alerts", label: t("nav.alerts", "Alerts"), icon: IconBell },
        { to: "/yield-predictor", label: t("nav.yield_predictor", "Yield Predictor"), icon: TrendingUp },
        { to: "/advisor", label: t("nav.ai_insights", "AI Insights & Seller"), icon: IconAdvisor },
      ],
    },
    {
      id: "market",
      title: t("nav.groups.market", "MARKET & SERVICES"),
      items: [
        { to: "/marketplace", label: t("nav.marketplace", "Marketplace"), icon: IconMarketplace },
        { to: "/services", label: t("nav.services", "Service Hub"), icon: IconServices },
        { to: "/offers", label: t("nav.offers_buyer", "Offers & Buyer"), icon: IconFarm },
      ],
    },
    {
      id: "schemes_credits",
      title: t("nav.groups.schemes_credits", "SCHEMES & CREDITS"),
      items: [
        { to: "/schemes", label: t("nav.schemes", "Government Scheme Advisor"), icon: Landmark },
        { to: "/carbon-credits", label: t("nav.carbon_credits", "Carbon Credits"), icon: Award },
      ],
    },
    {
      id: "communication",
      title: t("nav.groups.communication", "COMMUNICATION"),
      items: [
        { to: "/inbox", label: t("nav.inbox", "Inbox"), icon: IconInbox },
      ],
    },
    {
      id: "system",
      title: t("nav.groups.system", "SYSTEM"),
      items: [
        { to: "/settings", label: t("nav.settings", "Settings"), icon: IconSettings },
      ],
    },
  ];

  // Auto-expand group containing current pathname
  useEffect(() => {
    NAV_GROUPS.forEach((grp) => {
      if (grp.items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + "/"))) {
        setOpenGroups((prev) => ({ ...prev, [grp.id]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const today = new Date().toLocaleDateString(
    user?.language === "hi" ? "hi-IN" : user?.language === "mr" ? "mr-IN" : "en-IN",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  );

  const [activeLang, setActiveLang] = useState(() => i18n.language || "en");

  useEffect(() => {
    const handleLngChange = (lng) => {
      setActiveLang(lng);
    };
    i18n.on("languageChanged", handleLngChange);
    return () => {
      i18n.off("languageChanged", handleLngChange);
    };
  }, []);

  const currentLang = activeLang;

  const handleLangSwitch = (lang) => {
    i18n.changeLanguage(lang);
    if (onLanguageChange) onLanguageChange(lang);
  };

  return (
    <div className="shell">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-600 shadow-sm z-50">
          <WifiOff className="w-4 h-4 animate-bounce" />
          <span>⚠️ You're offline. Showing the latest cached farm data.</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ display: isSidebarHidden ? "none" : "flex", background: "linear-gradient(170deg, #1a3d2b 0%, #0e2318 100%)", borderRadius: "0 24px 24px 0" }}>
        <div className="sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" }}>FarmTwin AI</span>
            <span style={{ display: "block", fontSize: "0.72rem", color: "#aae5aa", opacity: 0.9, fontWeight: 600, marginTop: "2px" }}>
              {t("nav.smart_farming", "Smart Farming Platform")}
            </span>
          </div>

          <button
            onClick={() => setShowSidebarMenu((prev) => !prev)}
            style={{
              background: showSidebarMenu ? "rgba(255, 255, 255, 0.15)" : "transparent",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              color: "#e8e4d9",
              padding: "6px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            title="Sidebar Menu"
            aria-label="Sidebar Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="19" r="2.2" fill="currentColor" />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              <circle cx="19" cy="5" r="2.2" fill="currentColor" />
            </svg>
          </button>

          {showSidebarMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                width: "200px",
                background: "#0c2b21",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "0.5rem",
                zIndex: 1000,
                color: "#e8e4d9",
              }}
            >
              <div
                onClick={() => {
                  setShowSidebarMenu(false);
                  setIsSidebarHidden(true);
                }}
                style={{
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>👈</span> Hide Sidebar
              </div>
              <div
                onClick={() => {
                  setShowSidebarMenu(false);
                  onSwitchRole(role === "buyer" ? "farmer" : "buyer");
                }}
                style={{
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>🔄</span>
                {t("common.switch_to", {
                  role: role === "buyer" ? t("common.farmer") : t("common.buyer"),
                })}
              </div>

              <Link
                to="/settings"
                onClick={() => setShowSidebarMenu(false)}
                style={{
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#e8e4d9",
                  textDecoration: "none",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>⚙️</span> {t("nav.settings")}
              </Link>

              <div
                onClick={() => {
                  setShowSidebarMenu(false);
                  onLogout();
                }}
                style={{
                  padding: "0.6rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#f87171",
                  cursor: "pointer",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "0.2rem",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.12)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>🚪</span> {t("common.logout")}
              </div>
            </div>
          )}
        </div>

        {/* Accordion Menu Navigation */}
        <nav className="sidebar-nav" style={{ padding: "0.75rem 0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {NAV_GROUPS.map((grp) => {
            const isOpen = !!openGroups[grp.id];
            return (
              <div key={grp.id} className="space-y-1">
                {/* Group Header Button */}
                <button
                  onClick={() => toggleGroup(grp.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.4rem 0.6rem",
                    background: "transparent",
                    border: "none",
                    color: "#88ab98",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    borderRadius: "6px",
                    transition: "color 0.15s ease",
                  }}
                  className="hover:text-emerald-300"
                >
                  <span>{grp.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  )}
                </button>

                {/* Group Items */}
                {isOpen && (
                  <div className="space-y-1 pl-1">
                    {grp.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location.pathname === item.to ||
                        (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`sidebar-link ${isActive ? "active" : ""}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "14px",
                            fontSize: "0.82rem",
                            fontWeight: isActive ? 800 : 600,
                            color: isActive ? "#1a3d2b" : "#d1e2d6",
                            background: isActive ? "linear-gradient(135deg, #a8dfb8, #c4eed4)" : "transparent",
                            boxShadow: isActive ? "4px 4px 12px rgba(0,0,0,0.2), -2px -2px 8px rgba(255,255,255,0.06)" : "none",
                            transition: "all 0.18s ease",
                            textDecoration: "none",
                            fontFamily: "'Nunito', sans-serif",
                          }}
                        >
                          <span className="sidebar-icon" style={{ opacity: isActive ? 1 : 0.8 }}>
                            <Icon />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>


        <div className="sidebar-footer" style={{ padding: "0.85rem", fontSize: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <strong style={{ fontSize: "0.9rem", color: "#fff", display: "block" }}>{user?.name || "Farmer"}</strong>
          {user?.email && <div style={{ fontSize: "0.76rem", color: "#88ab98", wordBreak: "break-all" }}>📧 {user.email}</div>}
          {user?.phone && <div style={{ fontSize: "0.76rem", color: "#88ab98" }}>📞 {user.phone}</div>}
          <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#88ab98" }}>
            {role === "buyer" ? t("login.buyer") : t("login.farmer")}
          </div>
          <button
            onClick={() => onSwitchRole(role === "buyer" ? "farmer" : "buyer")}
            className="btn-ghost"
            style={{ color: "#aae5aa", padding: "0.4rem 0 0", display: "block", fontSize: "0.75rem", cursor: "pointer" }}
          >
            {t("common.switch_to", {
              role: role === "buyer" ? t("common.farmer") : t("common.buyer"),
            })}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="shell-main" style={{ background: "var(--clay-bg)" }}>
        <header className="shell-topbar" style={{ background: "var(--clay-surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {isSidebarHidden && (
              <button
                onClick={() => setIsSidebarHidden(false)}
                style={{
                  background: "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))",
                  border: "none",
                  borderRadius: "14px",
                  color: "#ffffff",
                  padding: "6px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  boxShadow: "5px 5px 14px var(--clay-shadow-dark), -3px -3px 10px var(--clay-shadow-light)",
                  fontFamily: "'Nunito', sans-serif",
                }}
                title="Show Sidebar"
                aria-label="Show Sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="19" r="2.2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2.2" fill="currentColor" />
                  <circle cx="19" cy="5" r="2.2" fill="currentColor" />
                </svg>
                <span>Show Sidebar</span>
              </button>
            )}

            <div>
              <h2 className="display" style={{ fontSize: "1.18rem", color: "var(--soil)", fontWeight: 900, fontFamily: "'Nunito', sans-serif" }}>
                {greeting(t)}, {user?.name?.split(" ")[0]}
                <span style={{ marginLeft: "0.4rem" }}>👋</span>
              </h2>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "var(--sage-mid)", fontWeight: 600, fontFamily: "'Nunito', sans-serif" }}>
                {today}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Search input with Ctrl+K shortcut */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                position: "relative",
                display: window.innerWidth > 720 ? "block" : "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#557964",
                  zIndex: 2,
                }}
              >
                <IconSearch />
              </span>
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                placeholder="Search farms, crops, weather, reports..."
                style={{
                  paddingLeft: "2.4rem",
                  paddingRight: "3rem",
                  width: 280,
                  height: 40,
                  borderRadius: "16px",
                  border: "none",
                  background: "var(--clay-surface)",
                  boxShadow: "var(--clay-inset)",
                  fontSize: "0.82rem",
                  color: "var(--ink)",
                  outline: "none",
                  transition: "all 0.2s ease",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 600,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  color: "var(--sage-mid)",
                  background: "var(--clay-bg)",
                  boxShadow: "2px 2px 5px var(--clay-shadow-dark), -1px -1px 4px var(--clay-shadow-light)",
                  padding: "2px 7px",
                  borderRadius: "8px",
                  pointerEvents: "none",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                Ctrl K
              </span>

              {showSearchDropdown && searchTerm.trim() && (
                <div
                  style={{
                    position: "absolute",
                    top: "48px",
                    left: 0,
                    right: 0,
                    background: "var(--clay-surface)",
                    borderRadius: "20px",
                    boxShadow: "var(--clay-card-shadow-lg)",
                    border: "none",
                    overflow: "hidden",
                    zIndex: 1000,
                    minWidth: "280px",
                  }}
                >
                  {searchFiltered.length > 0 ? (
                    searchFiltered.map((item) => (
                      <div
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setSearchTerm("");
                          setShowSearchDropdown(false);
                        }}
                        style={{
                          padding: "0.7rem 1rem",
                          fontSize: "0.82rem",
                          color: "var(--ink)",
                          fontWeight: 700,
                          cursor: "pointer",
                          borderBottom: "2px solid var(--clay-bg)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "background 0.15s ease",
                          fontFamily: "'Nunito', sans-serif",
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = "var(--clay-bg-lighter)")}
                        onMouseOut={(e) => (e.currentTarget.style.background = "var(--clay-surface)")}
                      >
                        <span style={{ color: "#134e43" }}>🔍</span> {item.label}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "0.75rem 0.9rem", fontSize: "0.8rem", color: "#556e60" }}>
                      No matching page found
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Language Switcher Dropdown */}
            <div ref={langMenuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowLangMenu((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--clay-surface)",
                  borderRadius: "18px",
                  padding: "6px 14px",
                  border: "none",
                  boxShadow: showLangMenu ? "var(--clay-inset-sm)" : "var(--clay-card-shadow-sm)",
                  cursor: "pointer",
                  color: "var(--soil)",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  transition: "all 0.18s ease",
                }}
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                <span style={{ minWidth: "18px", textAlign: "center" }}>
                  {LANG_OPTIONS.find((l) => l.value === currentLang)?.label || "EN"}
                </span>
                <span style={{ fontSize: "0.74rem", color: "var(--sage-mid)", fontWeight: 600 }}>
                  {LANG_OPTIONS.find((l) => l.value === currentLang)?.title || "English"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-emerald-800 transition-transform duration-200 ${
                    showLangMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showLangMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "190px",
                    background: "var(--clay-surface)",
                    borderRadius: "20px",
                    boxShadow: "var(--clay-card-shadow-lg)",
                    padding: "8px",
                    zIndex: 1000,
                    border: "none",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: "var(--sage-mid)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "4px 8px 6px",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      marginBottom: "4px",
                    }}
                  >
                    Select Language / भाषा
                  </div>
                  {LANG_OPTIONS.map((opt) => {
                    const isSelected = currentLang === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          handleLangSwitch(opt.value);
                          setShowLangMenu(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "12px",
                          border: "none",
                          cursor: "pointer",
                          background: isSelected
                            ? "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))"
                            : "transparent",
                          color: isSelected ? "#ffffff" : "var(--soil)",
                          fontFamily: "'Nunito', sans-serif",
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: "0.82rem",
                          boxShadow: isSelected ? "var(--clay-card-shadow-sm)" : "none",
                          transition: "all 0.15s ease",
                          marginBottom: "2px",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "var(--clay-bg-lighter)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "22px",
                              fontWeight: 800,
                              color: isSelected ? "#ffffff" : "var(--farm-emerald)",
                            }}
                          >
                            {opt.label}
                          </span>
                          <span>{opt.title}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hands-Free Field Mode Action Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent("agrimitra:fieldmode"));
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "linear-gradient(135deg, var(--farm-green) 0%, var(--farm-emerald) 100%)",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "16px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "5px 5px 14px var(--clay-shadow-dark), -3px -3px 10px var(--clay-shadow-light), 0 4px 12px rgba(45,122,79,0.25)",
                transition: "all 0.18s ease",
                fontFamily: "'Nunito', sans-serif",
              }}
              title="Activate Hands-Free Field Mode (Voice Input & Native Spoken Output)"
            >
              <span style={{ fontSize: "0.85rem" }}>🎙️</span>
              <span>{currentLang === "mr" ? "शेत मोड" : currentLang === "hi" ? "फील्ड मोड" : "Field Mode"}</span>
            </button>

            <NotificationBell userId={user?.id} role={role} />

            <span className="role-pill" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {role === "buyer" ? t("login.buyer") : t("login.farmer")}
            </span>

            {/* User Profile Dropdown */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => setShowProfileMenu((prev) => !prev)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.88rem",
                  boxShadow: "5px 5px 14px var(--clay-shadow-dark), -3px -3px 10px var(--clay-shadow-light)",
                  cursor: "pointer",
                  flexShrink: 0,
                  border: "3px solid var(--clay-shadow-light)",
                  transition: "all 0.15s ease",
                }}
                title={user?.name || "Profile"}
              >
                {user?.name
                  ? user.name
                      .trim()
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U"}
              </div>

              {showProfileMenu && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50px",
                    width: "250px",
                    background: "var(--clay-surface)",
                    borderRadius: "24px",
                    boxShadow: "var(--clay-card-shadow-lg)",
                    border: "none",
                    padding: "1rem",
                    zIndex: 1000,
                    color: "var(--ink)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "0.75rem",
                      paddingBottom: "0.75rem",
                      borderBottom: "2px solid var(--clay-bg)",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--farm-green), var(--farm-emerald))",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "1rem",
                        boxShadow: "var(--clay-card-shadow-sm)",
                        fontFamily: "'Nunito', sans-serif",
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          color: "var(--soil)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontFamily: "'Nunito', sans-serif",
                        }}
                      >
                        {user?.name || "User"}
                      </div>
                      <span className="role-pill" style={{ fontSize: "0.68rem", padding: "1px 8px" }}>
                        {role === "buyer" ? t("login.buyer") : t("login.farmer")}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.55rem",
                      fontSize: "0.82rem",
                      color: "var(--sage-mid)",
                      marginBottom: "0.85rem",
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {user?.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📧</span>
                        <span style={{ wordBreak: "break-all" }}>{user.email}</span>
                      </div>
                    )}
                    {user?.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📞</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "14px",
                      border: "none",
                      background: "linear-gradient(135deg, #e8b0aa, #f0c0ba)",
                      color: "#6b1a1a",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      boxShadow: "var(--clay-card-shadow-sm)",
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="shell-content">
          {(title || actions) && (
            <div className="page-head">
              <div>
                {title && <h1 className="display" style={{ fontSize: "1.6rem", fontWeight: 800 }}>{title}</h1>}
                {subtitle && <p style={{ fontSize: "0.88rem", color: "#556e60" }}>{subtitle}</p>}
              </div>
              {actions && (
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  {actions}
                </div>
              )}
            </div>
          )}
          {children}
        </div>
      </div>

      <FloatingChatbot user={user} />
    </div>
  );
}

export default function AppShell(props) {
  return (
    <ToastProvider>
      <AppShellContent {...props} />
    </ToastProvider>
  );
}
