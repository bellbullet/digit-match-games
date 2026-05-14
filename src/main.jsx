import React from "react";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
      }}
    >
      <h1>Digit Match Game</h1>
      <button>Start</button>
    </div>
  );
}
