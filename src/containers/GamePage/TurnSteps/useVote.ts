import { useState } from "react";
import playerService from "../../../services/playerService";

export const useVote = () => {
  const [lock, setLock] = useState(false);
  const [message, setMessage] = useState("");
  const [voted, setVoted] = useState(false);

  const handleVote = async (targetPlayerId: number) => {
    if (lock || voted) return;

    setLock(true);
    setMessage("");
    try {
      await playerService.votePlayer(targetPlayerId);
      setVoted(true);
      setMessage("Voto registrado correctamente.");
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
