import React, { useState, useEffect } from 'react';
import BoardSVG from './BoardSVG.tsx';
import DvonnBot from './DvonnBot.tsx';
import './App.css';
import { mcts } from './mcts.ts';
import { DvonnState, Action } from './DvonnGame.tsx';
import {isMobile} from 'react-device-detect';

import dvonnBotLogo from './images/DvonnBotLogo01.svg';
import dvonnRotateIcon from './images/DvonnRotateIcon02.svg';

const App: React.FC = () => {

  const [boardOrientation, setBoardOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [gameState, setGameState] = useState<DvonnState>(new DvonnState());
  const [botType, setBotType] = useState<string>('mcts1');
  const [isBotTurn, setIsBotTurn] = useState<boolean>(false);
  const [setupType, setSetupType] = useState<string>('standardSetup');
  const [humanPlayer, setHumanPlayer] = useState<number>(0);

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
    } else if (botType === 'mcts2') {
      botAction = mcts(gameState, 2);
    } else if (botType === 'mcts5') {
      botAction = mcts(gameState, 5);
    } else if (botType === 'mcts10') {
      botAction = mcts(gameState, 10);
    } else if (botType === 'heuristic') {
      botAction = dvonnBot.selectBestMove(gameState);
    }

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
    const newHumanPlayer = Math.floor(Math.random() * 2);
    setHumanPlayer(newHumanPlayer);
    if (newHumanPlayer === 1) {
      setIsBotTurn(true);
    }
  }

  const startNewGameWithRandomSetup = () => {

    let newGameState = new DvonnState();

    for (let i = 0; i < 49; i++) {
      const legalActions = newGameState.legalActions;
      const randomAction = legalActions[Math.floor(Math.random() * legalActions.length)];
      
      const updatedGameState = newGameState.clone() as DvonnState;
      updatedGameState.applyAction(randomAction);
      newGameState = updatedGameState;
    }

    setGameState(newGameState);
  };

  const player0ActiveClass = (gameState.currentPlayer === 0 && !gameState.gameOver) ? 'active' : '';
  const player1ActiveClass = (gameState.currentPlayer === 1 && !gameState.gameOver) ? 'active' : '';

  const winnerText = (gameState.gameOver && gameState.winner === humanPlayer) ? 'Player wins!' : (gameState.gameOver && gameState.winner !== humanPlayer) ? 'Bot wins!' : '';

  const player0WinnerClass = (gameState.gameOver && gameState.winner === 0) ? ' winner' : '';
  const player1WinnerClass = (gameState.gameOver && gameState.winner === 1) ? ' winner' : '';


  return (
    <div className="app">

      <img src={dvonnBotLogo} className="dvonnBotLogo" alt="Dvonn Bot"/>


      
      <div className="gameArea"> {/* contains boardArea and gameSettingsArea */}

        <div className="boardArea"> 
          
          <BoardSVG gameState={gameState} onAction={handlePlayerAction} orientation={boardOrientation}/>
          
          
          <div className="playerStatusArea">
            <div id="player0StatusBox" className={`playerStatusBox ` + player0ActiveClass + player0WinnerClass}>
              <div className="playerColorBlock player0ColorBlock">
                  &nbsp;
              </div>
              <div className="playerStatusName player0Name">
                { humanPlayer === 0 ? 'Player' : 'Bot' }
              </div>
              <div className="playerScore">
                {gameState.scores[0]} 
              </div>

            </div> {/* player0StatusBox */}

            <div id="player1StatusBox" className={`playerStatusBox  ` + player1ActiveClass + player1WinnerClass}>
              <div className="playerColorBlock player1ColorBlock">
                  &nbsp;
              </div>
              <div className="playerStatusName player1Name">
              { humanPlayer === 0 ? 'Bot' : 'Player' }
              </div>
              <div className="playerScore">
                {gameState.scores[1]} 
              </div>
            </div> {/* player1StatusBox */}
          </div> {/* statusArea */}

          {gameState.gameOver &&
            <div className="gameOverArea">
              <div className="gameOverText">
                Game over! {winnerText}
              </div>
            </div>}
        </div> {/* boardArea */}

        <div className="gameSettingsArea" >
          <div className="botTypeArea">
            <div className="botTypeTitle">Bot Type</div>
            <div className="botTypeRadioButtons"> 
              <div className="botTypeItem">
                <input type="radio" id="mcts1" name="thinkingTime" value="mcts1" onClick={handleBotTypeSelect('mcts1')} checked={botType=='mcts1'}/>
                <label htmlFor="mcts1">MCTS (1 second)</label>
              </div>
              <div className="botTypeItem">
                <input type="radio" id="mcts2" name="thinkingTime" value="mcts2" onClick={handleBotTypeSelect('mcts2')} checked={botType=='mcts2'}/>
                <label htmlFor="mcts2">MCTS (2 seconds)</label>
              </div>
              <div className="botTypeItem">
                <input type="radio" id="mcts5" name="thinkingTime" value="mcts5" onClick={handleBotTypeSelect('mcts5')} checked={botType=='mcts5'}/>
                <label htmlFor="mcts5">MCTS (5 seconds)</label>
              </div>  
              <div className="botTypeItem">
                <input type="radio" id="mcts10" name="thinkingTime" value="mcts10" onClick={handleBotTypeSelect('mcts10')}
                checked={botType=='mcts10'}/>
                <label htmlFor="mcts10">MCTS (10 seconds)</label>
              </div>
              <div className="botTypeItem">
                <input type="radio" id="heuristic" name="thinkingTime" value="heuristic" onClick={handleBotTypeSelect('heuristic')}
                checked={botType=='heuristic'}/>
                <label htmlFor="heuristic">Heuristic</label>
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
          <div className="newGameOptionItem">
            <input type="radio" id="newGameStandardSetup" checked={setupType=='standardSetup'} name="setupType" value="newGameStandardSetup" onClick={handleSetupSelect('standardSetup')}/>
            <label htmlFor="newGameStandardSetup">Standard setup</label>
          </div>
          <div className="newGameOptionItem">
            <input type="radio" id="newGameRandomSetup"  name="setupType" checked={setupType=='randomSetup'}value="newGameRandomSetup" onClick={handleSetupSelect('randomSetup')} />
            <label htmlFor="newGameRandomSetup">Random setup</label>
          </div>

        </div>
        
        <button className="newGameButton" onClick={() => startNewGame()}>Start</button>

      </div>

      <div className="infoArea">
        <p>
          Dvonn is a game by <a href="https://boardgamegeek.com/boardgame/2346/dvonn">Kris Burm</a>. 
          DvonnBot is developed by <a href="https://www.jeromewilliams.net">Jerome Williams</a>. 
          GitHub repository for DvonnBot is <a href="">here</a>. 
          DvonnBot uses either <a href="https://en.wikipedia.org/wiki/Monte_Carlo_tree_search">Monte Carlo Tree Search</a> or a heuristic-based evaluation function.
        </p>
        <p>
          © 2024 Jerome Williams
        </p>
      </div>

      <div className="text-blue-600">
        Temp text.

      </div>
      
    </div>
  );
}

export default App;
