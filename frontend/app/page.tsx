"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, loading, signout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome!</h1>
        <div style={styles.userInfo}>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          {user.name && (
            <p>
              <strong>Name:</strong> {user.name}
            </p>
          )}
          <p>
            <strong>ID:</strong> {user.id}
          </p>
        </div>
        <button onClick={signout} style={styles.button}>
          Sign Out
        </button>
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
    maxWidth: "500px",
    width: "100%",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "24px",
    color: "#333",
    textAlign: "center",
  },
  userInfo: {
    background: "#f7f7f7",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "24px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.3s",
  },
};
