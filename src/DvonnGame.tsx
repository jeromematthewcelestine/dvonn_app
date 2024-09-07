import { findIslands } from './utils';
import { MCTSGameState } from './mcts';

export type Phase = 
  | "PlaceDvonnPieces"
  | "PlacePieces"
  | "MovePieces" 
  | "GameOver";
export type PlaceAction = { type: 'place'; row: number; col: number };
export type MoveAction = { type: 'move'; from: { row: number; col: number }; to: { row: number; col: number } };
export type Action = PlaceAction | MoveAction;
export type CellState = { type: number; height: number; dvonn: boolean };
// -2 is oob, -1 is empty, 0 is player 0, 1 is player 1, 2 is dvonn
export type DvonnPlayer = 2;
// export type Player = 0 | 1 | DvonnPlayer;

const directions = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
];


export class DvonnState implements MCTSGameState {
  boardRows: number;
  boardCols: number;
  board: CellState[][];
  pieces: number[];
  dvonn_pieces: number;
  dvonnPositions: number[][];
  currentPlayer: number;
  phase: Phase;
  legalActions: Action[];
  gameOver: boolean;
  winner: number | null;
  scores: number[];
  lastAction: Action | null;
  lastActionPlayer: number;

  constructor(boardRows = 5, boardCols = 11) {
    this.boardRows = boardRows;
    this.boardCols = boardCols;
    this.board = Array(boardRows).fill(null).map(() => Array(boardCols).fill(
      {type: -1, height: 0, dvonn: false}
    ));

    this.board[0][0] = { type: -2, height: 0, dvonn: false };
    this.board[0][1] = { type: -2, height: 0, dvonn: false };
    this.board[1][0] = { type: -2, height: 0, dvonn: false };
    this.board[3][10] = { type: -2, height: 0, dvonn: false };
    this.board[4][9] = { type: -2, height: 0, dvonn: false };
    this.board[4][10] = { type: -2, height: 0, dvonn: false };

    this.gameOver = false;
    this.winner = null;
    this.scores = [0, 0];

    this.pieces = [23, 23]; // Each player starts with 23 pieces
    this.dvonn_pieces = 3;
    this.dvonnPositions = [];
    this.currentPlayer = 0;
    this.phase = "PlaceDvonnPieces";

    this.lastAction = null;
    this.lastActionPlayer = -2;
    this.legalActions = this.getLegalActions();
  }

  clone(): MCTSGameState {
    const newState = new DvonnState(this.boardRows, this.boardCols);
    
    newState.board = this.board.map(row => [...row]);

    newState.pieces = [...this.pieces];
    newState.dvonn_pieces = this.dvonn_pieces;
    newState.dvonnPositions = this.dvonnPositions.map(pos => [...pos]);
    newState.currentPlayer = this.currentPlayer;
    newState.phase = this.phase;
    newState.legalActions = [...this.legalActions];
    newState.scores = [...this.scores];
    newState.lastAction = this.lastAction;
    newState.lastActionPlayer = this.lastActionPlayer;
    
    newState.gameOver = this.gameOver;
    newState.winner = this.winner;

    return newState;
  }

  getNPlayers(): number {
    return 2;
  }

  getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  getWinner(): number | null {
    return this.winner;
  }

  getValues(): number[] {
    let values = [0, 0];
    if (this.isGameOver()) {
      if (this.winner === 0) {
        values = [1, 0];
      } else if (this.winner === 1) {
        values = [0, 1];
      } else {
        values = [0.5, 0.5];
      }
    }
    return values;
  }

  applyAction(action: Action): void {
    if (this.phase === "PlaceDvonnPieces" && action.type === 'place') {
      this.doPlaceDvonnPiece(action as PlaceAction);

    } else if (this.phase === "PlacePieces" && action.type === 'place') {
      this.doPlacePiece(action as PlaceAction);

    } else if (this.phase === "MovePieces" && action.type === 'move') {      
      this.doMovePiece(action as MoveAction);

    }
  }

