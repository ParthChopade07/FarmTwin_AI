import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "../i18n.js";
import { api } from "../services/api.js";

const FARM_BG = "/farm-bg.jpg";

const S = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Nunito', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    backgroundColor: "#ddeadd",
  },
  left: {
    flex: "1 1 50%",
    position: "relative",
    background: `linear-gradient(to bottom, rgba(11, 41, 31, 0.45) 0%, rgba(6, 25, 19, 0.65) 100%), url(${FARM_BG}) center/cover no-repeat`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "3.5rem 4rem",
    color: "#fff",
    boxSizing: "border-box",
    borderRadius: "0 32px 32px 0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "1.45rem",
    fontWeight: 900,
    letterSpacing: "-0.5px",
    fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif",
  },
  logoLeaf: {
    width: "36px",
    height: "36px",
    backgroundColor: "#ffffff",
    color: "#1a4a2e",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "4px 4px 12px rgba(0,0,0,0.25), -2px -2px 8px rgba(255,255,255,0.15)",
  },
  logoAi: {
    fontSize: "0.85rem",
    opacity: 0.85,
    fontWeight: 800,
    marginLeft: "4px",
    color: "#a8dfb8",
    verticalAlign: "super",
  },
  leftContent: {
    marginTop: "auto",
    marginBottom: "auto",
  },
  tagline: {
    textTransform: "uppercase",
    letterSpacing: "2.5px",
    fontSize: "0.78rem",
    fontWeight: 800,
    color: "#a8dfb8",
    marginBottom: "1.5rem",
  },
  headline: {
    fontSize: "4.2rem",
    fontWeight: 900,
    lineHeight: 1.05,
    marginBottom: "1.5rem",
    letterSpacing: "-1.5px",
    fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif",
    color: "#ffffff",
  },
  headlineGreen: {
    color: "#a8dfb8",
  },
  subtext: {
    fontSize: "1.05rem",
    lineHeight: 1.6,
    color: "#e2ebd9",
    maxWidth: "88%",
  },
  footer: {
    fontSize: "0.85rem",
    color: "#d1e2d6",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
  },
  right: {
    flex: "1 1 50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddeadd",
    padding: "2rem",
    boxSizing: "border-box",
  },
  formBox: {
    width: "100%",
    maxWidth: "440px",
    background: "#e4ede4",
    borderRadius: "28px",
    padding: "2.5rem",
    boxShadow: "12px 12px 30px #b8ccb8, -12px -12px 30px #ffffff",
  },
  welcome: {
    textTransform: "uppercase",
    letterSpacing: "2.5px",
    fontSize: "0.75rem",
    color: "#4e7060",
    marginBottom: "0.8rem",
    fontWeight: 800,
  },
  rightHeading: {
    fontSize: "2.5rem",
    fontWeight: 900,
    color: "#1a3d2b",
    marginBottom: "0.5rem",
    letterSpacing: "-0.8px",
    fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif",
  },
  rightSub: {
    fontSize: "1.02rem",
    color: "#4e7060",
    marginBottom: "2.2rem",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "1.1rem",
    border: "none",
    borderRadius: "16px",
    fontSize: "0.92rem",
    backgroundColor: "#e4ede4",
    boxShadow: "inset 4px 4px 10px #b8ccb8, inset -4px -4px 10px #ffffff",
    boxSizing: "border-box",
    color: "#1a3d2b",
    outline: "none",
    transition: "box-shadow 0.2s",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 600,
  },
  inputRow: {
    display: "flex",
    gap: "1rem",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #1e5c38, #2d7a4f)",
    color: "#ffffff",
    border: "none",
    borderRadius: "16px",
    fontSize: "0.98rem",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "0.5rem",
    transition: "all 0.2s ease",
    boxShadow: "5px 5px 14px #b8ccb8, -3px -3px 10px #ffffff, 0 4px 16px rgba(45,122,79,0.3)",
    fontFamily: "'Nunito', sans-serif",
  },
  demoButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#e4ede4",
    color: "#2d7a4f",
    border: "none",
    borderRadius: "16px",
    fontSize: "0.88rem",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    marginTop: "1.2rem",
    transition: "all 0.2s ease",
    boxShadow: "5px 5px 14px #b8ccb8, -5px -5px 14px #ffffff",
    fontFamily: "'Nunito', sans-serif",
  },
  link: {
    display: "block",
    textAlign: "center",
    marginTop: "1.4rem",
    fontSize: "0.88rem",
    color: "#2d7a4f",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
  },
  toggleRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "1.2rem",
  },
  toggleBtn: (active) => ({
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "16px",
    background: "#e4ede4",
    color: active ? "#1a3d2b" : "#4e7060",
    fontWeight: active ? 900 : 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: active
      ? "inset 4px 4px 10px #b8ccb8, inset -4px -4px 10px #ffffff"
      : "5px 5px 14px #b8ccb8, -5px -5px 14px #ffffff",
    transition: "all 0.2s ease",
    fontFamily: "'Nunito', sans-serif",
  }),
};

