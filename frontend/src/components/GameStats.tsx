import React from 'react'
import { GameState } from '../types/game'
import { Trophy, Target, RotateCcw, Loader } from 'lucide-react'
import './GameStats.css'

interface GameStatsProps {
  gameState: GameState
  onReset: () => void
  isLoading: boolean
}

const GameStats: React.FC<GameStatsProps> = ({ gameState, onReset, isLoading }) => {
  return (
    <div className="game-stats-container">
      <div className="stats-header">
        <h3>Game Stats</h3>
        <button 
          className="reset-btn"
          onClick={onReset}
          disabled={isLoading}
        >
          {isLoading ? <Loader size={16} className="spinning" /> : <RotateCcw size={16} />}
          Reset Game
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card score">
          <div className="stat-icon">
            <Trophy size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Score</div>
            <div className="stat-value">{gameState.score.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="stat-card level">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value">{gameState.level}</div>
          </div>
        </div>
        
        <div className="stat-card daisies">
          <div className="stat-icon">
            🌼
          </div>
          <div className="stat-content">
            <div className="stat-label">Daisies</div>
            <div className="stat-value">{gameState.daisies_collected}</div>
          </div>
        </div>
      </div>
      
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${Math.min((gameState.daisies_collected % 5) * 20, 100)}%` 
            }}
          ></div>
        </div>
        <div className="progress-text">
          {5 - (gameState.daisies_collected % 5)} more daisies to next level
        </div>
      </div>
      
      {gameState.is_game_over && (
        <div className="game-over-notice">
          <h4>🎮 Game Over!</h4>
          <p>Great job! You collected {gameState.daisies_collected} daisies!</p>
        </div>
      )}
    </div>
  )
}

export default GameStats