  doPlaceDvonnPiece(action : PlaceAction): void {
    // console.log('doPlaceDvonnPiece', action);
    const { row, col } = action;
    if (this.phase !== "PlaceDvonnPieces" || this.board[row][col].type !== -1) {
      return;
    }
    // console.log('this.legalActions', this.legalActions);
    const same_move_action = (action: Action) => { 
      return (action as PlaceAction).row === row && 
      (action as PlaceAction).col === col; }
    if (!this.legalActions.some(same_move_action)) {
      return;
    }

    this.board[row][col] = { type: 2, height: 1, dvonn: true };
    this.dvonn_pieces--;
    this.dvonnPositions.push([row, col]);
    if (this.dvonn_pieces === 0) {
      this.phase = "PlacePieces";
      // do not update current player
    } else {
      this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    }
    
    this.lastAction = action;
    this.lastActionPlayer = this.currentPlayer;
  }

  doPlacePiece(action : PlaceAction): void {
    const { row, col } = action;
    if (this.phase !== "PlacePieces") {
      return;
    }

    if (this.board[row][col].type !== -1) {
      return;
    }

    this.board[row][col] = { type: this.currentPlayer, height: 1, dvonn: false };
    this.pieces[this.currentPlayer]--;
    const nextPlayer = this.currentPlayer === 0 ? 1 : 0;
    this.currentPlayer = nextPlayer;
    if (this.pieces[nextPlayer] === 0) {
      this.phase = "MovePieces";
    }
    this.legalActions = this.getLegalActions();

    this.lastAction = action;
    this.lastActionPlayer = this.currentPlayer;
    
    this.updateScores();
  }

  doMovePiece(action : MoveAction): void {
    const { from, to } = action;

    const fromPiece = this.board[from.row][from.col];
    const toPiece = this.board[to.row][to.col];

    if (fromPiece === null || toPiece === null) {
      return;
    }
    if (this.phase !== "MovePieces") {
      return;
    }
    if (!this.legalActions.some(
      legalAction => 
        (legalAction as MoveAction).from.row === from.row && 
        (legalAction as MoveAction).from.col === from.col && 
        (legalAction as MoveAction).to.row === to.row && 
        (legalAction as MoveAction).to.col === to.col)) {
      return;
    }

    const toPositionPlayer = this.currentPlayer;
    const newToHeight = fromPiece.height + toPiece.height;
    const newToDvonn = fromPiece.dvonn || toPiece.dvonn;  

    const newToPiece: CellState = { type: toPositionPlayer, height: newToHeight, dvonn: newToDvonn };
    if (fromPiece.dvonn) {
      this.dvonnPositions = this.dvonnPositions.filter(pos => pos[0] !== from.row || pos[1] !== from.col);
      this.dvonnPositions.push([to.row, to.col]);
    }

    this.board[to.row][to.col] = newToPiece;
    this.board[from.row][from.col] = { type: -1, height: 0, dvonn: false };

    // save the last action for rendering
    this.lastAction = action;
    this.lastActionPlayer = this.currentPlayer;

    // update board and scores
    this.board = this.loseNonDvonnIslands(this.board);
    this.updateScores();

    // update player
    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    this.legalActions = this.getLegalActions();

    // check if updated player can move
    if (this.legalActions.length === 0) {

      // if not, revert back to original player
      this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
      this.legalActions = this.getLegalActions();

      // check if original player can move
      if (this.legalActions.length === 0) {

        // if not, game over
        this.gameOver = true;
        this.phase = "GameOver";

        this.updateWinner();
      }
    }
  }

  updateScores() {
    let player0Count = 0;
    let player1Count = 0;
    for (let row = 0; row < this.boardRows; row++) {
      for (let col = 0; col < this.boardCols; col++) {
        const cell = this.board[row][col];
        if (cell !== null) {
          if (cell.type === 0) {
            player0Count += cell.height;
          } else if (cell.type === 1) {
            player1Count += cell.height;
          }
        }
      }
    }
    this.scores = [player0Count, player1Count];
  }

