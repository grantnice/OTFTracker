"use client";

import { useState } from "react";

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onLogin();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAFAF8" }}
    >
      <div className="w-full max-w-sm">
        <div
          className="rounded-lg p-8"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E6E3",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ background: "#E55A1B" }}
            >
              <span className="text-white font-bold text-lg">OT</span>
            </div>
            <h1 className="text-xl font-semibold" style={{ color: "#1A1A1A" }}>
              OTF Tracker
            </h1>
            <p className="text-sm mt-1" style={{ color: "#8A8A8A" }}>
              Enter password to view your stats
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E6E3",
                color: "#1A1A1A",
              }}
              autoFocus
            />

            {error && (
              <p className="mt-2 text-sm" style={{ color: "#C53D3D" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full mt-4 px-4 py-3 rounded-lg text-white font-medium transition-opacity disabled:opacity-50"
              style={{ background: "#E55A1B" }}
            >
              {loading ? "Checking..." : "Enter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
