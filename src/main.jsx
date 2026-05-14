import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a, #020617)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "48px",
          marginBottom: "20px",
          color: "#38bdf8",
          textShadow: "0 0 20px rgba(56,189,248,0.8)",
        }}
      >
        Digit Match Game
      </h1>

      <p style={{ marginBottom: "20px", fontSize: "18px", color: "#cbd5e1" }}>
        動作確認OK。次はゲーム化できる！
      </p>

      <button
        onClick={() => setCount(count + 1)}
        style={{
          padding: "14px 28px",
          fontSize: "20px",
          border: "none",
          borderRadius: "12px",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(37,99,235,0.5)",
        }}
      >
        Count: {count}
      </button>
    </div>
  );
}
