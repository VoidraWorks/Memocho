import React, { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-opener";
import { tokenStore } from "../services/api";
import { useAuthStore } from "../stores/authStore";

// ─── Google brand icon (inline SVG) ──────────────────────────────────────────
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// ─── Floating particle dots ───────────────────────────────────────────────────
const Particle: React.FC<{
  style: React.CSSProperties;
}> = ({ style }) => (
  <span
    className="landing-particle"
    style={style}
  />
);

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 6}s`,
    animationDuration: `${Math.random() * 8 + 6}s`,
    opacity: Math.random() * 0.4 + 0.15,
  } as React.CSSProperties,
}));

// ─── Feature badge ────────────────────────────────────────────────────────────
const FeatureBadge: React.FC<{ emoji: string; label: string }> = ({ emoji, label }) => (
  <div className="landing-badge">
    <span>{emoji}</span>
    <span>{label}</span>
  </div>
);

// ─── Main landing page ────────────────────────────────────────────────────────
interface LandingPageProps {
  onGoogleAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoogleAuth }) => {
  const [isHoveringGoogle, setIsHoveringGoogle] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      // Open the Google OAuth URL in the system browser.
      // The backend handles the OAuth callback and issues tokens.
      const API_BASE =
        (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";
      await open(`${API_BASE}/api/auth/google`);
      // The deep-link / polling mechanism will complete sign-in.
      // For now, we call onGoogleAuth to indicate the flow was initiated.
      onGoogleAuth();
    } catch {
      // Silently handle opener errors
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="landing-root">
      {/* Background */}
      <div className="landing-bg" />
      <div className="landing-overlay" />

      {/* Glow orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <Particle key={p.id} style={p.style} />
      ))}

      {/* Content */}
      <div className={`landing-content ${mounted ? "landing-content--in" : ""}`}>

        {/* Logo / brand mark */}
        <div className="landing-logo-wrap">
          <div className="landing-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="10" fill="url(#logo-grad)" />
              <path
                d="M8 10h16M8 16h12M8 22h10"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="hsl(240, 70%, 65%)" />
                  <stop offset="1" stopColor="hsl(270, 60%, 55%)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="landing-logo-name">Memocho</span>
        </div>

        {/* Headline */}
        <div className="landing-headline-wrap">
          <h1 className="landing-headline">
            Your thoughts,
            <br />
            <span className="landing-headline-accent">always within reach</span>
          </h1>
          <p className="landing-subline">
            A beautiful, distraction-free workspace for notes and tasks —<br />
            right on your desktop, always in sync.
          </p>
        </div>

        {/* Auth card */}
        <div className="landing-card">
          <button
            id="google-signin-btn"
            className={`landing-google-btn ${isHoveringGoogle ? "landing-google-btn--hover" : ""} ${googleLoading ? "landing-google-btn--loading" : ""}`}
            onClick={handleGoogleClick}
            onMouseEnter={() => setIsHoveringGoogle(true)}
            onMouseLeave={() => setIsHoveringGoogle(false)}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <span className="landing-spinner" />
            ) : (
              <GoogleIcon size={20} />
            )}
            <span>
              {googleLoading ? "Opening browser…" : "Continue with Google"}
            </span>
          </button>

          <div className="landing-divider">
            <span>Secure OAuth 2.0 · No password needed</span>
          </div>

          <p className="landing-legal">
            By continuing you agree to our{" "}
            <button
              className="landing-link"
              onClick={() =>
                open("https://memocho.app/terms").catch(() => null)
              }
            >
              Terms
            </button>{" "}
            and{" "}
            <button
              className="landing-link"
              onClick={() =>
                open("https://memocho.app/privacy").catch(() => null)
              }
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        {/* Feature badges */}
        <div className="landing-badges">
          <FeatureBadge emoji="📝" label="Rich notes" />
          <FeatureBadge emoji="✅" label="Task lists" />
          <FeatureBadge emoji="☁️" label="Cloud sync" />
          <FeatureBadge emoji="🔒" label="End-to-end secure" />
        </div>
      </div>
    </div>
  );
};
