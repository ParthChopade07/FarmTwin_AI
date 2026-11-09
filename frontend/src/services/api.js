// Standard backend port
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(path, options = {}) {
  let res;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("agritwin_token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const defaultHeaders = isFormData
    ? { ...authHeaders }
    : { "Content-Type": "application/json", ...authHeaders };
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });
  } catch (err) {
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error("Unable to connect to the backend server. Please make sure the backend is running on port 8000.");
    }
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return null;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  createUser: async (data) => {
    const res = await request("/api/users", { method: "POST", body: JSON.stringify(data) });
    if (res?.access_token) {
      localStorage.setItem("agritwin_token", res.access_token);
    }
    return res?.user || res;
  },

  loginUser: async (data) => {
    const res = await request("/api/users/login", { method: "POST", body: JSON.stringify(data) });
    if (res?.access_token) {
      localStorage.setItem("agritwin_token", res.access_token);
    }
    return res?.user || res;
  },

  getMe: () => request("/api/users/me"),

  getUser: (id) => request(`/api/users/${id}`),

  createFarm: (data) =>
    request("/api/farms", { method: "POST", body: JSON.stringify(data) }),

  listFarms: (userId) =>
    request(`/api/farms${userId ? `?user_id=${userId}` : ""}`),

  getFarm: (id) => request(`/api/farms/${id}`),

  deleteFarm: (id) => request(`/api/farms/${id}`, { method: "DELETE" }),

  getNdvi: (farmId) =>
    request(`/api/farms/${farmId}/ndvi`).then((d) => ({
      ...d,
      ndvi: d?.current?.ndvi_mean ?? d?.ndvi_mean ?? d?.ndvi ?? null,
    })),

  getNdviHistory: (farmId, days = 90) =>
    request(`/api/farms/${farmId}/ndvi/history?days=${days}`),

  getNdviGrid: (farmId, gridSize = 3) =>
    request(`/api/farms/${farmId}/ndvi/grid?grid_size=${gridSize}`),

  getWeather: (farmId) =>
    request(`/api/farms/${farmId}/weather`).then((d) => ({
      ...d,
      location: d?.location ?? d?.district ?? null,
      district: d?.district ?? null,
      state: d?.state ?? null,
      mandi: d?.mandi ?? (d?.district ? `${d.district} APMC Yard` : null),
      temperature: d?.current?.temperature_c ?? d?.temperature ?? null,
      humidity: d?.current?.humidity_pct ?? d?.humidity ?? null,
      wind_kmh: d?.current?.wind_kmh ?? 8,
      description: d?.current?.condition ?? d?.description ?? null,
    })),

  getInsight: (farmId) => request(`/api/farms/${farmId}/insight`),

  getPestsWeedsMap: (farmId) => request(`/api/farms/${farmId}/pests-weeds`),

  getSoilPassport: (farmId, language = "en") =>
    request(`/api/farms/${farmId}/soil-passport?language=${language}`),

  getHealthPrediction: (farmId) =>
    request(`/api/farms/${farmId}/health`).then((d) => ({
      ...d,
      possible_causes: d?.possible_causes ?? [],
    })),

  getRecommendations: (farmId, language = "en") =>
    request(`/api/farms/${farmId}/recommendations?language=${language}`)
      .then((d) => {
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.recommendations)) return d.recommendations;
        return [];
      }),

  askAssistant: (farmId, question, language) =>
    request(`/api/farms/${farmId}/ask`, {
      method: "POST",
      body: JSON.stringify({ question, language }),
    }),

  // ---- AI Selling Advisor ----
  getMarketAdvice: (crop, { quantity, farmId, storageCostPerDay } = {}) => {
    const params = new URLSearchParams({ crop });
    if (quantity) params.set("quantity", quantity);
    if (farmId) params.set("farm_id", farmId);
    if (storageCostPerDay !== undefined) params.set("storage_cost_per_day", storageCostPerDay);
    return request(`/api/market/advisor?${params.toString()}`);
  },

  simulateCropRoi: ({ crop, seedType, budget, acreage, farmId, language }) => {
    return request("/api/market/roi-simulator", {
      method: "POST",
      body: JSON.stringify({
        crop,
        seed_type: seedType,
        budget: Number(budget),
        acreage: Number(acreage),
        farm_id: farmId || null,
        language: language || "en",
      }),
    });
  },

  // ---- Medicine Assistant ----
  askMedicineAssistant: (question, crop, language = "en") =>
    request("/api/assistant/medicine", {
      method: "POST",
      body: JSON.stringify({ question, crop, language }),
    }),

  // ---- Disease Detection ----
  detectDisease: async ({ file, crop, userId, farmId, language = "en", lat, lon }) => {
    const form = new FormData();
    form.append("file", file);
    if (crop) form.append("crop", crop);
    if (userId) form.append("user_id", userId);
    if (farmId) form.append("farm_id", farmId);
    if (lat != null) form.append("lat", lat);
    if (lon != null) form.append("lon", lon);
    form.append("language", language);
    const res = await fetch(`${API_BASE}/api/disease/detect`, { method: "POST", body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  getDiseaseHistory: (userId) => request(`/api/disease/history?user_id=${userId}`),

  getDiseaseRadar: ({ crop, language = "en", farmId } = {}) => {
    const params = new URLSearchParams();
    if (crop) params.set("crop", crop);
    if (language) params.set("language", language);
    if (farmId) params.set("farm_id", farmId);
    return request(`/api/disease/radar?${params.toString()}`);
  },

  getCommunitySentinel: ({ radiusKm = 25, crop = "All", district = "Satara", farmId, language = "en" } = {}) => {
    const params = new URLSearchParams();
    params.set("radius_km", radiusKm);
    params.set("crop", crop);
    params.set("district", district);
    if (farmId) params.set("farm_id", farmId);
    params.set("language", language);
    return request(`/api/disease/sentinel?${params.toString()}`);
  },

  // ---- Service Hub ----
  getServiceCatalog: () => request("/api/services/catalog"),

  getDroneTask: ({ farmId, mode = "spot", totalAcres = 2.0 } = {}) => {
    const params = new URLSearchParams({ mode, total_acres: totalAcres });
    if (farmId) params.set("farm_id", farmId);
    return request(`/api/services/drone-task?${params.toString()}`);
  },

  createBooking: (data) =>
    request("/api/services/bookings", { method: "POST", body: JSON.stringify(data) }),

  listBookings: (userId) => request(`/api/services/bookings?user_id=${userId}`),

  getBooking: (bookingId) => request(`/api/services/bookings/${bookingId}`),

  getOperators: (params = {}) => {
    const query = new URLSearchParams();
    if (typeof params === "string") {
      if (params && params !== "all") query.set("category", params);
    } else if (params && typeof params === "object") {
      if (params.category && params.category !== "all") query.set("category", params.category);
      if (params.state) query.set("state", params.state);
      if (params.lat != null) query.set("lat", params.lat);
      if (params.lng != null) query.set("lng", params.lng);
      if (params.farm_id) query.set("farm_id", params.farm_id);
      if (params.radius_km != null) query.set("radius_km", params.radius_km);
    }
    return request(`/api/services/operators?${query.toString()}`);
  },

  dispatchOperator: (bookingId) =>
    request(`/api/services/bookings/${bookingId}/dispatch`, { method: "POST" }),

  uploadProof: (bookingId, data) => {
    let body;
    if (data instanceof FormData) {
      body = data;
    } else {
      body = new FormData();
      if (data.log_name) body.append("log_name", data.log_name);
      if (data.coverage_pct !== undefined) body.append("coverage_pct", data.coverage_pct);
      if (data.file) body.append("tlog_file", data.file);
    }
    return request(`/api/services/bookings/${bookingId}/proof-upload`, {
      method: "POST",
      body,
    });
  },

  createPaymentOrder: (data) =>
    request("/api/services/payment/order", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRazorpayKey: () => request("/api/services/payment/razorpay-key"),

  registerOperator: (data) =>
    request("/api/services/operators/register", { method: "POST", body: JSON.stringify(data) }),

  getPublicBooking: (bookingId) =>
    request(`/api/services/bookings/${bookingId}/public`),

  operatorAcceptJob: (bookingId, data) =>
    request(`/api/services/bookings/${bookingId}/operator-accept`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),

  getSampleTlogUrl: () => `${API_BASE}/api/services/sample-tlog`,

  // ---- Marketplace ----
  createListing: (data) =>
    request("/api/marketplace/listings", { method: "POST", body: JSON.stringify(data) }),

  browseListings: ({ crop, state } = {}) => {
    const params = new URLSearchParams();
    if (crop) params.set("crop", crop);
    if (state) params.set("state", state);
    const qs = params.toString();
    return request(`/api/marketplace/listings${qs ? `?${qs}` : ""}`);
  },

  myListings: (userId) => request(`/api/marketplace/listings/mine?user_id=${userId}`),

  closeListing: (listingId) =>
    request(`/api/marketplace/listings/${listingId}/close`, { method: "PATCH" }),

  sendOffer: (listingId, data) =>
    request(`/api/marketplace/listings/${listingId}/offers`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listingOffers: (listingId) => request(`/api/marketplace/listings/${listingId}/offers`),

  myOffers: (userId) => request(`/api/marketplace/offers/mine?user_id=${userId}`),

  receivedOffers: (userId) => request(`/api/marketplace/offers/received?user_id=${userId}`),

  updateOfferStatus: (offerId, status) =>
    request(`/api/marketplace/offers/${offerId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateFulfillment: (offerId, fulfillmentStatus) =>
    request(`/api/marketplace/offers/${offerId}/fulfillment`, {
      method: "PATCH",
      body: JSON.stringify({ fulfillment_status: fulfillmentStatus }),
    }),

  getEnamGatePass: (listingId) =>
    request(`/api/marketplace/listings/${listingId}/enam-gatepass`),

  depositB2bEscrow: (offerId, data) =>
    request(`/api/marketplace/offers/${offerId}/b2b-escrow`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  releaseB2bMilestone: (offerId, data) =>
    request(`/api/marketplace/offers/${offerId}/release-milestone`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  retireCarbonCredits: (farmId, data) =>
    request(`/api/farms/${farmId}/carbon/retire`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCarbonHistory: (farmId) =>
    request(`/api/farms/${farmId}/carbon-history`),

  verifyCarbonCertificate: (certId) =>
    request(`/api/farms/carbon/verify/${certId}`),

  verifyEnamGatePass: (gatePassId) =>
    request(`/api/marketplace/enam-gatepass/${gatePassId}/verify`),

  updateWeighbridge: (gatePassId, data) =>
    request(`/api/marketplace/enam-gatepass/${gatePassId}/weighbridge`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ---- Notifications ----
  getNotifications: (userId, role) =>
    request(`/api/notifications?user_id=${userId}&role=${role}`),
  getSoilProfile: (farmId) => request(`/api/farms/${farmId}/soil`), 
  getFarmMemory: (farmId) => request(`/api/farms/${farmId}/memory`), 
  getWeeklyReport: (farmId) => request(`/api/farms/${farmId}/report`), 
  simulateScenario: (farmId, scenario, language = "en") =>
    request(`/api/farms/${farmId}/simulate`, {
      method: "POST",
      body: JSON.stringify({ scenario, language }),
    }),

  predictYield: (farmId, data) =>
    request(`/api/farms/${farmId}/predict-yield`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getGovernmentSchemes: (data) =>
    request("/api/assistant/schemes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runAgent: (data) =>
    request("/api/agent/run", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getFarmAlerts: (farmId, language = "en") =>
    request(`/api/alerts/${farmId}?language=${language}`),

  getAlertConfigStatus: () => request("/api/alerts/config-status"),

  dispatchAlert: (data) =>
    request("/api/alerts/dispatch", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
