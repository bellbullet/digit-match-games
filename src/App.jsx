import { useState, useEffect, useRef } from “react”;

const DIGITS = 3;
const HISTORY_SIZE = 20;
const TIME_ATTACK_SEC = 30;

const rnd = () => Array.from({ length: DIGITS }, () => Math.floor(Math.random() * 10));
const rndHistory = () => Array.from({ length: HISTORY_SIZE }, () => rnd());
const str3 = (d) => d.join(””);

function minDist(from, to) {
return from.reduce((s, v, i) => {
const d = Math.abs(v - to[i]);
return s + Math.min(d, 10 - d);
}, 0);
}

function gradeColor(eff) {
if (eff >= 100) return “#00ff88”;
if (eff >= 80)  return “#aaff44”;
if (eff >= 60)  return “#ffdd00”;
if (eff >= 40)  return “#ff9900”;
return “#ff4444”;
}
function gradeLabel(eff) {
if (eff >= 100) return “S”;
if (eff >= 80)  return “A”;
if (eff >= 60)  return “B”;
if (eff >= 40)  return “C”;
return “D”;
}

function DigitDisplay({ value, color, glow }) {
return (
<div style={{
width: 56, height: 72,
display: “flex”, alignItems: “center”, justifyContent: “center”,
fontSize: 40, fontWeight: 900, color,
background: “rgba(0,0,0,0.5)”,
border: `2px solid ${color}`,
borderRadius: 6,
boxShadow: glow ? `0 0 14px ${color}, inset 0 0 10px rgba(0,0,0,0.5)` : “none”,
fontFamily: “‘Courier New’, monospace”,
textShadow: glow ? `0 0 12px ${color}` : “none”,
transition: “all 0.12s”,
userSelect: “none”,
}}>{value}</div>
);
}

function ArcadeBtn({ label, onClick, color, disabled }) {
const [pressed, setPressed] = useState(false);
return (
<button
disabled={disabled}
onMouseDown={() => setPressed(true)}
onMouseUp={() => { setPressed(false); onClick && onClick(); }}
onMouseLeave={() => setPressed(false)}
style={{
width: 56, height: 28,
background: disabled ? “#222” : pressed ? color : `${color}33`,
border: `1px solid ${disabled ? "#333" : color}`,
borderRadius: 4,
color: disabled ? “#444” : pressed ? “#000” : color,
fontSize: 14, fontWeight: “bold”,
cursor: disabled ? “default” : “pointer”,
transition: “all 0.08s”,
display: “flex”, alignItems: “center”, justifyContent: “center”,
boxShadow: pressed && !disabled ? `0 0 8px ${color}` : “none”,
fontFamily: “monospace”,
}}
>{label}</button>
);
}

