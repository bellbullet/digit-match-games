import { useState, useEffect, useRef } from "react";

const DIGITS = 3;
const HISTORY_SIZE = 10;
const TIME_ATTACK_SEC = 30;

const rnd = () => Array.from({ length: DIGITS }, () => Math.floor(Math.random() * 10));
const rndLimited = () => {
  const n = Math.floor(Math.random() * 200); // 0-199
  return [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];
};
const rndHistory = (gen = rnd) => Array.from({ length: HISTORY_SIZE }, gen);
const str3 = (d) => d.join("");

function minDist(from, to) {
  return from.reduce((s, v, i) => {
    const d = Math.abs(v - to[i]);
    return s + Math.min(d, 10 - d);
  }, 0);
}

function gradeColor(eff) {
  if (eff >= 100) return "#2dd4bf";
  if (eff >= 80)  return "#a3e635";
  if (eff >= 60)  return "#f5c451";
  if (eff >= 40)  return "#fb923c";
  return "#f97066";
}
function gradeLabel(eff) {
  if (eff >= 100) return "S";
  if (eff >= 80)  return "A";
  if (eff >= 60)  return "B";
  if (eff >= 40)  return "C";
  return "D";
}

const CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .dm-root {
    min-height: 100vh;
    background: #0f1216;
    color: #e8edf2;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    padding: 28px 16px 48px;
  }
  .dm-wrap { max-width: 880px; margin: 0 auto; }
  .dm-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
  }
  .dm-title { font-size: 13px; font-weight: 700; letter-spacing: 0.32em; color: #8b98a5; }
  .dm-wave { display: flex; align-items: baseline; gap: 10px; margin-top: 6px; }
  .dm-wave-num { font-size: 44px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
  .dm-wave-label { font-size: 12px; letter-spacing: 0.24em; color: #8b98a5; }
  .dm-grid { display: grid; grid-template-columns: minmax(300px, 380px) 1fr; gap: 16px; align-items: start; }
  @media (max-width: 720px) { .dm-grid { grid-template-columns: 1fr; } }
  .dm-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .dm-panel {
    background: #171c22; border: 1px solid #2a333f; border-radius: 16px;
    padding: 18px;
  }
  .dm-panel-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.24em; color: #8b98a5;
    margin-bottom: 14px;
  }
  .dm-dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }
  .dm-digits { display: flex; gap: 10px; justify-content: center; }
  .dm-digit {
    width: 72px; height: 88px; border-radius: 12px;
    background: #0b0e11; border: 1px solid #2a333f;
    display: flex; align-items: center; justify-content: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, "Courier New", monospace;
    font-size: 46px; font-weight: 700; font-variant-numeric: tabular-nums;
    user-select: none; transition: border-color .15s, background .15s, color .15s;
  }
  .dm-step {
    width: 72px; height: 38px; border-radius: 10px;
    background: #1d242d; border: 1px solid #2a333f; color: #e8edf2;
    font-size: 15px; cursor: pointer; transition: background .1s, border-color .1s;
    display: flex; align-items: center; justify-content: center;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .dm-step:hover:not(:disabled) { border-color: #2dd4bf; color: #2dd4bf; }
  .dm-step:active:not(:disabled) { background: #2dd4bf; color: #0f1216; }
  .dm-step:disabled { opacity: .35; cursor: default; }
  .dm-seg { display: flex; background: #171c22; border: 1px solid #2a333f; border-radius: 999px; padding: 3px; gap: 3px; }
  .dm-seg button {
    border: none; background: transparent; color: #8b98a5; cursor: pointer;
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
    padding: 7px 16px; border-radius: 999px; transition: all .15s;
    font-variant-numeric: tabular-nums;
  }
  .dm-seg button.on { background: #e8edf2; color: #0f1216; }
  .dm-seg button:disabled { cursor: default; }
  .dm-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .dm-stat { background: #171c22; border: 1px solid #2a333f; border-radius: 12px; padding: 10px 12px; text-align: center; }
  .dm-stat-label { font-size: 10px; letter-spacing: 0.18em; color: #8b98a5; margin-bottom: 4px; }
  .dm-stat-value { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .dm-confirm {
    width: 100%; height: 54px; border-radius: 12px; border: 1px solid #2a333f;
    background: #1d242d; color: #5b6874; font-size: 16px; font-weight: 800; letter-spacing: 0.3em;
    cursor: default; transition: all .15s; font-family: inherit;
  }
  .dm-confirm.ready { background: #2dd4bf; border-color: #2dd4bf; color: #0f1216; cursor: pointer; }
  .dm-confirm.ready:active { transform: scale(.99); }
  .dm-hist { display: flex; flex-direction: column; gap: 8px; }
  .dm-hist-row {
    display: flex; align-items: center; gap: 14px; width: 100%;
    background: #0f1419; border: 1px solid #2a333f; border-radius: 12px;
    padding: 10px 16px; cursor: pointer; transition: border-color .12s, background .12s;
    color: #e8edf2; font-family: inherit; text-align: left;
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .dm-hist-row:hover:not(:disabled) { border-color: #3d4a59; }
  .dm-hist-row.sel { border-color: #2dd4bf; background: rgba(45,212,191,.08); }
  .dm-hist-row:disabled { cursor: default; opacity: .6; }
  .dm-hist-idx { font-size: 11px; color: #5b6874; width: 18px; text-align: right; font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .dm-hist-num {
    font-family: ui-monospace, SFMono-Regular, Menlo, "Courier New", monospace;
    font-size: 22px; font-weight: 700; letter-spacing: 0.35em; font-variant-numeric: tabular-nums;
  }
  .dm-hist-row.sel .dm-hist-num { color: #2dd4bf; }
  .dm-note { font-size: 11px; color: #5b6874; text-align: center; margin-top: 12px; }
  .dm-log-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 2px; border-top: 1px solid #232b34; font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .dm-big-btn {
    width: 100%; padding: 12px 0; border-radius: 12px; cursor: pointer;
    font-size: 14px; font-weight: 800; letter-spacing: 0.2em; font-family: inherit;
    transition: all .15s; touch-action: manipulation;
  }
  @keyframes dm-pulse { from { opacity: 1; } to { opacity: .45; } }
  .dm-timer-low { animation: dm-pulse .5s ease-in-out infinite alternate; }
`;

function DigitDisplay({ value, color, matched }) {
  return (
    <div className="dm-digit" style={{
      color,
      borderColor: matched ? color : undefined,
      background: matched ? "rgba(45,212,191,.07)" : undefined,
    }}>{value}</div>
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
  const [mode, setMode] = useState("normal"); // "normal" | "limited"
  const rndByMode = (m) => (m ?? mode) === "limited" ? rndLimited() : rnd();

  // Time attack
  const [taState, setTaState]   = useState("idle"); // idle | running | done
  const [taTime, setTaTime]     = useState(TIME_ATTACK_SEC);
  const [taScore, setTaScore]   = useState(0);
  const [taBest, setTaBest]     = useState(null);
  const [taWaves, setTaWaves]   = useState(0);
  const timerRef = useRef(null);

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
    if (taState === "running") {
      timerRef.current = setInterval(() => {
        setTaTime(t => {
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

  useEffect(() => {
    if (taState === "done") {
      setTaBest(prev => prev === null ? taScore : Math.max(prev, taScore));
    }
  }, [taState]);

  function adjust(idx, delta) {
    setCurrent(prev => {
      const next = [...prev];
      next[idx] = (next[idx] + delta + 10) % 10;
      return next;
    });
    setMoves(m => m + 1);
  }

  function loadHist(i) {
    if (taState === "done") return;
    setCurrent([...history[i]]);
    setSelectedHist(i);
  }

  function confirm() {
    if (!isMatch || taState === "done") return;
    const wEff = Math.min(100, Math.round((trueOptimal / Math.max(moves, 1)) * 100));
    const entry = { wave, target: [...target], moves, optimal: trueOptimal, eff: wEff };
    const newHist = [...history.slice(1), [...current]];
    setHistory(newHist);
    setWavelog(wl => [entry, ...wl]);
    if (taState === "running") {
      setTaScore(s => s + wEff);
      setTaWaves(w => w + 1);
    }
    setTarget(rndByMode());
    setCurrent(Array(DIGITS).fill(0));
    setMoves(0);
    setWave(w => w + 1);
    setSelectedHist(null);
    setJustMatched(false);
  }

  function startTimeAttack() {
    clearInterval(timerRef.current);
    setTaState("running");
    setTaTime(TIME_ATTACK_SEC);
    setTaScore(0);
    setTaWaves(0);
    setTarget(rndByMode());
    setCurrent(Array(DIGITS).fill(0));
    setMoves(0);
    setWave(1);
    setWavelog([]);
    setHistory(rndHistory(() => rndByMode()));
    setSelectedHist(null);
    setJustMatched(false);
  }

  function backToFree() {
    clearInterval(timerRef.current);
    setTaState("idle");
    setTaTime(TIME_ATTACK_SEC);
    setTarget(rndByMode());
    setCurrent(Array(DIGITS).fill(0));
    setMoves(0);
    setWave(1);
    setWavelog([]);
    setHistory(rndHistory(() => rndByMode()));
    setSelectedHist(null);
  }

  const timerColor = taTime > 10 ? "#2dd4bf" : taTime > 5 ? "#f5c451" : "#f97066";
  const done = taState === "done";

  return (
    <div className="dm-root">
      <style>{CSS}</style>
      <div className="dm-wrap">

        {/* ===== HEADER ===== */}
        <div className="dm-head">
          <div>
            <div className="dm-title">DIGIT MATCH</div>
            <div className="dm-wave">
              <span className="dm-wave-label">WAVE</span>
              <span className="dm-wave-num">{String(wave).padStart(2, "0")}</span>
              {taState === "running" && (
                <span className={taTime <= 5 ? "dm-timer-low" : undefined} style={{
                  marginLeft: 14, fontSize: 30, fontWeight: 800, color: timerColor,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1,
                }}>{taTime}<span style={{ fontSize: 13, color: "#8b98a5", marginLeft: 4 }}>sec</span></span>
              )}
            </div>
          </div>
          <div className="dm-seg" role="tablist" aria-label="mode">
            {["normal", "limited"].map(m => (
              <button key={m}
                className={mode === m ? "on" : undefined}
                disabled={taState === "running"}
                onClick={() => {
                  if (mode === m || taState === "running") return;
                  setMode(m);
                  setTarget(rndByMode(m));
                  setCurrent(Array(DIGITS).fill(0));
                  setMoves(0);
                  setWave(1);
                  setWavelog([]);
                  setHistory(rndHistory(() => rndByMode(m)));
                  setSelectedHist(null);
                }}>
                {m === "normal" ? "0–999" : "0–199"}
              </button>
            ))}
          </div>
        </div>

        <div className="dm-grid">
          {/* ===== LEFT ===== */}
          <div className="dm-col" style={{ opacity: done ? 0.55 : 1 }}>

            {/* TARGET */}
            <div className="dm-panel" style={{
              borderColor: flash ? "#f97066" : undefined,
              background: flash ? "rgba(249,112,102,.06)" : undefined,
              transition: "all .15s",
            }}>
              <div className="dm-panel-label">
                <span className="dm-dot" style={{ background: "#f97066" }} />
                TARGET
                {mode === "limited" && <span style={{ color: "#8b98a5", letterSpacing: ".08em" }}>[0–199]</span>}
              </div>
              <div className="dm-digits">
                {target.map((d, i) => <DigitDisplay key={i} value={d} color="#f97066" />)}
              </div>
            </div>

            {/* CURRENT */}
            <div className="dm-panel" style={{
              borderColor: isMatch ? "#2dd4bf" : undefined,
              transition: "border-color .2s",
            }}>
              <div className="dm-panel-label">
                <span className="dm-dot" style={{ background: "#2dd4bf" }} />
                CURRENT
                {isMatch && <span style={{ color: "#2dd4bf", letterSpacing: ".08em" }}>— MATCH</span>}
              </div>
              <div className="dm-digits">
                {current.map((d, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <button className="dm-step" onClick={() => adjust(i, 1)} disabled={done} aria-label={`digit ${i + 1} up`}>▲</button>
                    <DigitDisplay value={d} color={d === target[i] ? "#2dd4bf" : "#e8edf2"} matched={d === target[i]} />
                    <button className="dm-step" onClick={() => adjust(i, -1)} disabled={done} aria-label={`digit ${i + 1} down`}>▼</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="dm-stats">
              <div className="dm-stat">
                <div className="dm-stat-label">手数</div>
                <div className="dm-stat-value">{moves}</div>
              </div>
              <div className="dm-stat">
                <div className="dm-stat-label">最短</div>
                <div className="dm-stat-value" style={{ color: "#7dd3fc" }}>{trueOptimal}</div>
              </div>
              <div className="dm-stat">
                <div className="dm-stat-label">効率</div>
                <div className="dm-stat-value" style={{ color: moves === 0 ? "#5b6874" : effColor }}>
                  {moves === 0 ? "—" : `${efficiency}%`}
                </div>
              </div>
            </div>

            {/* CONFIRM */}
            <button className={`dm-confirm${isMatch && !done ? " ready" : ""}`}
              onClick={confirm} disabled={!isMatch || done}>
              決定
            </button>

            {/* Wave log */}
            {wavelog.length > 0 && taState !== "running" && (
              <div className="dm-panel" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div className="dm-panel-label" style={{ marginBottom: 4 }}>HISTORY LOG</div>
                {wavelog.slice(0, 8).map((w, i) => (
                  <div key={i} className="dm-log-row" style={{ color: w.eff >= 100 ? "#2dd4bf" : "#8b98a5" }}>
                    <span style={{ color: "#5b6874" }}>W{w.wave}</span>
                    <span>{str3(w.target)}</span>
                    <span>{w.moves}手</span>
                    <span style={{ color: "#5b6874" }}>/ {w.optimal}</span>
                    <span style={{ width: 14, textAlign: "right" }}>{w.eff >= 100 ? "★" : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== RIGHT ===== */}
          <div className="dm-col">

            {/* HISTORY */}
            <div className="dm-panel" style={{ opacity: done ? 0.55 : 1 }}>
              <div className="dm-panel-label">
                <span className="dm-dot" style={{ background: "#7dd3fc" }} />
                HISTORY
                <span style={{ marginLeft: "auto", letterSpacing: ".08em" }}>{HISTORY_SIZE}件</span>
              </div>
              <div className="dm-hist">
                {history.map((digits, idx) => {
                  const isSelected = selectedHist === idx;
                  return (
                    <button key={idx}
                      className={`dm-hist-row${isSelected ? " sel" : ""}`}
                      onClick={() => loadHist(idx)} disabled={done}>
                      <span className="dm-hist-idx">{idx + 1}</span>
                      <span className="dm-hist-num">{str3(digits)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="dm-note">タップで呼び出し → 増減で調整</div>
            </div>

            {/* SCORE / TIME ATTACK */}
            <div className="dm-panel">
              {taState !== "running" && (
                <>
                  <div className="dm-panel-label">
                    <span className="dm-dot" style={{ background: "#f5c451" }} />
                    10 WAVE AVG
                  </div>
                  {avg10waves === 0 ? (
                    <div style={{ color: "#5b6874", fontSize: 12, padding: "2px 0 4px" }}>— ウェーブ完了待ち —</div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#5b6874", fontSize: 11 }}>サンプル {avg10waves}/10</div>
                        <div style={{ color: gradeColor(avg10eff), fontSize: 24, fontWeight: 800 }}>
                          {avg10eff}%
                        </div>
                      </div>
                      <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: gradeColor(avg10eff) }}>
                        {gradeLabel(avg10eff)}
                      </div>
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid #232b34", margin: "16px 0" }} />
                </>
              )}

              <div className="dm-panel-label">
                <span className="dm-dot" style={{ background: "#fb923c" }} />
                TIME ATTACK
              </div>

              {taState === "idle" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ color: "#8b98a5", fontSize: 12, lineHeight: 1.8 }}>
                    30秒間で何ウェーブクリアできるか挑戦！<br />
                    <span style={{ color: "#5b6874" }}>スコア = Σ効率（各Wave）</span>
                  </div>
                  {taBest !== null && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#8b98a5", fontSize: 12 }}>BEST</span>
                      <span style={{ color: "#f5c451", fontSize: 16, fontWeight: 800 }}>{taBest}pt</span>
                    </div>
                  )}
                  <button className="dm-big-btn" onClick={startTimeAttack} style={{
                    background: "#f5c451", border: "1px solid #f5c451", color: "#0f1216",
                  }}>▶ START</button>
                </div>
              )}

              {taState === "running" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#8b98a5" }}>クリア</span>
                    <span style={{ fontWeight: 800 }}>{taWaves} wave</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#8b98a5" }}>スコア</span>
                    <span style={{ color: "#f5c451", fontSize: 17, fontWeight: 800 }}>{taScore}pt</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#8b98a5" }}>平均効率</span>
                    <span style={{ fontWeight: 800, color: taWaves === 0 ? "#5b6874" : gradeColor(taAvgEff) }}>
                      {taWaves === 0 ? "—" : `${taAvgEff}%`}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#232b34", borderRadius: 999, marginTop: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 999,
                      width: `${(taTime / TIME_ATTACK_SEC) * 100}%`,
                      background: timerColor,
                      transition: "width 1s linear, background .3s",
                    }} />
                  </div>
                </div>
              )}

              {taState === "done" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ color: "#f97066", fontSize: 13, letterSpacing: ".24em", fontWeight: 800 }}>TIME UP!</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12 }}>
                    <span style={{ color: "#8b98a5" }}>クリア波数</span>
                    <span style={{ textAlign: "right", fontWeight: 800 }}>{taWaves} wave</span>
                    <span style={{ color: "#8b98a5" }}>平均効率</span>
                    <span style={{ textAlign: "right", fontWeight: 800, color: taWaves === 0 ? "#5b6874" : gradeColor(taAvgEff) }}>
                      {taWaves === 0 ? "—" : `${taAvgEff}%`}
                    </span>
                    <span style={{ color: "#8b98a5" }}>グレード</span>
                    <span style={{
                      textAlign: "right", fontSize: 20, fontWeight: 800,
                      color: taWaves === 0 ? "#5b6874" : gradeColor(taAvgEff),
                    }}>{taWaves === 0 ? "—" : gradeLabel(taAvgEff)}</span>
                  </div>
                  <div style={{
                    textAlign: "center", padding: "12px 0",
                    border: "1px solid #2a333f", borderRadius: 12, background: "#0f1419",
                  }}>
                    <div style={{ color: "#8b98a5", fontSize: 10, letterSpacing: ".24em" }}>FINAL SCORE</div>
                    <div style={{ color: "#f5c451", fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>{taScore}</div>
                    <div style={{ color: "#5b6874", fontSize: 10 }}>pt</div>
                  </div>
                  {taBest !== null && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#8b98a5", fontSize: 12 }}>BEST</span>
                      <span style={{ color: "#f5c451", fontSize: 14, fontWeight: 800 }}>
                        {taBest}pt {taScore >= taBest ? "🏆 NEW!" : ""}
                      </span>
                    </div>
                  )}
                  <button className="dm-big-btn" onClick={startTimeAttack} style={{
                    background: "#f5c451", border: "1px solid #f5c451", color: "#0f1216",
                  }}>▶ RETRY</button>
                  <button className="dm-big-btn" onClick={backToFree} style={{
                    background: "transparent", border: "1px solid #2a333f", color: "#8b98a5",
                  }}>フリープレイに戻る</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
