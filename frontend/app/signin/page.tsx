"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signin(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign In</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onFocus={() => setError("")}
              required
              style={{
                ...styles.input,
                borderColor: error && !email ? "#e74c3c" : "#e0e0e0",
              }}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onFocus={() => setError("")}
              required
              style={{
                ...styles.input,
                borderColor: error && !password ? "#e74c3c" : "#e0e0e0",
              }}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#5568d3";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "#667eea";
              }
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link href="/signup" style={styles.link}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "40px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
    maxWidth: "400px",
    width: "100%",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "32px",
    color: "#333",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#555",
  },
  input: {
    padding: "12px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "all 0.3s",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    textAlign: "center",
  },
  button: {
    padding: "12px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
    width: "100%",
    opacity: 1,
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "14px",
    color: "#666",
  },
  link: {
    color: "#667eea",
    fontWeight: "600",
  },
};
