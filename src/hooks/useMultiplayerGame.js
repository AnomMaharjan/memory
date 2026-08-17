import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  doc, onSnapshot, updateDoc, deleteDoc, deleteField,
} from 'firebase/firestore';
import { db } from '../firebase';
import { soundManager } from '../utils/sound';

const FLIP_DELAY_MS = 900;
const ALL_ROLES = ['player1', 'player2', 'player3', 'player4'];

/**
 * useMultiplayerGame — Real-time Firestore sync for 2–4 players, turns, scoring, rematch, and emoji reactions.
 *
 * @param {string} roomId   - Room code / Firestore document ID
 * @param {'player1'|'player2'|'player3'|'player4'} myRole - This client's player role
 * @param {string} myName   - This client's display name
 */
export function useMultiplayerGame(roomId, myRole, myName = 'Player') {
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestReaction, setLatestReaction] = useState(null);

  const disabledRef = useRef(false);
  const roomDataRef = useRef(null);
  const prevTurnRef = useRef(null);
  const prevMatchedCountRef = useRef(0);
  const prevFlippedCountRef = useRef(0);
  const lastHandledReactionIdRef = useRef(null);

  // Real-time Firestore listener
  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const unsub = onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          roomDataRef.current = data;
          setRoomData(data);
          setLoading(false);

          // Audio triggers
          if (data.status === 'playing') {
            // Turn start audio cue
            if (data.currentTurn === myRole && prevTurnRef.current !== myRole && prevTurnRef.current !== null) {
              soundManager.playTurnStart();
            }
            prevTurnRef.current = data.currentTurn;

            // Card flip audio cue
            if (data.flipped?.length > prevFlippedCountRef.current) {
              soundManager.playCardFlip();
            }
            prevFlippedCountRef.current = data.flipped?.length || 0;

            // Match sound cue
            const matchedCount = data.matched?.length || 0;
            if (matchedCount > prevMatchedCountRef.current) {
              soundManager.playMatchSuccess();
            }
            prevMatchedCountRef.current = matchedCount;
          }

          // Reaction audio and state trigger
          if (data.reaction && data.reaction.id && data.reaction.id !== lastHandledReactionIdRef.current) {
            lastHandledReactionIdRef.current = data.reaction.id;
            setLatestReaction(data.reaction);
            soundManager.playEmojiReaction(data.reaction.emoji);
          }
        } else {
          if (roomDataRef.current && roomDataRef.current.status !== 'waiting') {
            setError('The host or game ended the session.');
          } else {
            setError('Room not found or was closed.');
          }
          setLoading(false);
        }
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [roomId, myRole]);

  // Derive active players in role order (player1, player2, player3, player4)
  const activeRoles = useMemo(() => {
    return roomData?.players
      ? ALL_ROLES.filter(r => Boolean(roomData.players[r]))
      : [];
  }, [roomData?.players]);

  const playersList = useMemo(() => {
    if (!roomData?.players) return [];
    return activeRoles.map(id => {
      const p = roomData.players[id];
      return {
        id,
        name: p?.name || (id === myRole ? 'You' : 'Player'),
        isMe: id === myRole,
        score: p?.score || 0,
        isActive: roomData.currentTurn === id,
      };
    });
  }, [activeRoles, roomData?.players, roomData?.currentTurn, myRole]);

  const isMyTurn = roomData?.currentTurn === myRole;
  const myScore = roomData?.players?.[myRole]?.score ?? 0;

  // Cycle to next active player
  const getNextTurn = useCallback((currentTurn) => {
    if (!activeRoles.length) return 'player1';
    const currentIndex = activeRoles.indexOf(currentTurn);
    if (currentIndex === -1) return activeRoles[0];
    return activeRoles[(currentIndex + 1) % activeRoles.length];
  }, [activeRoles]);

  // Flip card
  const flipCard = useCallback(async (index) => {
    if (!isMyTurn) return;
    if (disabledRef.current) return;
    if (!roomData || roomData.status !== 'playing') return;

    const { flipped = [], matched = [], matchedBy = {}, deck, currentTurn } = roomData;
    if (flipped.includes(index)) return;
    if (matched.includes(deck[index]?.pairId)) return;

    const newFlipped = [...flipped, index];
    const roomRef = doc(db, 'rooms', roomId);

    if (newFlipped.length === 1) {
      await updateDoc(roomRef, {
        flipped: newFlipped,
        turnUpdatedAt: new Date().toISOString(),
      });
      return;
    }

    // Two cards flipped
    disabledRef.current = true;
    await updateDoc(roomRef, { flipped: newFlipped });

    const [a, b] = newFlipped;
    const cardA = deck[a];
    const cardB = deck[b];

    await new Promise(r => setTimeout(r, FLIP_DELAY_MS));

    if (cardA.pairId === cardB.pairId) {
      // Match — same player keeps turn, score ++
      const newMatched = [...matched, cardA.pairId];
      const newMatchedBy = { ...matchedBy, [cardA.pairId]: myRole };
      const newScore = (roomData.players?.[myRole]?.score ?? 0) + 1;
      const allMatched = newMatched.length === deck.length / 2;

      let winner = null;
      if (allMatched) {
        // Calculate rankings
        const scores = activeRoles.map(r => ({
          role: r,
          score: r === myRole ? newScore : (roomData.players[r]?.score || 0),
        }));
        scores.sort((s1, s2) => s2.score - s1.score);

        if (scores.length > 1 && scores[0].score === scores[1].score) {
          winner = 'draw';
        } else {
          winner = scores[0].role;
        }
      }

      await updateDoc(roomRef, {
        flipped: [],
        matched: newMatched,
        matchedBy: newMatchedBy,
        [`players.${myRole}.score`]: newScore,
        status: allMatched ? 'finished' : 'playing',
        winner,
        turnUpdatedAt: new Date().toISOString(),
      });
    } else {
      // No match — cycle to next player
      await updateDoc(roomRef, {
        flipped: [],
        currentTurn: getNextTurn(currentTurn),
        turnUpdatedAt: new Date().toISOString(),
      });
    }

    disabledRef.current = false;
  }, [roomId, roomData, isMyTurn, myRole, activeRoles, getNextTurn]);

  // Start game (Host only)
  const startGame = useCallback(async (deck) => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      deck,
      status: 'playing',
      currentTurn: 'player1',
      flipped: [],
      matched: [],
      matchedBy: {},
      winner: null,
      turnUpdatedAt: new Date().toISOString(),
    });
  }, [roomId]);

  // Send emoji tease reaction
  const sendReaction = useCallback(async (emoji) => {
    if (!roomId || !myRole) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const reactionPayload = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderRole: myRole,
        senderName: roomData?.players?.[myRole]?.name || myName || 'Player',
        emoji,
        timestamp: Date.now(),
      };
      await updateDoc(roomRef, {
        reaction: reactionPayload,
      });
    } catch (err) {
      console.warn('Failed to send reaction:', err);
    }
  }, [roomId, myRole, roomData, myName]);

  // Leave room gracefully
  const leaveRoom = useCallback(async () => {
    try {
      sessionStorage.removeItem('memory_game_session');
    } catch {
      // ignore
    }
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      if (myRole === 'player1' || activeRoles.length <= 1) {
        // Host leaves or last player left -> delete room
        await deleteDoc(roomRef);
      } else {
        // Guest leaves -> vacate slot
        const updates = {
          [`players.${myRole}`]: deleteField(),
        };
        // If it was this guest's turn, advance turn
        if (roomData?.currentTurn === myRole) {
          updates.currentTurn = getNextTurn(myRole);
          updates.flipped = [];
          updates.turnUpdatedAt = new Date().toISOString();
        }
        await updateDoc(roomRef, updates);
      }
    } catch (err) {
      console.warn('Error during leaveRoom:', err);
    }
  }, [roomId, myRole, activeRoles.length, roomData?.currentTurn, getNextTurn]);

  // Rematch request & accept
  const requestPlayAgain = useCallback(async () => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'play_again_requested',
      playAgainRequestedBy: myRole,
      turnUpdatedAt: new Date().toISOString(),
    });
  }, [roomId, myRole]);

  const acceptPlayAgain = useCallback(async (newDeck) => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    const updates = {
      status: 'playing',
      deck: newDeck,
      currentTurn: 'player1',
      flipped: [],
      matched: [],
      matchedBy: {},
      winner: null,
      playAgainRequestedBy: null,
      turnUpdatedAt: new Date().toISOString(),
    };
    activeRoles.forEach((r) => {
      updates[`players.${r}.score`] = 0;
    });
    await updateDoc(roomRef, updates);
  }, [roomId, activeRoles]);

  // Turn timer countdown (10s)
  const [turnTimeLeft, setTurnTimeLeft] = useState(10);

  useEffect(() => {
    if (!roomData || roomData.status !== 'playing' || roomData.winner) {
      setTurnTimeLeft(10);
      return;
    }

    const interval = setInterval(() => {
      const updatedTime = new Date(roomData.turnUpdatedAt || Date.now()).getTime();
      const elapsed = (Date.now() - updatedTime) / 1000;
      const left = Math.max(0, 10 - Math.floor(elapsed));
      setTurnTimeLeft(prev => (prev === left ? prev : left));

      // Auto pass turn if time expires on current player's turn
      if (left === 0 && isMyTurn && !disabledRef.current) {
        disabledRef.current = true;
        const next = getNextTurn(roomData.currentTurn);
        updateDoc(doc(db, 'rooms', roomId), {
          currentTurn: next,
          flipped: [],
          turnUpdatedAt: new Date().toISOString(),
        })
          .then(() => { disabledRef.current = false; })
          .catch(() => { disabledRef.current = false; });
      } else if (left === 0 && !disabledRef.current && elapsed >= 12) {
        // Fail-safe: if current player timed out >12s and hasn't passed (e.g. disconnected),
        // next active player or host advances turn so game doesn't freeze
        const next = getNextTurn(roomData.currentTurn);
        const shouldAdvance = (myRole === next) || (myRole === 'player1' && !activeRoles.includes(roomData.currentTurn));
        if (shouldAdvance) {
          disabledRef.current = true;
          updateDoc(doc(db, 'rooms', roomId), {
            currentTurn: next,
            flipped: [],
            turnUpdatedAt: new Date().toISOString(),
          })
            .then(() => { disabledRef.current = false; })
            .catch(() => { disabledRef.current = false; });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [roomData, isMyTurn, roomId, myRole, activeRoles, getNextTurn]);

  // Calculate full rankings for finished games
  const rankings = useMemo(() => {
    if (!roomData?.players) return [];
    return activeRoles.map((role) => ({
      role,
      name: roomData.players[role]?.name || 'Player',
      score: roomData.players[role]?.score || 0,
      isMe: role === myRole,
    })).sort((a, b) => b.score - a.score);
  }, [activeRoles, roomData?.players, myRole]);

  return {
    roomData,
    loading,
    error,
    isMyTurn,
    myScore,
    playersList,
    activeRoles,
    turnTimeLeft,
    latestReaction,
    rankings,
    flipCard,
    startGame,
    sendReaction,
    leaveRoom,
    requestPlayAgain,
    acceptPlayAgain,
  };
}