  updateWinner() {
    if (this.scores[0] > this.scores[1]) {
      this.winner = 0;
    } else if (this.scores[0] < this.scores[1]) {
      this.winner = 1;
    } else {
      this.winner = 2;
    }
  }

  loseNonDvonnIslands(board: CellState[][]): CellState[][] {
    // console.log('loseNonDvonnIslands')

    const islands = findIslands(board);
    // console.log('islands', islands)
    
    const newBoard = board.map(row => [...row]);

    for (const island of islands) {
      let dvonnFound = false;
      for (const [row, col] of island) {
        if (newBoard[row][col].dvonn == true) {
          dvonnFound = true;
          break;
        }
      }
      if (!dvonnFound) {
        // console.log('no dvonn found')
        for (const [row, col] of island) {
          newBoard[row][col] = { type: -1, height: 0, dvonn: false };
        }
      }
    }

    return newBoard;
  }

  getLegalPlaceDvonnPieceActions(): Action[] {
    const legalActions: Action[] = [];
    for (let row = 0; row < this.boardRows; row++) {
      for (let col = 0; col < this.boardCols; col++) {
        if (this.board[row][col].type === -1) {
          legalActions.push({ type:'place', row, col });
        }
      }
    }
    return legalActions;
  }

  getLegalPlacePieceActions(): Action[] {
    const legalActions: Action[] = [];
    for (let row = 0; row < this.boardRows; row++) {
      for (let col = 0; col < this.boardCols; col++) {
        if (this.board[row][col].type === -1) {
          legalActions.push({ type:'place', row, col });
        }
      }
    }
    return legalActions;
  }

  getLegalMovesFromLoc(fromLoc: { row: number; col: number }): Action[] {
    const legalActions: Action[] = [];
    const fromPiece = this.board[fromLoc.row][fromLoc.col];
    if (fromPiece === null) {
      return legalActions;
    }
    const moveDistance = fromPiece.height;

    for (const direction of directions) {
      const toLoc = { row: fromLoc.row + direction.row * moveDistance, col: fromLoc.col + direction.col * moveDistance };
      if (toLoc.row >= 0 && toLoc.row < this.boardRows && toLoc.col >= 0 && toLoc.col < this.boardCols) {
        if (this.board[toLoc.row][toLoc.col].type === 0 || this.board[toLoc.row][toLoc.col].type === 1 || this.board[toLoc.row][toLoc.col].type === 2) {
          legalActions.push({ type: 'move', from: fromLoc, to: toLoc });
        }
      }
    }
    // console.log('legalActions', legalActions); 

    return legalActions;
  }

  getLegalMovePieceActions(): Action[] {
    // console.log('getLegalMovePieceActions');

    const legalActions: Action[] = [];
    for (let row = 0; row < this.boardRows; row++) {
      for (let col = 0; col < this.boardCols; col++) {

        if (this.board[row][col].type === this.currentPlayer) {
          let surrounded = true;
          
          for (const direction of directions) {
            const toLoc = { row: row + direction.row, col: col + direction.col };
            if (toLoc.row < 0 || toLoc.row >= this.boardRows || 
              toLoc.col < 0 || toLoc.col >= this.boardCols || 
              this.board[toLoc.row][toLoc.col].type === -1 ||
              this.board[toLoc.row][toLoc.col].type === -2) {
              surrounded = false;
              break;
            }
          }
          if (surrounded) {
            continue;
          }

          const fromLoc = { row, col };
          const moves = this.getLegalMovesFromLoc(fromLoc);
          moves.forEach(move => legalActions.push(move));
        }
      }
    }
    return legalActions;
  }

  getLegalActions(): Action[] {
    let legalActions: Action[] = [];
    if (this.phase === "PlaceDvonnPieces") {
      legalActions = this.getLegalPlaceDvonnPieceActions();
    } else if (this.phase === "PlacePieces") {
      legalActions = this.getLegalPlacePieceActions();
    } else if (this.phase === "MovePieces") {
      legalActions = this.getLegalMovePieceActions();
    } else {
      legalActions = [];
    }
    // console.log('legalActions', legalActions);  
    return legalActions;
  }
}
