import React from "react";
import ReactDOM from "react-dom/client";

function Test() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "40px",
      }}
    >
      MAIN TEST
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Test />
  </React.StrictMode>
);
