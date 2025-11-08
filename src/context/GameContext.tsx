import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
  type Dispatch,
} from "react";
import type { PlayerStateResponse } from "../services/playerService";
import type { GameResponse } from "../services/gameService";
import type { CardResponse } from "../services/cardService";
import type { SetResponse } from "../services/setService";
import type { SecretResponse } from "../services/secretService";
import type { Steps } from "../containers/GamePage/TurnActionsTypes"; // Ajusta la ruta si es necesario

// --- 1. DEFINICIÓN DEL ESTADO ---
// Este es el "cerebro" que almacena todo
export interface IGameState {
  // Estado del juego (viene de WS/API)
  game: GameResponse;
  players: PlayerStateResponse[];
  discardPile: CardResponse[];
  draftPile: CardResponse[];
  myPlayerId: number;

  // Estado de la UI (lo que el usuario selecciona)
  currentStep: Steps;
  selectedCardIds: number[];
  selectedCard: CardResponse | null;
  selectedSet: SetResponse | null;
  selectedSecret: SecretResponse | null;
  selectedTargetPlayer: PlayerStateResponse | null;
  activeEventCard: CardResponse | null;
  directionFolly: string | null;

  // Estado de carga y errores
  error: string | null;
  isLoading: boolean;
}

// --- 2. DEFINICIÓN DE ACCIONES ---
// Lista de "órdenes" que podemos darle al reducer
export type GameAction =
  // Acciones de WebSocket (actualizar estado)
  | { type: "SET_PLAYERS"; payload: PlayerStateResponse[] }
  | { type: "SET_GAME"; payload: GameResponse }
  | { type: "SET_DISCARD_PILE"; payload: CardResponse[] }
  | { type: "SET_DRAFT_PILE"; payload: CardResponse[] }

  // Acciones de UI (selección)
  | { type: "SET_STEP"; payload: Steps }
  | { type: "TOGGLE_HAND_CARD_ID"; payload: number }
  | { type: "SET_SELECTED_CARD"; payload: CardResponse | null }
  | { type: "SET_SELECTED_SET"; payload: SetResponse | null }
  | { type: "SET_SELECTED_SECRET"; payload: SecretResponse | null }
  | { type: "SET_SELECTED_TARGET_PLAYER"; payload: PlayerStateResponse | null }
  | { type: "CLEAR_SELECTIONS" } // Resetea todas las selecciones
  | { type: "SET_ACTIVE_EVENT"; payload: CardResponse | null }
  | { type: "SET_TRADE_DIRECTION"; payload: string | null }

  // Acciones de Carga/Error
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

// --- 3. EL REDUCER ---
// La función que procesa las "órdenes" y devuelve el NUEVO estado
export const gameReducer = (
  state: IGameState,
  action: GameAction
): IGameState => {
  switch (action.type) {
    // Casos de WS
    case "SET_PLAYERS":
      return { ...state, players: action.payload };
    case "SET_GAME":
      return { ...state, game: action.payload };
    case "SET_DISCARD_PILE":
      return { ...state, discardPile: action.payload };
    case "SET_DRAFT_PILE":
      return { ...state, draftPile: action.payload };

    // Casos de UI
    case "SET_STEP":
      return { ...state, currentStep: action.payload };

    case "TOGGLE_HAND_CARD_ID": {
      const id = action.payload;
      const newIds = state.selectedCardIds.includes(id)
        ? state.selectedCardIds.filter((cid) => cid !== id)
        : [...state.selectedCardIds, id];
      return { ...state, selectedCardIds: newIds, selectedCard: null };
    }

    case "SET_SELECTED_CARD":
      return { ...state, selectedCard: action.payload, selectedCardIds: [] };

    case "SET_SELECTED_SET":
      return { ...state, selectedSet: action.payload };

    case "SET_SELECTED_SECRET":
      return { ...state, selectedSecret: action.payload };

    case "SET_SELECTED_TARGET_PLAYER":
      return { ...state, selectedTargetPlayer: action.payload };

    case "SET_ACTIVE_EVENT":
      return { ...state, activeEventCard: action.payload };

    case "SET_TRADE_DIRECTION":
      return { ...state, directionFolly: action.payload };

    case "CLEAR_SELECTIONS":
      return {
        ...state,
        currentStep: "start",
        selectedCardIds: [],
        selectedCard: null,
        selectedSet: null,
        selectedSecret: null,
        selectedTargetPlayer: null,
        activeEventCard: null,
      };

    // Casos de Carga/Error
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    default:
      return state;
  }
};

// --- 4. CREACIÓN DEL CONTEXTO ---
export interface IGameContextProps {
  state: IGameState;
  dispatch: Dispatch<GameAction>;
  // Selectores (valores calculados)
  currentPlayer: PlayerStateResponse | undefined;
  isMyTurn: boolean;
  isSocialDisgrace: boolean;
}

const GameContext = createContext<IGameContextProps | undefined>(undefined);

// --- 5. EL PROVEEDOR ---
// Este componente envolverá tu juego
interface GameProviderProps {
  children: ReactNode;
  initialGame: GameResponse;
  myPlayerId: number;
}

export const GameProvider = ({
  children,
  initialGame,
  myPlayerId,
}: GameProviderProps) => {
  // Estado inicial del reducer
  const initialState: IGameState = {
    game: initialGame,
    players: [],
    discardPile: [],
    draftPile: [],
    myPlayerId: myPlayerId,
    currentStep: "start",
    selectedCardIds: [],
    selectedCard: null,
    selectedSet: null,
    selectedSecret: null,
    selectedTargetPlayer: null,
    activeEventCard: null,
    error: null,
    isLoading: false,
    directionFolly: null,
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // --- Selectores (Valores calculados) ---
  // Los calculamos aquí una vez y los proveemos al contexto.
  // Así, los componentes no tienen que recalcularlos.

  const currentPlayer = useMemo(
    () => state.players.find((p) => p.player_id === state.myPlayerId),
    [state.players, state.myPlayerId]
  );

  const isMyTurn = useMemo(
    () => currentPlayer?.turn_order === state.game.current_turn,
    [currentPlayer, state.game.current_turn]
  );

  const isSocialDisgrace = useMemo(
    () => currentPlayer?.social_disgrace === true,
    [currentPlayer]
  );

  // El valor que será accesible por todos los componentes hijos
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      currentPlayer,
      isMyTurn,
      isSocialDisgrace,
    }),
    [state, dispatch, currentPlayer, isMyTurn, isSocialDisgrace]
  );

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

// --- 6. EL HOOK PERSONALIZADO ---
// Así es como los componentes consumirán el contexto
export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext debe ser usado dentro de un GameProvider");
  }
  return context;
};
