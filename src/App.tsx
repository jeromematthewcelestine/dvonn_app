import React, { useState, useEffect, useRef } from 'react';
import BoardSVG from './BoardSVG';
import DvonnBot from './DvonnBot'; // Import the DvonnBot class
import './App.css';
import { MCTSGameState, mcts } from './mcts';
import { DvonnState, Action } from './DvonnGame';

import { ReactComponent as iconH } from './images/2024-07-17-robot.svg';
import icon from './images/2024-07-17-human.svg';
import dvonnBotLogo from './images/DvonnBotLogo01.svg';
import dvonnRotateIcon from './images/DvonnRotateIcon02.svg';
import { wait } from '@testing-library/user-event/dist/utils';
import { get } from 'http';


const App: React.FC = () => {

  const [boardOrientation, setBoardOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [gameState, setGameState] = useState<DvonnState>(new DvonnState());
  const [botType, setBotType] = useState<string>('mcts1');
  const [isBotTurn, setIsBotTurn] = useState<boolean>(false);
  const [setupType, setSetupType] = useState<string>('standardSetup');

  const humanPlayer = 0;
  const dvonnBot = new DvonnBot(2);

  const handleBotTypeSelect = (newBotType : string) => () => {
    setBotType(newBotType);
  }

  const handleSetupSelect = (setupType : string) => () => {
    setSetupType(setupType);
  }


  const handleRotateRequest = () => {
    setBoardOrientation(boardOrientation === 'horizontal' ? 'vertical' : 'horizontal');
  }

  const handlePlayerAction = (action : Action) => {

    const newGameState = gameState.clone();
    newGameState.applyAction(action);

    setGameState(newGameState as unknown as DvonnState);
    if (newGameState.getCurrentPlayer() !== humanPlayer) {
        setIsBotTurn(true);
    }
  };

  const handleBotTurn = () => {
    
    let botAction = null;
    if (botType === 'mcts1') {
      botAction = mcts(gameState, 1);
    } else if (botType === 'mcts5') {
      botAction = mcts(gameState, 5);
    } else if (botType === 'mcts10') {
      botAction = mcts(gameState, 10);
    }


    // const mctsAnalysis = getMovesAnalysisMCTS(gameState, 1.0);
    // console.log('mctsAnalysis', mctsAnalysis);

    // const botAction = dvonnBot.selectBestMove(gameState);
    // const newGameState = gameState.applyAction(botAction);
    const newGameState = gameState.clone() as DvonnState;
    newGameState.applyAction(botAction);

    
    setGameState(newGameState);
    if (newGameState.getCurrentPlayer() !== humanPlayer) {
      setIsBotTurn(true);
    } else {
      setIsBotTurn(false);
    }
  };

  useEffect(() => {
    if (isBotTurn) {
      setTimeout(() => {
        handleBotTurn();
      }, 10);
    }
  }, [isBotTurn, gameState]);


  const startNewGame = () => {
    if (setupType === 'randomSetup') {
      startNewGameWithRandomSetup();
    }
    else {

      setGameState(new DvonnState());
    }
    
    // random human or bot
    // const newHumanPlayer = Math.floor(Math.random() * 2);
    // const newHumanPlayer = 0;
    // setHumanPlayer(newHumanPlayer);
    // if (newHumanPlayer === 1) {
    //   doBotMove();
    // }
  }

  const startNewGameWithRandomSetup = () => {

    let newGameState = new DvonnState();

    for (let i = 0; i < 49; i++) {
      const legalActions = newGameState.legalActions;
      const randomAction = legalActions[Math.floor(Math.random() * legalActions.length)];
      
      const updatedGameState = newGameState.clone() as DvonnState;
      updatedGameState.applyAction(randomAction);
      newGameState = updatedGameState;
      // console.log('newGameState', updatedGameState);
    }

    setGameState(newGameState);
  };

  const player0Winner = gameState.winner === 0 ? 'Winner!' : '';
  const player1Winner = gameState.winner === 1 ? 'Winner!' : '';

  const player0Active = gameState.currentPlayer === 0 ? '' : '';
  const player1Active = gameState.currentPlayer === 1 ? '' : '';

  const player0ActiveClass = gameState.currentPlayer === 0 ? 'active' : '';
  const player1ActiveClass = gameState.currentPlayer === 1 ? 'active' : '';

  return (
    <div className="page">

      <img src={dvonnBotLogo} className="dvonnBotLogo" alt="Dvonn Bot"/>

      <div className="gameArea"> {/* contains boardArea and gameSettingsArea */}

        <div className="boardArea"> 

          <BoardSVG gameState={gameState} isBotTurn={isBotTurn} onAction={handlePlayerAction} orientation={boardOrientation}/>
          
          <div className="statusArea">
            <div id="player0StatusBox" className={`playerStatusArea ` + player0ActiveClass}>
              <div className="playerColorBlock player0ColorBlock">
                  &nbsp;
              </div>
              <div className="playerName player0Name">
                { humanPlayer === 0 ? 'Player' : 'AI' }
              </div>
              <div className="spacer">&nbsp;</div>
              <div className="playerScore player0Score">
                {gameState.scores[0]} {player0Winner}
              </div>

            </div> {/* player0StatusBox */}

            <div id="player1StatusBox" className={`playerStatusArea ` + player1ActiveClass}>
              <div className="playerColorBlock player1ColorBlock">
                  &nbsp;
              </div>
              <div className="playerName player1Name">
              { humanPlayer === 0 ? 'AI' : 'Player' }
              </div>
              <div className="spacer">&nbsp;</div>
              <div className="playerScore player1Score">
                {gameState.scores[1]} {player1Winner}
              </div>
            </div> {/* player1StatusBox */}
          </div> {/* statusArea */}
        </div> {/* boardArea */}

        <div className="gameSettingsArea" >
          <div className="botTypeArea">
            <div className="botTypeTitle">Bot Type</div>
            <div className="botTypeRadioButtons"> 
              <div>
                <input type="radio" id="mcts1" name="thinkingTime" value="mcts1" onClick={handleBotTypeSelect('mcts1')} checked={botType=='mcts1'}/>
                <label htmlFor="mcts1">MCTS (1 second)</label>
              </div>
              <div>
                <input type="radio" id="mcts2" name="thinkingTime" value="mcts2" onClick={handleBotTypeSelect('mcts2')} checked={botType=='mcts2'}/>
                <label htmlFor="mcts2">MCTS (2 seconds)</label>
              </div>
              <div>
                <input type="radio" id="mcts5" name="thinkingTime" value="mcts5" onClick={handleBotTypeSelect('mcts5')} checked={botType=='mcts5'}/>
                <label htmlFor="mcts5">MCTS (5 seconds)</label>
              </div>  
              <div>
                <input type="radio" id="mcts10" name="thinkingTime" value="mcts10" onClick={handleBotTypeSelect('mcts10')}
                checked={botType=='mcts10'}/>
                <label htmlFor="mcts10">MCTS (10 seconds)</label>
              </div>
            </div> {/* botTypeRadioButtons */}
          </div>
          

          <div className="rotateIconContainer">
            <button className="dvonnRotateIconButton" onClick={() => handleRotateRequest()}>
              <img src={dvonnRotateIcon} className="dvonnRotateIcon" alt="Dvonn Rotate Icon"/>
            </button>
          </div>
        </div> {/* gameSettingsArea */}

        

      </div> {/* gameArea */}

      

      
      <div className="newGameArea">

        <div className="newGameTitle">New Game</div>

        <div className="newGameSetupRadioArea">
          <div>
            <input type="radio" id="newGameStandardSetup" checked={setupType=='standardSetup'} name="setupType" value="newGameStandardSetup" onClick={handleSetupSelect('standardSetup')}/>
            <label htmlFor="newGameStandardSetup">Standard setup</label>
          </div>
          <div>
            <input type="radio" id="newGameRandomSetup"  name="setupType" checked={setupType=='randomSetup'}value="newGameRandomSetup" onClick={handleSetupSelect('randomSetup')} />
            <label htmlFor="newGameRandomSetup">Random setup</label>
          </div>

        </div>
        
        <button className="newGameButton" onClick={() => startNewGame()}>Start</button>

      </div>
    
      
    </div>
  );
}

export default App;
