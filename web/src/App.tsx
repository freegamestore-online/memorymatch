import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell, GameTopbar, GameAuth, useGameSounds } from "@freegamestore/games";

type SoundsApi = ReturnType<typeof useGameSounds>;

function AudioBridge({ apiRef }: { apiRef: React.MutableRefObject<SoundsApi | null> }) {
  const sounds = useGameSounds();
  apiRef.current = sounds;
  return null;
}

const SYMBOLS = ["★", "●", "▲", "■", "♠", "♥", "♦", "♣"] as const;

interface Tile {
  id: number;
  symbol: (typeof SYMBOLS)[number];
  matched: boolean;
}

function shuffleDeck(): Tile[] {
  // Each symbol appears twice; shuffle Fisher-Yates.
  const deck: Tile[] = [];
  SYMBOLS.forEach((s, i) => {
    deck.push({ id: i * 2, symbol: s, matched: false });
    deck.push({ id: i * 2 + 1, symbol: s, matched: false });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}

export default function App() {
  const [tiles, setTiles] = useState<Tile[]>(() => shuffleDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const audioRef = useRef<SoundsApi | null>(null);

  const won = useMemo(() => tiles.every((t) => t.matched), [tiles]);

  // Play a one-shot level-up sound when the player wins.
  const wonRef = useRef(false);
  useEffect(() => {
    if (won && !wonRef.current) {
      wonRef.current = true;
      audioRef.current?.playLevelUp();
    } else if (!won) {
      wonRef.current = false;
    }
  }, [won]);

  // Timer ticks while a game is in progress.
  useEffect(() => {
    if (won || startedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [won, startedAt]);

  // Resolve a pair of flipped tiles after a brief delay so the
  // user can see the second card before mismatched ones flip back.
  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const ta = tiles.find((t) => t.id === a);
    const tb = tiles.find((t) => t.id === b);
    if (ta && tb && ta.symbol === tb.symbol) {
      // Match — keep both face-up, mark as matched.
      audioRef.current?.playClear();
      const id = window.setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) => (t.id === a || t.id === b ? { ...t, matched: true } : t)),
        );
        setFlipped([]);
      }, 350);
      return () => window.clearTimeout(id);
    } else {
      // No match — flip both back after a beat.
      audioRef.current?.playError();
      const id = window.setTimeout(() => setFlipped([]), 750);
      return () => window.clearTimeout(id);
    }
  }, [flipped, tiles]);

  function flip(id: number) {
    if (won) return;
    if (flipped.includes(id)) return;
    if (flipped.length === 2) return; // wait for resolution
    if (tiles.find((t) => t.id === id)?.matched) return;
    if (startedAt === null) setStartedAt(Date.now());
    audioRef.current?.playTick();
    setFlipped((prev) => {
      const next = [...prev, id];
      if (next.length === 2) setMoves((m) => m + 1);
      return next;
    });
  }

  function reset() {
    setTiles(shuffleDeck());
    setFlipped([]);
    setMoves(0);
    setStartedAt(null);
    setNow(Date.now());
  }

  const elapsedSec = startedAt ? Math.floor((now - startedAt) / 1000) : 0;

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Memory Match"
          stats={[
            { label: "Moves", value: moves },
            { label: "Time", value: `${elapsedSec}s` },
          ]}
          actions={<GameAuth />}
          rules={<div><h3 style={{fontWeight:700}}>Memory Match</h3><h4 style={{fontWeight:600}}>Rules</h4><ul><li>Flip cards to find matching pairs</li><li>Match all pairs to win</li><li>Moves and time are tracked</li><li>Fewer moves = better</li></ul></div>}
        />
      }
    >
      <AudioBridge apiRef={audioRef} />
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-1 sm:p-2">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, min(20vw, calc((100svh - 6rem) / 5), 120px))",
            gridTemplateRows: "repeat(4, min(20vw, calc((100svh - 6rem) / 5), 120px))",
            gap: "clamp(0.2rem, 1vmin, 0.5rem)",
            justifyContent: "center",
          }}
        >
          {tiles.map((t) => {
            const open = t.matched || flipped.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => flip(t.id)}
                aria-label={open ? `${t.symbol} (open)` : "tile"}
                style={{
                  aspectRatio: "1 / 1",
                  border: "1px solid var(--line-strong)",
                  borderRadius: "0.6rem",
                  background: open ? "var(--paper)" : "var(--panel)",
                  fontFamily: "inherit",
                  fontSize: "clamp(1rem, 5vmin, 1.8rem)",
                  fontWeight: 700,
                  color: t.matched ? "var(--accent)" : "var(--ink)",
                  cursor: open || won ? "default" : "pointer",
                  transition: "background 0.18s, color 0.18s",
                }}
              >
                {open ? t.symbol : ""}
              </button>
            );
          })}
        </div>

        {won && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.6rem 1rem",
              border: "1px solid var(--line)",
              borderRadius: "0.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: 0 }}>
              Cleared in {moves} moves, {elapsedSec}s.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "0.4rem",
                background: "var(--accent)",
                color: "white",
                border: 0,
                padding: "0.4rem 1.2rem",
                borderRadius: "0.5rem",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Play again
            </button>
          </div>
        )}

        {!won && moves > 0 && (
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "transparent",
                color: "var(--muted)",
                border: "1px solid var(--line)",
                padding: "0.35rem 1rem",
                borderRadius: "0.5rem",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
