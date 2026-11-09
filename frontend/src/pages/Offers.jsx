import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";

const STATUS_BADGE = { pending: "badge-pending", accepted: "badge-accepted", rejected: "badge-rejected" };

export default function Offers({ user, role, onSwitchRole, onLogout, onLanguageChange }) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const FULFILLMENT_LABEL = { 
    awaiting_payment: t("inbox.awaiting_payment", "Awaiting Payment"), 
    escrow_secured: "Escrow Secured (ICICI Virtual Account)",
    paid: t("inbox.paid", "Paid"), 
    delivered: t("inbox.delivered", "Delivered") 
  };

  const userId = user?.id || user?._id || "";

  const load = () => {
    if (!userId) {
      setOffers([]);
      setLoading(false);
      return;
    }
    api
      .myOffers(userId)
      .then((res) => setOffers(Array.isArray(res) ? res : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const lockB2bEscrow = async (offerId) => {
    setBusyId(offerId);
    try {
      await api.depositB2bEscrow(offerId, { deposit_type: "20_pct_advance" });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const releaseMilestone = async (offerId) => {
    setBusyId(offerId);
    try {
      await api.releaseB2bMilestone(offerId, { milestone: "final_delivery" });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async (offerId) => {
    setBusyId(offerId);
    try {
      await api.updateFulfillment(offerId, "paid");
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell user={user} role={role} onSwitchRole={onSwitchRole} onLogout={onLogout} onLanguageChange={onLanguageChange} title={t("buyer.my_offers")} subtitle={t("offers_page.subtitle")}>
      {loading && <p style={{ color: "#6b6455" }}>{t("common.loading")}</p>}
      {!loading && offers.length === 0 && (
        <div className="card empty-state">
          <p>{t("offers_page.no_offers", "No offers sent yet. Browse the Marketplace to submit an offer!")}</p>
        </div>
      )}
      {!loading && offers.length > 0 && (
        <div className="card">
          {offers.map((o) => (
            <div className="list-row" key={o.id}>
              <div>
                <strong>{o.crop}{o.variety ? ` \u00b7 ${o.variety}` : ""}</strong>
                <div style={{ fontSize: "0.82rem", color: "#6b6455" }}>
                  {t("offers_page.your_offer")} &#8377;{o.offer_price} {o.quantity ? `${t("inbox.for_label")} ${o.quantity} ${o.unit || ""}` : ""} &middot; {t("inbox.farmer_label")}: {o.counterparty_name || "\u2013"}
                </div>
                {o.message && <div style={{ fontSize: "0.8rem", color: "#8a8272", marginTop: "0.2rem" }}>&ldquo;{o.message}&rdquo;</div>}
                {o.status === "accepted" && (
                  <div style={{ fontSize: "0.8rem", color: "var(--canopy)", marginTop: "0.3rem", fontWeight: 600 }}>
                    {FULFILLMENT_LABEL[o.fulfillment_status] || t("inbox.awaiting_payment")}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span className={`badge ${STATUS_BADGE[o.status] || "badge-pending"}`}>{o.status}</span>
                {o.status === "accepted" && o.fulfillment_status === "awaiting_payment" && (
                  <>
                    <button
                      className="btn-primary"
                      style={{ background: "#0284c7", borderColor: "#0369a1", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                      disabled={busyId === o.id}
                      onClick={() => lockB2bEscrow(o.id)}
                    >
                      🔒 Lock 20% B2B Escrow
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}
                      disabled={busyId === o.id}
                      onClick={() => markPaid(o.id)}
                    >
                      {t("offers_page.mark_paid")}
                    </button>
                  </>
                )}
                {o.status === "accepted" && o.fulfillment_status === "escrow_secured" && (
                  <>
                    <span style={{ fontSize: "0.78rem", background: "rgba(2, 132, 199, 0.12)", color: "#0369a1", padding: "0.3rem 0.6rem", borderRadius: "8px", fontWeight: 700 }}>
                      Virtual A/C: ICIC0000011-FTB2B{String(o.id).slice(0, 6).toUpperCase()}
                    </span>
                    <button
                      className="btn-primary"
                      style={{ background: "#16a34a", borderColor: "#15803d", fontSize: "0.82rem", whiteSpace: "nowrap" }}
                      disabled={busyId === o.id}
                      onClick={() => releaseMilestone(o.id)}
                    >
                      Release 80% Final Payout
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
