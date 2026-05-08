import { useEffect, useMemo, useState } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";

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

  const won = useMemo(() => tiles.every((t) => t.matched), [tiles]);

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
      const id = window.setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) => (t.id === a || t.id === b ? { ...t, matched: true } : t)),
        );
        setFlipped([]);
      }, 350);
      return () => window.clearTimeout(id);
    } else {
      // No match — flip both back after a beat.
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
        />
      }
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden p-2">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, min(22vw, calc((100svh - 5rem) / 4.6), 120px))",
            gridTemplateRows: "repeat(4, min(22vw, calc((100svh - 5rem) / 4.6), 120px))",
            gap: "clamp(0.3rem, 1.2vmin, 0.6rem)",
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
