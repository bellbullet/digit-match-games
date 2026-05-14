import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "red",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "sans-serif"
      }}
    >
      <h1>Vercel Test Success</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
