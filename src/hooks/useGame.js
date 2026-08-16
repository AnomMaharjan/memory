import { useState, useEffect, useCallback, useRef } from 'react';
import { createDeck, DIFFICULTY_CONFIG } from '../utils/deck';

const FLIP_DELAY_MS = 900; // how long mismatched cards stay shown before flipping back

/**
 * Single-player memory game hook.
 * Manages deck, flipped state, matched state, moves, timer, and win detection.
 *
 * @param {'easy'|'medium'|'hard'} difficulty
 */
export function useGame(difficulty = 'easy') {
  const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.easy;
  const initialTime = config.time;

  const [deck, setDeck] = useState(() => createDeck(difficulty));
  const [flipped, setFlipped] = useState([]);       // indices of currently face-up cards (max 2)
  const [matched, setMatched] = useState(new Set()); // pairIds that have been matched
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [gameOver, setGameOver] = useState(false);   // true = time ran out
  const [won, setWon] = useState(false);
  const [disabled, setDisabled] = useState(false);   // block clicks while checking pair
  const timerRef = useRef(null);

  const totalPairs = deck.length / 2;

  // Countdown timer
  useEffect(() => {
    if (won || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [won, gameOver]);

  // Win detection
  useEffect(() => {
    if (matched.size === totalPairs && totalPairs > 0) {
      clearInterval(timerRef.current);
      setWon(true);
    }
  }, [matched.size, totalPairs]);

  const flipCard = useCallback((index) => {
    if (disabled) return;
    if (flipped.includes(index)) return;
    if (matched.has(deck[index].pairId)) return;
    if (gameOver || won) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setDisabled(true);

      const [a, b] = newFlipped;
      if (deck[a].pairId === deck[b].pairId) {
        // Match!
        setMatched(prev => new Set([...prev, deck[a].pairId]));
        setFlipped([]);
        setDisabled(false);
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, FLIP_DELAY_MS);
      }
    }
  }, [deck, disabled, flipped, matched, gameOver, won]);

  const restart = useCallback(() => {
    clearInterval(timerRef.current);
    setDeck(createDeck(difficulty));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setTimeLeft(initialTime);
    setGameOver(false);
    setWon(false);
    setDisabled(false);
  }, [difficulty, initialTime]);

  return {
    deck,
    flipped,
    matched,
    moves,
    timeLeft,
    initialTime,
    gameOver,
    won,
    flipCard,
    restart,
  };
}
