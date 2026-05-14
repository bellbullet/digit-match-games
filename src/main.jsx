import React, { useState, useEffect, useRef } from "react";

const DIGITS = 3;
const HISTORY_SIZE = 20;
const TIME_ATTACK_SEC = 30;

const rnd = () =>
  Array.from({ length: DIGITS }, () => Math.floor(Math.random() * 10));

const rndHistory = () =>
  Array.from({ length: HISTORY_SIZE }, () => rnd());

const str3 = (d) => d.join("");

function minDist(from, to) {
  return from.reduce((s, v, i) => {
    const d = Math.abs(v - to[i]);
    return s + Math.min(d, 10 - d);
  }, 0);
}

function gradeColor(eff) {
  if (eff >= 100) return "#00ff88";
  if (eff >= 80) return "#aaff44";
  if (eff >= 60) return "#ffdd00";
  if (eff >= 40) return "#ff9900";
  return "#ff4444";
}

function gradeLabel(eff) {
  if (eff >= 100) return "S";
  if (eff >= 80) return "A";
  if (eff >= 60) return "B";
  if (eff >= 40) return "C";
  return "D";
}

function DigitDisplay({ value, color, glow }) {
  return (
    <div
      style={{
        width: 56,
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 40,
        fontWeight: 900,
        color,
        background: "rgba(0,0,0,0.5)",
        border: `2px solid ${color}`,
        borderRadius: 6,
        boxShadow: glow
          ? `0 0 14px ${color}, inset 0 0 10px rgba(0,0,0,0.5)`
          : "none",
        fontFamily: "'Courier New', monospace",
        textShadow: glow ? `0 0 12px ${color}` : "none",
        transition: "all 0.12s",
        userSelect: "none",
      }}
    >
      {value}
    </div>
  );
}

function ArcadeBtn({ label, onClick, color, disabled }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => {
        setPressed(false);
        onClick && onClick();
      }}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: 56,
        height: 28,
        background: disabled ? "#222" : pressed ? color : `${color}33`,
        border: `1px solid ${disabled ? "#333" : color}`,
        borderRadius: 4,
        color: disabled ? "#444" : pressed ? "#000" : color,
        fontSize: 14,
        fontWeight: "bold",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.08s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: pressed && !disabled ? `0 0 8px ${color}` : "none",
        fontFamily: "monospace",
      }}
    >
      {label}
    </button>
  );
}

export default function App() {
  const [target, setTarget] = useState(rnd);
  const [current, setCurrent] = useState(() => Array(DIGITS).fill(0));
  const [history, setHistory] = useState(rndHistory);
  const [moves, setMoves] = useState(0);
  const [wave, setWave] = useState(1);

  const [flash, setFlash] = useState(false);
  const [justMatched, setJustMatched] = useState(false);

  const [taState, setTaState] = useState("idle");
  const [taTime, setTaTime] = useState(TIME_ATTACK_SEC);

  const timerRef = useRef(null);

  const isMatch = current.every((d, i) => d === target[i]);
  const optFrom000 = minDist(Array(DIGITS).fill(0), target);

  const trueOptimal = optFrom000;
  const efficiency =
    moves === 0
      ? 100
      : Math.min(
          100,
          Math.round((trueOptimal / Math.max(moves, 1)) * 100)
        );

  useEffect(() => {
    if (isMatch && !justMatched) {
      setJustMatched(true);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    }
    if (!isMatch) setJustMatched(false);
  }, [isMatch, justMatched]);

  useEffect(() => {
    if (taState === "running") {
      timerRef.current = setInterval(() => {
        setTaTime((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setTaState("done");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [taState]);

  function adjust(idx, delta) {
    setCurrent((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] + delta + 10) % 10;
      return next;
    });
    setMoves((m) => m + 1);
  }

  function confirm() {
    if (!isMatch) return;

    setHistory((prev) => [...prev.slice(1), [...current]]);
    setTarget(rnd());
    setCurrent(Array(DIGITS).fill(0));
    setMoves(0);
    setWave((w) => w + 1);
    setJustMatched(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Courier New', monospace",
        padding: 20,
      }}
    >
      <h1 style={{ color: "#00ff88" }}>DIGIT MATCH</h1>

      <p>Wave {wave}</p>
      <p>Timer: {taState === "running" ? taTime : "--"}</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {target.map((d, i) => (
          <DigitDisplay key={i} value={d} color="#ff3355" glow />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {current.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArcadeBtn
              label="＋"
              color="#00cc66"
              onClick={() => adjust(i, 1)}
            />
            <DigitDisplay
              value={d}
              color={d === target[i] ? "#00ff88" : "#00cc66"}
              glow={d === target[i]}
            />
            <ArcadeBtn
              label="－"
              color="#00cc66"
              onClick={() => adjust(i, -1)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={confirm}
        disabled={!isMatch}
        style={{
          marginTop: 24,
          padding: "12px 24px",
          background: isMatch ? "#0066ff" : "#222",
          border: "none",
          borderRadius: 8,
          color: "white",
          fontWeight: "bold",
          cursor: isMatch ? "pointer" : "default",
        }}
      >
        決定
      </button>

      <p style={{ marginTop: 16 }}>Moves: {moves}</p>
      <p>Efficiency: {moves === 0 ? "--" : `${efficiency}%`}</p>
    </div>
  );
}