export default function App() {
const [target, setTarget]       = useState(rnd);
const [current, setCurrent]     = useState(() => Array(DIGITS).fill(0));
const [history, setHistory]     = useState(rndHistory);
const [moves, setMoves]         = useState(0);
const [wave, setWave]           = useState(1);
const [selectedHist, setSelectedHist] = useState(null);
const [wavelog, setWavelog]     = useState([]);
const [flash, setFlash]         = useState(false);
const [justMatched, setJustMatched] = useState(false);

// Time attack
const [taState, setTaState]   = useState(“idle”); // idle | running | done
const [taTime, setTaTime]     = useState(TIME_ATTACK_SEC);
const [taScore, setTaScore]   = useState(0);
const [taBest, setTaBest]     = useState(null);
const [taWaves, setTaWaves]   = useState(0);
const timerRef = useRef(null);
const [scale, setScale] = useState(1);
useEffect(() => {
const calcScale = () => {
// content is ~500px wide; clamp between 0.45 and 1
const s = Math.min(1, (window.innerWidth - 16) / 500);
setScale(Math.max(0.45, s));
};
calcScale();
window.addEventListener(“resize”, calcScale);
return () => window.removeEventListener(“resize”, calcScale);
}, []);

const isMatch = current.every((d, i) => d === target[i]);
const optFrom000 = minDist(Array(DIGITS).fill(0), target);
const bestHist = history.reduce((b, d, i) => {
const m = minDist(d, target);
return m < b.m ? { i, m } : b;
}, { i: -1, m: Infinity });
const trueOptimal = Math.min(optFrom000, bestHist.m);
const efficiency  = moves === 0 ? 100 : Math.min(100, Math.round((trueOptimal / Math.max(moves, 1)) * 100));
const effColor    = gradeColor(efficiency);

const last10     = wavelog.slice(0, 10);
const avg10waves = last10.length;
const avg10eff   = last10.length === 0 ? null
: Math.round(last10.reduce((s, w) => s + w.eff, 0) / last10.length);
const taAvgEff  = taWaves === 0 ? 0 : Math.round(taScore / taWaves);

useEffect(() => {
if (isMatch && !justMatched) {
setJustMatched(true);
setFlash(true);
setTimeout(() => setFlash(false), 600);
}
if (!isMatch) setJustMatched(false);
}, [isMatch]);

useEffect(() => {
if (taState === “running”) {
timerRef.current = setInterval(() => {
setTaTime(t => {
if (t <= 1) {
clearInterval(timerRef.current);
setTaState(“done”);
return 0;
}
return t - 1;
});
}, 1000);
}
return () => clearInterval(timerRef.current);
}, [taState]);

useEffect(() => {
if (taState === “done”) {
setTaBest(prev => prev === null ? taScore : Math.max(prev, taScore));
}
}, [taState]);

function adjust(idx, delta) {
setCurrent(prev => {
const next = […prev];
next[idx] = (next[idx] + delta + 10) % 10;
return next;
});
setMoves(m => m + 1);
}

function loadHist(i) {
if (taState === “done”) return;
setCurrent([…history[i]]);
setSelectedHist(i);
}

function confirm() {
if (!isMatch || taState === “done”) return;
const wEff = Math.min(100, Math.round((trueOptimal / Math.max(moves, 1)) * 100));
const entry = { wave, target: […target], moves, optimal: trueOptimal, eff: wEff };
const newHist = […history.slice(1), […current]];
setHistory(newHist);
setWavelog(wl => [entry, …wl]);
if (taState === “running”) {
setTaScore(s => s + wEff);
setTaWaves(w => w + 1);
}
setTarget(rnd());
setCurrent(Array(DIGITS).fill(0));
setMoves(0);
setWave(w => w + 1);
setSelectedHist(null);
setJustMatched(false);
}

function startTimeAttack() {
clearInterval(timerRef.current);
setTaState(“running”);
setTaTime(TIME_ATTACK_SEC);
setTaScore(0);
setTaWaves(0);
setTarget(rnd());
setCurrent(Array(DIGITS).fill(0));
setMoves(0);
setWave(1);
setWavelog([]);
setHistory(rndHistory());
setSelectedHist(null);
setJustMatched(false);
}

function backToFree() {
clearInterval(timerRef.current);
setTaState(“idle”);
setTaTime(TIME_ATTACK_SEC);
setTarget(rnd());
setCurrent(Array(DIGITS).fill(0));
setMoves(0);
setWave(1);
setWavelog([]);
setHistory(rndHistory());
setSelectedHist(null);
}

const col1 = history.slice(0, 10);
const col2 = history.slice(10, 20);
const timerColor = taTime > 10 ? “#00ff88” : taTime > 5 ? “#ffdd00” : “#ff3355”;

return (
<div style={{
minHeight: “100vh”,
background: “#0a0a0f”,
backgroundImage: “radial-gradient(ellipse at 20% 30%, #0d1f3c 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #1a0d2e 0%, transparent 60%)”,
display: “flex”, alignItems: “flex-start”, justifyContent: “center”,
paddingTop: `${Math.max(8, (window.innerHeight - 900 * scale) / 2)}px`,
paddingBottom: 8,
fontFamily: “‘Courier New’, monospace”,
overflowX: “hidden”,
overflowY: “auto”,
boxSizing: “border-box”,
}}>
<div style={{ position: “fixed”, inset: 0, pointerEvents: “none”, zIndex: 100,
background: “repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)” }} />

```
  <div style={{
    display: "flex", gap: 24, alignItems: "flex-start",
    transformOrigin: "top center",
    transform: `scale(${scale})`,
    transition: "transform 0.15s",
  }}>

    {/* ===== LEFT PANEL ===== */}
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", minWidth: 220 }}>

      {/* Wave + Timer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#555", fontSize: 11, letterSpacing: 4 }}>WAVE</div>
          <div style={{ color: "#fff", fontSize: 32, fontWeight: 900, textShadow: "0 0 20px rgba(255,255,255,0.4)", lineHeight: 1 }}>
            {String(wave).padStart(2, "0")}
          </div>
        </div>
        {taState === "running" && (
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ color: "#555", fontSize: 9, letterSpacing: 2 }}>TIME</div>
            <div style={{
              color: timerColor, fontSize: 28, fontWeight: 900, lineHeight: 1,
              textShadow: `0 0 16px ${timerColor}`,
              animation: taTime <= 5 ? "pulse 0.5s ease-in-out infinite alternate" : "none",
            }}>{taTime}</div>
          </div>
        )}
      </div>

      {/* TARGET */}
      <div style={{
        padding: "10px 14px 12px", border: "2px solid #ff3355", borderRadius: 10,
        background: flash ? "rgba(255,100,50,0.25)" : "rgba(255,51,85,0.08)",
        boxShadow: flash ? "0 0 30px #ff3355" : "0 0 10px rgba(255,51,85,0.2)",
        transition: "all 0.15s", opacity: taState === "done" ? 0.4 : 1,
      }}>
        <div style={{ color: "#ff3355", fontSize: 10, letterSpacing: 4, marginBottom: 8, textAlign: "center" }}>■ TARGET</div>
        <div style={{ display: "flex", gap: 8 }}>
          {target.map((d, i) => <DigitDisplay key={i} value={d} color="#ff3355" glow />)}
        </div>
      </div>

      {/* CURRENT */}
      <div style={{
        padding: "10px 14px 12px", border: "2px solid #00cc66", borderRadius: 10,
        background: isMatch ? "rgba(0,255,136,0.12)" : "rgba(0,204,102,0.06)",
        boxShadow: isMatch ? "0 0 20px rgba(0,255,136,0.4)" : "0 0 8px rgba(0,204,102,0.15)",
        transition: "all 0.2s", opacity: taState === "done" ? 0.4 : 1,
      }}>
        <div style={{ color: "#00cc66", fontSize: 10, letterSpacing: 4, marginBottom: 8, textAlign: "center" }}>■ CURRENT</div>
        <div style={{ display: "flex", gap: 8 }}>
          {current.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <ArcadeBtn label="＋▲" color="#00cc66" onClick={() => adjust(i, 1)} disabled={taState === "done"} />
              <DigitDisplay value={d} color={d === target[i] ? "#00ff88" : "#00cc66"} glow={d === target[i]} />
              <ArcadeBtn label="－▼" color="#00cc66" onClick={() => adjust(i, -1)} disabled={taState === "done"} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        width: "100%", padding: "8px 12px",
        border: "1px solid #222", borderRadius: 8,
        background: "rgba(255,255,255,0.03)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11,
      }}>
        <div style={{ color: "#555" }}>手数</div>
        <div style={{ color: "#fff", textAlign: "right", fontWeight: "bold" }}>{moves}</div>
        <div style={{ color: "#555" }}>最短</div>
        <div style={{ color: "#64b5f6", textAlign: "right", fontWeight: "bold" }}>{trueOptimal}</div>
        <div style={{ color: "#555" }}>効率</div>
        <div style={{ color: effColor, textAlign: "right", fontWeight: "bold" }}>
          {moves === 0 ? "—" : `${efficiency}%`}
        </div>
      </div>

      {/* CONFIRM */}
      <button
        onClick={confirm}
        disabled={!isMatch || taState === "done"}
        style={{
          width: "100%", padding: "11px 0",
          background: isMatch && taState !== "done" ? "linear-gradient(90deg, #0044aa, #0066ff)" : "#111",
          border: `2px solid ${isMatch && taState !== "done" ? "#4499ff" : "#333"}`,
          borderRadius: 8, color: isMatch && taState !== "done" ? "#fff" : "#444",
          fontSize: 16, fontWeight: 900, letterSpacing: 4,
          cursor: isMatch && taState !== "done" ? "pointer" : "default",
          boxShadow: isMatch && taState !== "done" ? "0 0 20px rgba(68,153,255,0.5)" : "none",
          transition: "all 0.2s",
          textShadow: isMatch && taState !== "done" ? "0 0 10px rgba(255,255,255,0.6)" : "none",
        }}
      >{isMatch && taState !== "done" ? "✓ 決 定" : "決 定"}</button>

      {/* Wave log */}
      {wavelog.length > 0 && taState !== "running" && (
        <div style={{ width: "100%", fontSize: 10 }}>
          <div style={{ color: "#333", letterSpacing: 2, marginBottom: 4 }}>HISTORY LOG</div>
          {wavelog.slice(0, 8).map((w, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "3px 0", borderTop: "1px solid #1a1a1a",
              color: w.eff >= 100 ? "#00ff88" : "#888",
            }}>
              <span style={{ color: "#444" }}>W{w.wave}</span>
              <span style={{ color: "#666" }}>{str3(w.target)}</span>
              <span>{w.moves}手</span>
              <span style={{ color: "#333" }}>/{w.optimal}</span>
              {w.eff >= 100 && <span style={{ color: "#00ff88" }}>★</span>}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* ===== RIGHT COLUMN ===== */}
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* HISTORY */}
      <div style={{
        border: "2px solid #00bcd4", borderRadius: 10,
        padding: "12px 10px", background: "rgba(0,188,212,0.04)",
        boxShadow: "0 0 16px rgba(0,188,212,0.15)",
        opacity: taState === "done" ? 0.5 : 1,
      }}>
        <div style={{ color: "#00bcd4", fontSize: 10, letterSpacing: 4, textAlign: "center", marginBottom: 10 }}>■ HISTORY</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[col1, col2].map((col, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {col.map((digits, ri) => {
                const idx = ci * 10 + ri;
                const isSelected = selectedHist === idx;
                return (
                  <button key={ri} onClick={() => loadHist(idx)} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "4px 8px",
                    background: isSelected ? "rgba(0,188,212,0.25)" : "rgba(0,188,212,0.04)",
                    border: `1px solid ${isSelected ? "#00bcd4" : "#00bcd422"}`,
                    borderRadius: 4, cursor: taState !== "done" ? "pointer" : "default",
                    transition: "all 0.1s", width: 82,
                    boxShadow: isSelected ? "0 0 8px rgba(0,188,212,0.4)" : "none",
                  }}
                    onMouseEnter={e => { if (!isSelected && taState !== "done") e.currentTarget.style.background = "rgba(0,188,212,0.12)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "rgba(0,188,212,0.04)"; }}
                  >
                    <span style={{ color: "#334", fontSize: 9, width: 14, textAlign: "right", flexShrink: 0 }}>{ci * 10 + ri + 1}</span>
                    <span style={{
                      fontFamily: "monospace", fontSize: 16, fontWeight: 900, letterSpacing: 3,
                      color: isSelected ? "#00eeff" : "#9de",
                      textShadow: isSelected ? "0 0 8px #00bcd4" : "none",
                    }}>{str3(digits)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ color: "#1e4455", fontSize: 9, textAlign: "center", marginTop: 8, letterSpacing: 1 }}>
          クリックで呼び出し → 増減で調整
        </div>
      </div>

      {/* ===== SCORE / TIME ATTACK PANEL ===== */}
      <div style={{
        border: `2px solid ${taState === "running" ? "#ffdd00" : taState === "done" ? "#ff3355" : "#ff9900"}`,
        borderRadius: 10, padding: "12px 12px",
        background: taState === "done" ? "rgba(255,51,85,0.08)"
          : taState === "running" ? "rgba(255,221,0,0.06)" : "rgba(255,153,0,0.05)",
        boxShadow: taState === "running" ? "0 0 20px rgba(255,221,0,0.3)"
          : taState === "done" ? "0 0 20px rgba(255,51,85,0.3)" : "0 0 10px rgba(255,153,0,0.15)",
        transition: "all 0.3s", minWidth: 178,
      }}>

        {/* 10-wave avg (free play or done) */}
        {taState !== "running" && (
          <>
            <div style={{ color: "#ff9900", fontSize: 10, letterSpacing: 3, textAlign: "center", marginBottom: 8 }}>
              ■ 10 WAVE AVG
            </div>
            {avg10waves === 0 ? (
              <div style={{ color: "#333", fontSize: 10, textAlign: "center", padding: "2px 0 6px" }}>
                — ウェーブ完了待ち —
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ color: "#555", fontSize: 9 }}>サンプル {avg10waves}/10</div>
                  <div style={{ color: avg10eff !== null ? gradeColor(avg10eff) : "#555", fontSize: 20, fontWeight: 900,
                    textShadow: avg10eff !== null ? `0 0 10px ${gradeColor(avg10eff)}` : "none" }}>
                    {avg10eff !== null ? `${avg10eff}%` : "—"}
                  </div>
                </div>
                {avg10eff !== null && (
                  <div style={{
                    fontSize: 36, fontWeight: 900, lineHeight: 1,
                    color: gradeColor(avg10eff),
                    textShadow: `0 0 16px ${gradeColor(avg10eff)}`,
                  }}>{gradeLabel(avg10eff)}</div>
                )}
              </div>
            )}
            <div style={{ borderTop: "1px solid #222", margin: "8px 0" }} />
          </>
        )}

        {/* TIME ATTACK label */}
        <div style={{ color: taState === "running" ? "#ffdd00" : "#ff9900", fontSize: 10, letterSpacing: 3, textAlign: "center", marginBottom: 8 }}>
          ■ TIME ATTACK
        </div>

        {taState === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ color: "#555", fontSize: 10, textAlign: "center", lineHeight: 1.7 }}>
              30秒間で何ウェーブ<br />クリアできるか挑戦！<br />
              <span style={{ color: "#333" }}>スコア = Σ効率(各Wave)</span>
            </div>
            {taBest !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
                <span style={{ color: "#555", fontSize: 10 }}>BEST</span>
                <span style={{ color: "#ffd700", fontSize: 14, fontWeight: 900, textShadow: "0 0 8px #ffd700" }}>{taBest}pt</span>
              </div>
            )}
            <button onClick={startTimeAttack} style={{
              width: "100%", padding: "9px 0",
              background: "linear-gradient(90deg, #7a3800, #c05a00)",
              border: "2px solid #ff9900", borderRadius: 7,
              color: "#ffdd88", fontSize: 13, fontWeight: 900, letterSpacing: 3, cursor: "pointer",
              boxShadow: "0 0 12px rgba(255,153,0,0.3)",
            }}>▶ START</button>
          </div>
        )}

        {taState === "running" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888", fontSize: 11 }}>クリア</span>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>{taWaves} wave</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888", fontSize: 11 }}>スコア</span>
              <span style={{ color: "#ffdd00", fontSize: 16, fontWeight: 900, textShadow: "0 0 8px #ffdd00" }}>{taScore}pt</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888", fontSize: 11 }}>平均効率</span>
              <span style={{ color: taWaves === 0 ? "#555" : gradeColor(taAvgEff), fontSize: 12, fontWeight: 900 }}>
                {taWaves === 0 ? "—" : `${taAvgEff}%`}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, marginTop: 2 }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${(taTime / TIME_ATTACK_SEC) * 100}%`,
                background: timerColor,
                boxShadow: `0 0 6px ${timerColor}`,
                transition: "width 1s linear, background 0.3s",
              }} />
            </div>
          </div>
        )}

        {taState === "done" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ textAlign: "center", color: "#ff3355", fontSize: 12, letterSpacing: 3,
              textShadow: "0 0 10px #ff3355", fontWeight: 900 }}>TIME UP!</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px", fontSize: 11 }}>
              <span style={{ color: "#555" }}>クリア波数</span>
              <span style={{ color: "#fff", textAlign: "right", fontWeight: "bold" }}>{taWaves} wave</span>
              <span style={{ color: "#555" }}>平均効率</span>
              <span style={{ color: taWaves === 0 ? "#555" : gradeColor(taAvgEff), textAlign: "right", fontWeight: "bold" }}>
                {taWaves === 0 ? "—" : `${taAvgEff}%`}
              </span>
              <span style={{ color: "#555" }}>グレード</span>
              <span style={{
                color: taWaves === 0 ? "#555" : gradeColor(taAvgEff),
                textAlign: "right", fontSize: 18, fontWeight: 900,
                textShadow: taWaves > 0 ? `0 0 10px ${gradeColor(taAvgEff)}` : "none"
              }}>{taWaves === 0 ? "—" : gradeLabel(taAvgEff)}</span>
            </div>
            {/* Score highlight */}
            <div style={{
              textAlign: "center", padding: "8px 0",
              border: "1px solid #ff355544", borderRadius: 6,
              background: "rgba(255,51,85,0.1)",
            }}>
              <div style={{ color: "#666", fontSize: 9, letterSpacing: 2 }}>FINAL SCORE</div>
              <div style={{ color: "#ffdd00", fontSize: 28, fontWeight: 900, textShadow: "0 0 16px #ffdd00", lineHeight: 1.1 }}>
                {taScore}
              </div>
              <div style={{ color: "#555", fontSize: 9 }}>pt</div>
            </div>
            {taBest !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#555", fontSize: 10 }}>BEST</span>
                <span style={{ color: "#ffd700", fontSize: 13, fontWeight: 900, textShadow: "0 0 6px #ffd700" }}>
                  {taBest}pt {taScore >= taBest ? " 🏆 NEW!" : ""}
                </span>
              </div>
            )}
            <button onClick={startTimeAttack} style={{
              width: "100%", padding: "8px 0",
              background: "linear-gradient(90deg, #7a3800, #c05a00)",
              border: "2px solid #ff9900", borderRadius: 7,
              color: "#ffdd88", fontSize: 12, fontWeight: 900, letterSpacing: 3, cursor: "pointer",
            }}>▶ RETRY</button>
            <button onClick={backToFree} style={{
              width: "100%", padding: "6px 0",
              background: "transparent", border: "1px solid #2a2a2a",
              borderRadius: 7, color: "#444", fontSize: 11, cursor: "pointer",
            }}>フリープレイに戻る</button>
          </div>
        )}
      </div>
    </div>
  </div>

  <style>{`
    @keyframes pulse { from { opacity: 1; } to { opacity: 0.4; } }
  `}</style>
</div>
```

);
}