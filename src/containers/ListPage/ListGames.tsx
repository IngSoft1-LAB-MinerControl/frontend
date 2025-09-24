import "./ListGames.css";
import Button from "../../components/Button";
import { useState } from "react";

export default function ListGames() {
  type Partida = {
    id: string;
    name: string;
    minPlayers: number;
    maxPlayers: number;
    currPlayers: number;
  };

  const [partidas, setPartidas] = useState<Partida[]>([
    {
      id: "1",
      name: "Partida 1",
      minPlayers: 2,
      maxPlayers: 4,
      currPlayers: 1,
    },
    {
      id: "2",
      name: "Partida 2",
      minPlayers: 2,
      maxPlayers: 2,
      currPlayers: 2,
    },
    {
      id: "3",
      name: "Partida 3",
      minPlayers: 3,
      maxPlayers: 6,
      currPlayers: 4,
    },
  ]);

  const handleJoin = (name: string) => {
    alert(`Te uniste a la partida: ${name}`);
  };

  return (
    <div className="home-page">
      <div className="list-container">
        <h1 className="list-title">Partidas disponibles:</h1>
        <ul className="game-list">
          {partidas.map((partida) => (
            <li key={partida.id} className="list-item">
              <div>
                <div className="item-title">{partida.name}</div>
                <div className="item-data">
                  mínimo:{partida.minPlayers} • máximo: {partida.maxPlayers} •
                  actuales: {partida.currPlayers}
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  label="Unirme"
                  onClick={() => handleJoin(partida.name)}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
