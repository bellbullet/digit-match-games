import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  const [target] = useState(
    () => Math.floor(Math.random() * 900 + 100)
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020617, #0f172a)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "52px",
          marginBottom: "10px",
          color: "#38bdf8",
          textShadow: "0 0 18px rgba(56,189,248,0.7)",
        }}
      >
        Digit Match Game
      </h1>

      <p
        style={{
          fontSize: "22px",
          marginBottom: "30px",
          color: "#cbd5e1",
        }}
      >
        Target Number
      </p>

      <div
        style={{
          fontSize: "64px",
          fontWeight: "bold",
          letterSpacing: "12px",
          background: "rgba(255,255,255,0.08)",
          padding: "24px 36px",
          borderRadius: "18px",
          border: "2px solid #38bdf8",
          boxShadow: "0 0 25px rgba(56,189,248,0.25)",
          marginBottom: "30px",
        }}
      >
        {target}
      </div>

      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: "16px 32px",
          fontSize: "22px",
          fontWeight: "bold",
          border: "none",
          borderRadius: "14px",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(37,99,235,0.4)",
          transition: "0.2s",
        }}
      >
        Moves: {count}
      </button>
    </div>
  );
}
