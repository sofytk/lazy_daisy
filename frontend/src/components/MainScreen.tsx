import React, { useState, useEffect } from 'react'
import { User } from '../types/game'
import { Leaf, Settings, ShoppingBag, User as UserIcon } from 'lucide-react'
import { tg } from '../telegram'
import './MainScreen.css'

interface MainScreenProps {
  user: User
  onScreenChange: (screen: 'main' | 'shop' | 'profile') => void
  onPayment: (amount: number) => void
}

const MainScreen: React.FC<MainScreenProps> = ({ user, onScreenChange, onPayment }) => {
  const [daisiesLeft, setDaisiesLeft] = useState(2)
  const [isCollecting, setIsCollecting] = useState(false)
  const [floatingTexts, setFloatingTexts] = useState<Array<{id: number, text: string, x: number, y: number}>>([])
  const [petalCount, setPetalCount] = useState(8)

  const handleDaisyClick = () => {
    if (isCollecting) return
    
    setIsCollecting(true)
    setDaisiesLeft(prev => Math.max(0, prev - 1))
    
    // Вибрация
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium')
    }
    
    // Отрываем лепесток
    setPetalCount(prev => Math.max(0, prev - 1))
    
    // Выбираем случайный текст
    const texts = user.custom_texts || ['любит', 'не любит']
    const randomText = texts[Math.floor(Math.random() * texts.length)]
    
    // Добавляем выплывающий текст
    const newFloatingText = {
      id: Date.now(),
      text: randomText,
      x: Math.random() * 200 + 50, // Случайная позиция вокруг ромашки
      y: Math.random() * 200 + 50
    }
    
    setFloatingTexts(prev => [...prev, newFloatingText])
    
    // Убираем текст через 2 секунды
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== newFloatingText.id))
    }, 2000)
    
    // Анимация сбора ромашки
    setTimeout(() => {
      setIsCollecting(false)
    }, 1000)
  }

  const handleCustomize = () => {
    onScreenChange('shop')
  }

  const handleBuyDaisies = () => {
    onPayment(50)
  }

  const handleShare = () => {
    const shareText = `Присоединяйся к игре "Ромашка"! Собирай ромашки и кастомизируй их!`
    const shareUrl = `https://t.me/your_bot?start=ref${user.id}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Игра Ромашка',
        text: shareText,
        url: shareUrl
      })
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      alert('Ссылка скопирована в буфер обмена!')
    }
  }

  return (
    <div className="main-screen">
      {/* Header */}
      <div className="header">
        <button className="customize-btn" onClick={handleCustomize}>
          <span>✏️</span>
          Кастомизировать
        </button>
        <div className="balance-badge">
          <Leaf size={16} />
          <span>{user.balance}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div 
          className={`daisy-container ${isCollecting ? 'collecting' : ''}`}
          onClick={handleDaisyClick}
        >
          <div className="daisy">
            <div className="daisy-center"></div>
            <div className="daisy-petals">
              {[...Array(petalCount)].map((_, i) => (
                <div key={i} className={`petal petal-${i + 1}`}></div>
              ))}
            </div>
          </div>
          
          {/* Выплывающие тексты */}
          {floatingTexts.map((floatingText) => (
            <div
              key={floatingText.id}
              className="floating-text"
              style={{
                left: `${floatingText.x}px`,
                top: `${floatingText.y}px`
              }}
            >
              {floatingText.text}
            </div>
          ))}
        </div>

        {/* Floating Buttons */}
        <div className="floating-buttons">
          <div className="daisies-left">
            <span>Осталось {daisiesLeft} ромашки</span>
          </div>
          
          <div className="action-buttons">
            <button className="share-btn" onClick={handleShare}>
              Поделиться
            </button>
            <button className="buy-btn" onClick={handleBuyDaisies}>
              <Leaf size={16} />
              Купить за 50
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button 
          className={`nav-btn ${true ? 'active' : ''}`}
          onClick={() => onScreenChange('main')}
        >
          <span>🌼</span>
        </button>
        <button 
          className="nav-btn"
          onClick={() => onScreenChange('shop')}
        >
          <ShoppingBag size={20} />
        </button>
        <button 
          className="nav-btn"
          onClick={() => onScreenChange('profile')}
        >
          <UserIcon size={20} />
        </button>
      </div>
    </div>
  )
}

export default MainScreen
