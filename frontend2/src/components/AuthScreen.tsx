import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  BadgeCheck,
  Building,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Recycle,
  Eye,
  EyeOff
} from "lucide-react";
import { authService } from "../services/authService";
import { AuthUser, UserRole } from "../types/auth";

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<UserRole>("identifier");

  // Form Fields
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [facilityZone, setFacilityZone] = useState<string>("Zone 4 Sorting Depot");
  const [authCode, setAuthCode] = useState<string>("IDENTIFIER-2026");

  // Status
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick Demo Logins
  const handleQuickDemo = (demoEmail: string, demoPass: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setRole(demoRole);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { user } = await authService.login({
          email: email.trim(),
          password: password.trim(),
          role,
        });
        setSuccessMessage(`Welcome back, ${user.profile?.firstName || user.username}!`);
        setTimeout(() => onLoginSuccess(user), 600);
      } else {
        // Validation for Signup
        if (!username || !email || !password || !firstName) {
          throw new Error("Please complete all required fields");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const { user } = await authService.register({
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          authCode: authCode.trim(),
          profile: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            facilityZone: facilityZone.trim(),
            zone: facilityZone.includes("Zone") ? facilityZone : "Central Processing",
          },
        });

        setSuccessMessage(`Identifier Account registered successfully!`);
        setTimeout(() => onLoginSuccess(user), 700);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Authentication error. Please check credentials.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background aesthetics */}
      <div className="auth-card glass-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <ShieldCheck size={32} color="#16a34a" />
          </div>
          <h1 className="auth-title">WasteWise Identifier Portal</h1>
          <p className="auth-subtitle">
            Restricted AI Studio for Certified Waste Verification Officers & Municipal Admins
          </p>

          <div className="role-restriction-banner">
            <Lock size={13} style={{ display: "inline", marginRight: 5 }} />
            <span>Authorized Access Only • TACO Classification Engine v2.1</span>
          </div>
        </div>

        {/* Mode & Role Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
          >
            Identifier Login
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
          >
            New Officer Certification
          </button>
        </div>

        {/* Role Selector Pills */}
        <div className="auth-role-pills">
          <button
            type="button"
            className={`auth-role-pill ${role === "identifier" ? "active" : ""}`}
            onClick={() => {
              setRole("identifier");
              if (mode === "signup") setAuthCode("IDENTIFIER-2026");
            }}
          >
            <BadgeCheck size={15} />
            <span>Waste Identifier</span>
          </button>
          <button
            type="button"
            className={`auth-role-pill admin ${role === "admin" ? "active" : ""}`}
            onClick={() => {
              setRole("admin");
              if (mode === "signup") setAuthCode("MCD-ADMIN-2026");
            }}
          >
            <ShieldCheck size={15} />
            <span>Municipal Admin</span>
          </button>
        </div>

        {/* One-Click Demo Logins */}
        {mode === "login" && (
          <div className="quick-demo-box">
            <div className="quick-demo-title">
              <Sparkles size={13} /> Quick Fill Demo Credentials:
            </div>
            <div className="quick-demo-buttons">
              <button
                type="button"
                className="quick-demo-btn"
                onClick={() => handleQuickDemo("identifier@wastewise.com", "identifier123", "identifier")}
              >
                ⚡ Officer Vikram (ID-7842)
              </button>
              <button
                type="button"
                className="quick-demo-btn"
                onClick={() => handleQuickDemo("verifier@wastewise.com", "identifier123", "identifier")}
              >
                ⚡ Verifier Ananya (Lab)
              </button>
              <button
                type="button"
                className="quick-demo-btn admin"
                onClick={() => handleQuickDemo("admin@wastewise.com", "admin123", "admin")}
              >
                ⚡ MCD Admin HQ
              </button>
            </div>
          </div>
        )}

        {/* Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="auth-alert error"
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="auth-alert success"
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="auth-input-group">
                  <label className="auth-label">First Name *</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-icon" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Last Name</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-icon" />
                    <input
                      type="text"
                      placeholder="e.g. Das"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Username *</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. verifier_vikram"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Sorting Depot / Facility Zone</label>
                <div className="auth-input-wrapper">
                  <Building size={16} className="auth-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Zone 4 Waste Recovery Facility"
                    value={facilityZone}
                    onChange={(e) => setFacilityZone(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="auth-input-group">
            <label className="auth-label">Official Email Address *</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-icon" />
              <input
                type="email"
                required
                placeholder="e.g. identifier@wastewise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label className="auth-label">Password *</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-eye-btn"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Authorization Security Passcode (Signup only) */}
          {mode === "signup" && (
            <div className="auth-input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="auth-label">
                  {role === "identifier" ? "Identifier Authorization Passcode *" : "Admin Security Key *"}
                </label>
                <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 600 }}>
                  Valid: {role === "identifier" ? "IDENTIFIER-2026" : "MCD-ADMIN-2026"}
                </span>
              </div>
              <div className="auth-input-wrapper">
                <KeyRound size={16} className="auth-icon" />
                <input
                  type="text"
                  required
                  placeholder={role === "identifier" ? "IDENTIFIER-2026" : "MCD-ADMIN-2026"}
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="auth-input mono"
                />
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>
                Ensures only certified municipal waste sorting officers can create an Identifier profile.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary auth-submit-btn"
          >
            {loading ? (
              <span>Verifying Credentials...</span>
            ) : mode === "login" ? (
              <>
                <span>Enter WasteWise Identifier Studio</span>
                <ArrowRight size={17} />
              </>
            ) : (
              <>
                <span>Register & Issue Identifier Badge</span>
                <BadgeCheck size={17} />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="auth-footer">
          <p>
            {mode === "login" ? "Need official identifier certification?" : "Already registered as an identifier?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setErrorMessage(null);
              }}
              className="auth-toggle-link"
            >
              {mode === "login" ? "Apply for Certification" : "Sign in to your account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
