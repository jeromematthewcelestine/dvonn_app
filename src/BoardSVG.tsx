import React, { useState } from 'react';
import './BoardSVG.css';
import { DvonnState, Action, MoveAction } from './DvonnGame';

interface BoardProps {
  gameState: DvonnState;
  onAction: (action: Action) => void;
  orientation: 'horizontal' | 'vertical';
}

const PLAYER_0_COLOR = '#aaa';
const PLAYER_1_COLOR = 'black';
const DVONN_COLOR = 'firebrick';
const moveFromColor = 'papayawhip';
const moveToColor = 'papayawhip';

const HEX_SIZE = 25; // Radius of the hexagon
const CIRCLE_SIZE = HEX_SIZE * 0.75; // Radius of the circle inside the hexagon
const SMALL_CIRCLE_SIZE = CIRCLE_SIZE * 0.5; // Radius of the smaller circle for dvonn pieces
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;
// const FAINT_CIRCLE_SIZE = 2 * SMALL_CIRCLE_SIZE;

const GLOBAL_X_OFFSET_HORIZONTAL = 5;
const GLOBAL_Y_OFFSET_HORIZONTAL = 5;

const GLOBAL_X_OFFSET_VERTICAL = -13;
const GLOBAL_Y_OFFSET_VERTICAL = -8;

