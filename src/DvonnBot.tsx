
import { DvonnState, Action, PlaceAction, MoveAction } from './DvonnGame';

type ActionValue = { action: Action, value: number };

class DvonnBot {
    depth: number;

    constructor(depth: number = 1) {
        this.depth = depth;
    }

    evaluatePlacePiecesGameState(gameState: DvonnState, player: number): number {
      const distanceCoefficient = 1;
      const distances = this.calculateAverageDistancesFromDvonn(gameState);
      const distanceDiff = player == 0 ? distances[1] - distances[0] : distances[0] - distances[1];
      return distanceCoefficient * distanceDiff;
    }

    evaluateGameStateUsingMinMax(gameState: DvonnState, player: number, depth: number): number {

      if (depth === 0) {
        return this.evaluateGameState(gameState, player);
      }

      const doMaximize = (player === gameState.currentPlayer);

      let bestScore = doMaximize ? -Infinity : Infinity;

      const legalActions = gameState.legalActions;
        for (const action of legalActions) {
          const newState = gameState.clone() as DvonnState;
          newState.applyAction(action);
          if (newState === null) {
            continue; // Skip invalid actions
          }

          const score = this.evaluateGameStateUsingMinMax(newState, player, depth - 1);

          if (doMaximize) {
            if (score > bestScore) {
              bestScore = score;
            }
          } else {
            if (score < bestScore) {
              bestScore = score;
            }
          }
        }

        return bestScore;
    }

    calculateAverageDistancesFromDvonn(gameState: DvonnState) : number[] {
      const board = gameState.board;
      
      const distances = [0, 0];
      const pieces = [0, 0];

      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          
          if (gameState.board[i][j].type === 0 || gameState.board[i][j].type === 1) {

            let minDistance = Infinity;
            for (const dvonnPosition of gameState.dvonnPositions) {
              const distance = Math.abs(i - dvonnPosition[0]) + Math.abs(j - dvonnPosition[1]);
              if (distance < minDistance) {
                minDistance = distance;
              }
            }
            const playerPiece = gameState.board[i][j].type;
            distances[playerPiece] += minDistance ;
            pieces[playerPiece]++;
          }
        }
      }

      distances[0] = distances[0] / pieces[0];
      distances[1] = distances[1] / pieces[1];

      return distances;
    }

    evaluateGameState(gameState: DvonnState, player: number): number {
        // Implement your heuristic evaluation function here

        if (gameState.phase === "PlacePieces") {
          const temp =  this.evaluatePlacePiecesGameState(gameState, player);
          return temp;
          
        } else {
          const scores = gameState.scores;
          return scores[player] - scores[1 - player];

        }

        
    }

    selectBestMove(gameState: DvonnState): Action {

      
      let bestScore = -Infinity;
      let bestMove = gameState.legalActions[0]

      const player = gameState.currentPlayer;

      // // Iterate over all possible actions
      for (const action of gameState.legalActions) {
          // Simulate making the action
          const newState = gameState.clone() as DvonnState;
          newState.applyAction(action);
  
          // Evaluate the resulting game state
          const score = this.evaluateGameStateUsingMinMax(newState, player, this.depth);
  
          // Update the best move if this move is better
          if (score > bestScore || (score === bestScore && Math.random() < 0.5)) {
              bestScore = score;
              bestMove = action;
          }
      }

      return bestMove;
  }
  
}

export default DvonnBot;
