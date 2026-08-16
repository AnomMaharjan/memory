import { useState, useEffect, useCallback, useRef } from 'react';
import { createDeck, DIFFICULTY_CONFIG } from '../utils/deck';
import { soundManager } from '../utils/sound';

const FLIP_DELAY_MS = 900;

/**
 * Single-player memory game hook with support for Blitz, Combo Streak, and Flash Peek modes.
 *
 * @param {'quick'|'easy'|'medium'|'hard'|'master'} difficulty
 * @param {'classic'|'blitz'|'combo'|'flash'} gameMode
 */
export function useGame(difficulty = 'easy', gameMode = 'classic') {
  const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.easy;
  const initialTime = gameMode === 'blitz' ? 30 : config.time;

  const [deck, setDeck] = useState(() => createDeck(difficulty));
  const [flipped, setFlipped] = useState([]);       // indices of currently face-up cards (max 2)
  const [matched, setMatched] = useState(new Set()); // pairIds that have been matched
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [gameOver, setGameOver] = useState(false);   // true = time ran out
  const [won, setWon] = useState(false);
  const [disabled, setDisabled] = useState(false);   // block clicks while checking pair

  // Modifier state
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timeBonus, setTimeBonus] = useState(null); // { amount: '+4s' | '-2s', id: number }
  const [isPeeking, setIsPeeking] = useState(gameMode === 'flash');
  const [peekCountdown, setPeekCountdown] = useState(gameMode === 'flash' ? 3 : 0);

  const timerRef = useRef(null);
  const peekTimerRef = useRef(null);
  const totalPairs = deck.length / 2;

  // Flash peek countdown effect
  useEffect(() => {
    if (gameMode !== 'flash') {
      setIsPeeking(false);
      return;
    }
    setIsPeeking(true);
    setPeekCountdown(3);

    let count = 3;
    peekTimerRef.current = setInterval(() => {
      count -= 1;
      setPeekCountdown(count);
      if (count <= 0) {
        clearInterval(peekTimerRef.current);
        setIsPeeking(false);
      }
    }, 1000);

    return () => clearInterval(peekTimerRef.current);
  }, [gameMode, deck]);

  // Main countdown timer (pauses while peeking)
  useEffect(() => {
    if (won || gameOver || isPeeking) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameOver(true);
          soundManager.playGameOver();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [won, gameOver, isPeeking]);

  // Win detection
  useEffect(() => {
    if (matched.size === totalPairs && totalPairs > 0) {
      clearInterval(timerRef.current);
      setWon(true);
      soundManager.playVictory();
    }
  }, [matched.size, totalPairs]);

  const flipCard = useCallback((index) => {
    if (disabled || isPeeking) return;
    if (flipped.includes(index)) return;
    if (matched.has(deck[index].pairId)) return;
    if (gameOver || won) return;

    soundManager.playCardFlip();
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setDisabled(true);

      const [a, b] = newFlipped;
      if (deck[a].pairId === deck[b].pairId) {
        // Match!
        soundManager.playMatchSuccess();
        setMatched(prev => new Set([...prev, deck[a].pairId]));
        setFlipped([]);
        setDisabled(false);

        // Blitz modifier: +4 seconds bonus
        if (gameMode === 'blitz') {
          setTimeLeft(t => Math.min(120, t + 4));
          setTimeBonus({ amount: '+4s', type: 'bonus', id: Date.now() });
        }

        // Combo modifier: multiplier calculation
        setStreak(s => {
          const next = s + 1;
          setBestStreak(b => Math.max(b, next));
          const pointsEarned = 100 * next;
          setScore(sc => sc + pointsEarned);
          return next;
        });
      } else {
        // No match — flip back after delay
        if (gameMode === 'blitz') {
          setTimeLeft(t => Math.max(1, t - 2));
          setTimeBonus({ amount: '-2s', type: 'penalty', id: Date.now() });
        }
        setStreak(0);

        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, FLIP_DELAY_MS);
      }
    }
  }, [deck, disabled, isPeeking, flipped, matched, gameOver, won, gameMode]);

  const restart = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(peekTimerRef.current);
    setDeck(createDeck(difficulty));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setTimeLeft(initialTime);
    setGameOver(false);
    setWon(false);
    setDisabled(false);
    setStreak(0);
    setScore(0);
    setTimeBonus(null);

    if (gameMode === 'flash') {
      setIsPeeking(true);
      setPeekCountdown(3);
    } else {
      setIsPeeking(false);
    }
  }, [difficulty, initialTime, gameMode]);

  return {
    deck,
    flipped: isPeeking ? deck.map((_, i) => i) : flipped,
    matched,
    moves,
    timeLeft,
    initialTime,
    gameOver,
    won,
    streak,
    bestStreak,
    score,
    timeBonus,
    isPeeking,
    peekCountdown,
    gameMode,
    flipCard,
    restart,
  };
}