const BoardSVG: React.FC<BoardProps> = ({ gameState, onAction, orientation }) => {
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);

  const handleCellClick = (row: number, col: number) => {
    // console.log('handleCellClick', row, col);
    if (gameState.phase === 'PlaceDvonnPieces') {
      onAction({ type:'place', row, col });
    } else if (gameState.phase === 'PlacePieces') {
      onAction({ type:'place', row, col });
    } else if (gameState.phase === 'MovePieces') {
      // console.log('selectedPiece', selectedPiece);
      if (selectedPiece === null) {
        const cell = gameState.board[row][col];
        if (cell && cell.type === gameState.currentPlayer) {
          const dvonnState = gameState as DvonnState;
          // if there is a legal move from this cell, select it
          const hasLegalMove = dvonnState.legalActions.some(action => 
            (action as MoveAction).from.row === row && (action as MoveAction).from.col === col);
          if (hasLegalMove) {
            setSelectedPiece({ row, col });
          }
          
        }
      } else {
        onAction({ type:'move', from: selectedPiece, to: { row, col } });
        setSelectedPiece(null);
      }
    }
  };
  const renderCell = (row: number, col: number) => {
    let cellColor = 'white';
    let cellText = '';
    let isDvonn = false;
  
    const cell = gameState.board[row][col];
    if (cell) {
      switch (cell.type) {
        case 0:
          cellColor = PLAYER_0_COLOR; 
          break;
        case 1:
          cellColor = PLAYER_1_COLOR;  
          break;
        case 2:
          cellColor = DVONN_COLOR;
          break;
      }
      cellText = cell.height.toString();
      isDvonn = cell.dvonn;
    }
  
    // Adjusted xOffset and yOffset to correctly map the rectangular grid to the hex grid
    let xOffset, yOffset;
    if (orientation === 'horizontal') {
      xOffset = HEX_WIDTH * col + (row * (HEX_WIDTH / 2)) - HEX_WIDTH + GLOBAL_X_OFFSET_HORIZONTAL;
      yOffset = HEX_HEIGHT * 0.75 * row + GLOBAL_Y_OFFSET_HORIZONTAL;
    } else {
      const maxOffset = HEX_HEIGHT * 0.75 * 5;
      xOffset = maxOffset - (HEX_HEIGHT * 0.75 * row) + GLOBAL_X_OFFSET_VERTICAL;
      yOffset = HEX_WIDTH * (col - 1) + (row * (HEX_WIDTH / 2)) + GLOBAL_Y_OFFSET_VERTICAL;
      // xOffset = (HEX_HEIGHT * 3) + (HEX_SIZE * 2) - (row * (HEX_HEIGHT / 2)) - HEX_HEIGHT;
      // xOffset = H/EX_HEIGHT * 0.75 * (gameState.board.length - row - 1);
      // yOffset = HEX_WIDTH * col + ((gameState.board.length - row - 1) * (HEX_WIDTH / 2));
    }
  
    const points = [
      [HEX_WIDTH / 2, 0],
      [HEX_WIDTH, HEX_HEIGHT / 4],
      [HEX_WIDTH, (3 * HEX_HEIGHT) / 4],
      [HEX_WIDTH / 2, HEX_HEIGHT],
      [0, (3 * HEX_HEIGHT) / 4],
      [0, HEX_HEIGHT / 4],
    ]
      .map(point => point.join(','))
      .join(' ');

    // let isLegalMove = false;
    // if (selectedPiece) {
    //   // console.log('selectedPiece', selectedPiece);
    //   const dvonnState = gameState as DvonnState;
    //   isLegalMove = dvonnState.legalActions.some(action => 
    //     (action as MoveAction).from.row === selectedPiece.row &&
    //     (action as MoveAction).from.col === selectedPiece.col &&
    //     (action as MoveAction).to.row === row && 
    //     (action as MoveAction).to.col === col);
    // }

    const cellLastActionFrom = (
      gameState.lastAction && gameState.lastAction.type === 'move' &&
      gameState.lastAction.from.row === row && gameState.lastAction.from.col === col
    );
    const cellLastActionTo = (
      gameState.lastAction && gameState.lastAction.type === 'move' &&
      gameState.lastAction.to.row === row && gameState.lastAction.to.col === col
    );
    // const cellLastActionPlaceStyle = (
    //   gameState.lastAction && gameState.lastAction.type === 'place' &&
    //   gameState.lastAction.row === row && gameState.lastAction.col === col
    // );
    // const lastActionColor = gameState.lastActionPlayer === 0 ? PLAYER_0_COLOR : PLAYER_1_COLOR;

    const cell_oob = gameState.board[row][col].type === -2;
    const cell_piece = gameState.board[row][col].type === 0 || gameState.board[row][col].type === 1 || gameState.board[row][col].type === 2;

    const polygonFill = cellLastActionFrom ? moveFromColor : (
      cellLastActionTo ? moveToColor : 
      'white'
    );
    
  
    return (
      !cell_oob && (
        <g
          key={`${row}-${col}`}
          className={`cell ${gameState.board[row][col].type === -2 ? 'cell_oob' : ''}`}
          onClick={() => handleCellClick(row, col)}
          transform={`translate(${xOffset}, ${yOffset}) ${orientation === 'vertical' ? 'rotate(30)' : ''}`}
        >
          <polygon points={points} className="hex-grid" fill={polygonFill} />
          {cell_piece ? (
            <>
              {/* {selectedPiece && isLegalMove && (
                <circle
                  cx={HEX_WIDTH / 2}
                  cy={HEX_HEIGHT / 2}
                  r={FAINT_CIRCLE_SIZE}
                  fill="green"
                  stroke="green"
                  strokeWidth="1"
                  opacity="0.5"
                />
              )} */}
              
              <circle
                cx={HEX_WIDTH / 2}
                cy={HEX_HEIGHT / 2}
                r={CIRCLE_SIZE}
                fill={cellColor}
                className={selectedPiece && selectedPiece.row === row && selectedPiece.col === col ? 'selectedCell' : ''}
              />
              {/* {cellLastActionTo && (
                <circle
                  cx={HEX_WIDTH / 2}
                  cy={HEX_HEIGHT / 2}
                  r={CIRCLE_SIZE}
                  fill="none"
                  stroke="navy"
                  strokeWidth="5"
                />
              )} */}
              {isDvonn && (
                <circle
                  cx={HEX_WIDTH / 2}
                  cy={HEX_HEIGHT / 2}
                  r={SMALL_CIRCLE_SIZE}
                  fill={DVONN_COLOR}
                />
              )}
              <text
                x={HEX_HEIGHT / 2 - 3}
                y={HEX_HEIGHT / 2 + 4} // +4 to adjust vertical alignment
                textAnchor="middle"
                fontSize="12"
                fill="white"
                transform={orientation === 'vertical' ? `rotate(-30, ${HEX_WIDTH / 2}, ${HEX_HEIGHT / 2})` : ''}
              >
                {cellText}
              </text>
            </>
          ) : (
            <>
              {/* {cellLastActionFrom && (
                <circle
                  cx={HEX_WIDTH / 2}
                  cy={HEX_HEIGHT / 2}
                  r={CIRCLE_SIZE / 5}
                  fill={lastActionColor}
                />
              )} */}
            </>
          )}
        </g>
      )
    );
  };

  const boardLongDimension = 11 * HEX_WIDTH + 10;
  const boardShortDimension = 4 * HEX_HEIGHT + 10;
  const svgWidth = orientation === 'horizontal' ? boardLongDimension : boardShortDimension;
  const svgHeight = orientation === 'horizontal' ? boardShortDimension : boardLongDimension;
  
  return (
    <svg className="board" width={svgWidth} height={svgHeight}>
      {(gameState as DvonnState).board.map((row, rowIndex) =>
        row.map((_, colIndex) => renderCell(rowIndex, colIndex))
      )}
    </svg>
  );
};

export default BoardSVG;
