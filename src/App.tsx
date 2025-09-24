import { Routes, Route } from "react-router-dom";
import destinations from "./navigation/destinations";

import HomePage from "./containers/WelcomePage/HomePage";
import CreatePage from "./containers/CreatePage/CreatePage";
import ListGames from "./containers/ListPage/ListGames";

export default function App() {
  return (
    <Routes>
      {/* Ruta inicial */}
      <Route path={destinations.home} element={<HomePage />} />

      {/* Ruta para crear partida */}
      <Route path={destinations.crearPartida} element={<CreatePage />} />

      {/* Ruta para listar partidas */}
      {<Route path={destinations.listarPartidas} element={<ListGames />} />}
    </Routes>
  );
}
