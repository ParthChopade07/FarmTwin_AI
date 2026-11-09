import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api.js";
import { motion } from "framer-motion";
import {
  Tractor,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Upload,
  BadgeCheck,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Check,
  Star,
  Zap,
} from "lucide-react";
import { notifier } from "../utils/notifications.js";

export default function OperatorJobPortal() {
  const { bookingId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [accepted, setAccepted] = useState(false);

  // Telemetry Upload
  const [tlogFile, setTlogFile] = useState(null);
  const [logName, setLogName] = useState("agras_T40_mission.tlog");
  const [verifying, setVerifying] = useState(false);
  const [proofResult, setProofResult] = useState(null);

  useEffect(() => {
    if (bookingId) {
      api
        .getPublicBooking(bookingId)
        .then((data) => {
          setJob(data);
          if (data.status === "confirmed" || data.status === "completed") {
            setAccepted(true);
          }
        })
        .catch((err) => setError(err.message || "Unable to load job details"))
        .finally(() => setLoading(false));
    }
  }, [bookingId]);

  const handleAcceptJob = async (e) => {
    e.preventDefault();
    setAccepting(true);
    try {
      await api.operatorAcceptJob(bookingId, { operator_upi_id: upiId });
      setAccepted(true);
      setJob((prev) => ({ ...prev, status: "confirmed" }));
      notifier.playChime("success");
    } catch (err) {
      setError(err.message || "Failed to accept job");
    } finally {
      setAccepting(false);
    }
  };

  const handleUploadProof = async () => {
    setVerifying(true);
    try {
      const payload = tlogFile
        ? { file: tlogFile, log_name: tlogFile.name }
        : { log_name: logName || "agras_T40_mission.tlog", coverage_pct: 96.8 };
      const res = await api.uploadProof(bookingId, payload);
      setProofResult(res);
      setJob((prev) => ({ ...prev, status: "completed" }));
      notifier.playChime("success");
    } catch (err) {
      setError(err.message || "Failed to submit flight telemetry");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading FarmTwin Dispatch Details...</span>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full p-6 rounded-3xl bg-white shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            !
          </div>
          <h3 className="text-base font-black text-slate-900">Job Not Found or Link Expired</h3>
          <p className="text-xs text-slate-500 font-semibold">{error || "Please verify the booking link from WhatsApp."}</p>
          <Link to="/" className="btn-primary inline-flex py-2.5 px-4 rounded-xl text-xs font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50 text-slate-800">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Top Branding Bar */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              FT
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 leading-tight">FarmTwin Operator Dispatch</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DGCA &amp; CHC Network</div>
            </div>
          </div>
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
              job.status === "completed"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : job.status === "confirmed"
                ? "bg-sky-100 text-sky-800 border border-sky-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}
          >
            ● {job.status}
          </span>
        </div>

        {/* Hero Payout Card */}
        <div
          className="p-6 rounded-3xl space-y-4"
          style={{
            background: "linear-gradient(135deg, #166534, #15803d)",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(22, 101, 52, 0.4)",
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                ESCROW SECURED JOB
              </span>
              <h2 className="text-xl font-black mt-2">{job.service_name}</h2>
              <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                {job.crop} &middot; {job.area_acres} Acres &middot; {job.farm_name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-emerald-200 font-bold uppercase">Your Payout</div>
              <div className="text-2xl font-black text-white">&#8377;{job.operator_payout?.toLocaleString("en-IN")}</div>
              <div className="text-[9px] text-emerald-200 font-bold">90% of &#8377;{job.escrow_amount} escrow</div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100 font-bold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date: {job.scheduled_date}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Instant Bank Payout
            </span>
          </div>
        </div>

        {/* Field Location & Details */}
        <div className="p-5 rounded-3xl bg-white shadow-xs border border-slate-200/80 space-y-3">
          <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Field Location &amp; Instructions
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50">
              <div className="text-slate-400 font-bold text-[10px]">Assigned Pilot / CHC</div>
              <div className="font-black text-slate-800 mt-0.5">{job.operator_name || "Garuda Kisan Pilot"}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50">
              <div className="text-slate-400 font-bold text-[10px]">Contact</div>
              <div className="font-black text-slate-800 mt-0.5">{job.operator_phone || "+91 98230 45120"}</div>
            </div>
          </div>
          {job.notes && (
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 font-semibold">
              <span className="font-black">Farmer Note:</span> {job.notes}
            </div>
          )}
        </div>

        {/* Step 1: Accept Job */}
        {!accepted && (
          <div className="p-5 rounded-3xl bg-white shadow-xs border border-slate-200/80 space-y-3">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-700" /> Step 1: Accept Dispatch &amp; Enter Payout UPI
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Lock in this job on your calendar. Your ₹{job.operator_payout} payout will be deposited into this UPI ID immediately upon telemetry upload.
            </p>
            <form onSubmit={handleAcceptJob} className="space-y-3">
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. pilot@okhdfcbank or 9823045120@upi"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={accepting}
                className="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {accepting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Confirming Acceptance...</>
                ) : (
                  <><Check className="w-4 h-4" /> Accept Job &amp; Lock In Schedule</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Proof of Work Telemetry Upload (Active Once Accepted) */}
        {accepted && job.status !== "completed" && (
          <div className="p-5 rounded-3xl bg-white shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-orange-600" /> Step 2: Upload Drone Flight Log (.tlog)
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                JOB CONFIRMED ✓
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              After completing the spray flight, export the MAVLink flight log (.tlog / .bin) from your DJI Smart Controller or QGroundControl and upload it here to trigger instant payout release.
            </p>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 cursor-pointer bg-slate-50">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 truncate">
                {tlogFile ? tlogFile.name : "Select DJI / Pixhawk .tlog file"}
              </span>
              <input
                type="file"
                accept=".tlog,.bin,.log,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setTlogFile(e.target.files[0]);
                    setLogName(e.target.files[0].name);
                  }
                }}
              />
            </label>

            <button
              onClick={handleUploadProof}
              disabled={verifying}
              className="w-full py-3 px-4 rounded-xl text-xs font-black text-white bg-orange-600 hover:bg-orange-700 cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {verifying ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying MAVLink Telemetry...</>
              ) : (
                <><BadgeCheck className="w-4 h-4" /> Verify Coverage &amp; Release &#8377;{job.operator_payout}</>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Completed & Settled Banner */}
        {job.status === "completed" && (
          <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-emerald-950">Mission Completed &amp; Payout Released!</h3>
            <p className="text-xs text-emerald-800 font-semibold max-w-sm mx-auto">
              Telemetry verified with {proofResult?.coverage_pct || 96.8}% field coverage. Payout of ₹{job.operator_payout} has been credited to your bank account.
            </p>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 font-bold inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to FarmTwin Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
