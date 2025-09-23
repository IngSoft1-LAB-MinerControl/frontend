// App.tsx
import { Routes, Route } from "react-router-dom";
import destinations from "./navigation/destinations";

import HomePage from "./containers/WelcomePage/HomePage";
import FormGame from "./containers/FormGamePage/FormGame";
import ListGames from "./containers/ListGamesPage/ListGames";

export default function App() {
  return (
    <Routes>
      {/* Ruta inicial */}
      <Route path={destinations.home} element={<HomePage />} />

      {/* Ruta para crear partida */}
      <Route path={destinations.crearPartida} element={<FormGame />} />

      {/* Ruta para listar partidas */}
      <Route path={destinations.listarPartidas} element={<ListGames />} />
    </Routes>
  );
}
