import { useState, useEffect } from "react";
import playerService from "../../../services/playerService";
import { useGameContext } from "../../../context/GameContext";

export const useVote = () => {
  const { state } = useGameContext();
  const myId = state.myPlayerId;

  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");

  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (myId) {
      const isVoted = sessionStorage.getItem(`voted_${myId}`) === "true";
      setVoted(isVoted);
    }
  }, [myId]);

  const handleVote = async (targetPlayerId: number) => {
    if (lock || voted || !myId) return;

    setLock(true);
    setMessage("");
    try {
      await playerService.votePlayer(targetPlayerId, myId);
      setVoted(true);
      sessionStorage.setItem(`voted_${myId}`, "true");
      setMessage("Voto registrado correctamente.");
      // Corregir setInterval por setTimeout para un solo mensaje
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error al votar:", error);
      setMessage("No se pudo registrar el voto.");
    } finally {
      setLock(false);
    }
  };

  return {
    lock,
    message,
    voted,
    handleVote,
  };
};