export default function Login({ onLogin }) {
  const { t } = useTranslation();

  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("en");
  const [role, setRole] = useState("farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleFillDemo = () => {
    setEmail("admin@farmtwin.ai");
    setPassword("farmtwin123");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      let user;
      if (mode === "signin") {
        user = await api.loginUser({ email, phone, password });
      } else {
        user = await api.createUser({
          name: name || email.split("@")[0],
          phone,
          email,
          password,
          district,
          state,
          language,
          role,
        });
      }
      onLogin(user, role);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.shell}>
      {/* ══ LEFT PANEL ══ */}
      <div style={S.left}>
        <div style={S.logo}>
          <div style={S.logoLeaf}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
          </div>
          FarmTwin <span style={S.logoAi}>AI</span>
        </div>

        <div style={S.leftContent}>
          <div style={S.tagline}>Climate-Resilient Precision Farming</div>
          <div style={S.headline}>
            Know your field.<br />
            <span style={S.headlineGreen}>Grow with</span><br />
            <span style={S.headlineGreen}>confidence.</span>
          </div>
          <div style={S.subtext}>
            A calmer way to read weather, soil, crop health, and risk<br />in one living digital twin.
          </div>
        </div>

        <div style={S.footer}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
          Built for the seasons ahead
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div style={S.right}>
        <div style={S.formBox}>
          {mode === "signin" ? (
            <>
              <div style={S.welcome}>Welcome Back</div>
              <div style={S.rightHeading}>Your field is waiting.</div>
              <div style={S.rightSub}>Sign in to continue your FarmTwin journey.</div>

              <form onSubmit={handleSubmit}>
                <input
                  style={S.input}
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  style={S.input}
                  type="password"
                  placeholder="Password (6+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: "-0.5rem", marginBottom: "1rem", fontWeight: 600 }}>{error}</p>}

                <button type="submit" style={S.button} disabled={loading}>
                  {loading ? t("login.signingin") : <>Enter my farm <span style={{ marginLeft: "4px" }}>↗</span></>}
                </button>
              </form>

              <button type="button" onClick={handleFillDemo} style={S.demoButton}>
                ⚡ Demo Access (Auto-fill)
              </button>

              <div style={S.link} onClick={() => { setMode("register"); setError(""); }}>
                New to FarmTwin? Create an account
              </div>
            </>
          ) : (
            <>
              <div style={S.welcome}>Create Account</div>
              <div style={S.rightHeading}>Join FarmTwin.</div>
              <div style={S.rightSub}>Set up your farm profile to get started.</div>

              <form onSubmit={handleSubmit}>
                <select
                  style={{ ...S.input, appearance: 'auto', cursor: 'pointer' }}
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="en">🌐 English</option>
                  <option value="hi">🌐 हिन्दी (Hindi)</option>
                  <option value="mr">🌐 मराठी (Marathi)</option>
                </select>

                <input
                  style={S.input}
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div style={S.inputRow}>
                  <input
                    style={{ ...S.input, flex: 1 }}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    style={{ ...S.input, flex: 1 }}
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <input
                  style={S.input}
                  type="password"
                  placeholder="Password (6+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <div style={S.inputRow}>
                  <input style={{ ...S.input, flex: 1 }} placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
                  <input style={{ ...S.input, flex: 1 }} placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} required />
                </div>

                <div style={S.toggleRow}>
                  <button type="button" style={S.toggleBtn(role === "farmer")} onClick={() => setRole("farmer")}>
                    🌾 {t("login.farmer")}
                  </button>
                  <button type="button" style={S.toggleBtn(role === "buyer")} onClick={() => setRole("buyer")}>
                    🛒 {t("login.buyer")}
                  </button>
                </div>

                {error && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: "-0.5rem", marginBottom: "1rem", fontWeight: 600 }}>{error}</p>}

                <button type="submit" style={S.button} disabled={loading}>
                  {loading ? t("login.signingin") : <>{t("login.continue")} <span style={{ marginLeft: "4px" }}>↗</span></>}
                </button>
              </form>

              <div style={S.link} onClick={() => { setMode("signin"); setError(""); }}>
                Already have an account? Sign in
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
