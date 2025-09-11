import React, { useState } from 'react'
import { User, Skin } from '../types/game'
import { gameAPI, historyAPI } from '../services/api'
import { Leaf, ArrowLeft, Edit3 } from 'lucide-react'
import TextCustomization from './TextCustomization'
import './ShopScreen.css'

interface ShopScreenProps {
  user: User
  skins: Skin[]
  onScreenChange: (screen: 'main' | 'shop' | 'profile') => void
  onSkinPurchase: (skinId: number) => void
  onSkinSelect: (skinId: number) => void
  onTextsUpdate: (texts: string[]) => void
}

const ShopScreen: React.FC<ShopScreenProps> = ({ 
  user, 
  skins, 
  onScreenChange, 
  onSkinPurchase, 
  onSkinSelect,
  onTextsUpdate
}) => {
  const [selectedSkin, setSelectedSkin] = useState<number | null>(null)
  const [showTextCustomization, setShowTextCustomization] = useState(false)
  const presets: string[][] = [
    ['любит', 'не любит'],
    ['купить', 'не покупать'],
    ['позвонит', 'не позвонит']
  ]
  const [activePresetIdx, setActivePresetIdx] = useState<number>(0)

  const handleSkinClick = (skin: Skin) => {
    if (skin.owned) {
      setSelectedSkin(skin.id)
    }
  }

  const handleBuySkin = (skin: Skin) => {
    if (skin.owned) {
      onSkinSelect(skin.id)
    } else {
      onSkinPurchase(skin.id)
    }
  }

  const handleSelectSkin = () => {
    if (selectedSkin) {
      onSkinSelect(selectedSkin)
    }
  }

  const getSkinColor = (skin: Skin) => {
    if (skin.color) {
      return skin.color
    }
    return '#FFFFFF'
  }

  return (
    <div className="shop-screen">
      {/* Header */}
      <div className="header">
        <button className="back-btn" onClick={() => onScreenChange('main')}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-actions">
          <button 
            className="customize-texts-btn"
            onClick={() => setShowTextCustomization(true)}
          >
            <Edit3 size={16} />
            Тексты
          </button>
          <div className="balance-badge">
            <Leaf size={16} />
            <span>{user.balance}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h2>Магазин ромашек</h2>

        {/* Presets */}
        <div className="presets-grid">
          {presets.map((preset, idx) => (
            <div 
              key={idx}
              className={`preset-card ${activePresetIdx === idx ? 'selected' : ''}`}
              onClick={async () => {
                setActivePresetIdx(idx)
                try {
                  await gameAPI.updateCustomTexts(preset)
                  await historyAPI.setPreset(`preset_${idx}`, preset)
                } catch {}
                onTextsUpdate(preset)
              }}
            >
              <div className="preset-lines">
                {preset.map((line, i) => (
                  <div key={i} className="preset-line">{line}</div>
                ))}
              </div>
              <div className="preset-footer">{activePresetIdx === idx ? 'Выбрано' : 'Выбрать'}</div>
            </div>
          ))}
        </div>
        
        <div className="skins-grid">
          {skins.map((skin) => (
            <div 
              key={skin.id}
              className={`skin-card ${skin.owned ? 'owned' : ''} ${selectedSkin === skin.id ? 'selected' : ''}`}
              onClick={() => handleSkinClick(skin)}
            >
              <div 
                className="skin-preview"
                style={{ 
                  backgroundColor: getSkinColor(skin),
                  borderColor: selectedSkin === skin.id ? '#2196F3' : 'transparent'
                }}
              >
                <div className="skin-daisy">
                  <div className="skin-center"></div>
                  <div className="skin-petals">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`skin-petal skin-petal-${i + 1}`}></div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="skin-info">
                <h3>{skin.name}</h3>
                {skin.owned ? (
                  <span className="owned-badge">Куплено</span>
                ) : (
                  <div className="price">
                    <Leaf size={14} />
                    <span>{skin.price}</span>
                  </div>
                )}
              </div>
              
              <button 
                className={`action-btn ${skin.owned ? 'select' : 'buy'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleBuySkin(skin)
                }}
              >
                {skin.owned ? 'Выбрать' : `Купить за ${skin.price}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button 
          className="nav-btn"
          onClick={() => onScreenChange('main')}
        >
          <span>🌼</span>
        </button>
        <button 
          className="nav-btn active"
          onClick={() => onScreenChange('shop')}
        >
          <span>🛍️</span>
        </button>
        <button 
          className="nav-btn"
          onClick={() => onScreenChange('profile')}
        >
          <span>👤</span>
        </button>
      </div>

      {/* Text Customization Modal */}
      {showTextCustomization && (
        <TextCustomization
          user={user}
          onClose={() => setShowTextCustomization(false)}
          onTextsUpdate={onTextsUpdate}
        />
      )}
    </div>
  )
}

export default ShopScreen
