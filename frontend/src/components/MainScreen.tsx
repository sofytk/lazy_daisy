import React, { useState, useEffect } from 'react'
import { User } from '../types/game'
import { Leaf, Settings, ShoppingBag, User as UserIcon } from 'lucide-react'
import { tg } from '../telegram'
import { daisiesAPI, resultsAPI } from '../services/api'
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
  const [lastResult, setLastResult] = useState<string>('')
  const [gameOver, setGameOver] = useState(false)

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
    setLastResult(randomText)
    
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
    setTimeout(async () => {
      setIsCollecting(false)
      // persist daisies left
      try {
        await daisiesAPI.setDaisiesLeft(Math.max(0, daisiesLeft - 1))
      } catch {}
      // если лепестки закончились — game over
      if (petalCount - 1 <= 0) {
        setGameOver(true)
        try { await resultsAPI.saveResult(randomText) } catch {}
      }
    }, 1000)
  }

  useEffect(() => {
    // load daisies left from backend
    (async () => {
      try {
        const data = await daisiesAPI.getDaisiesLeft()
        if (typeof data.daisies_left === 'number') {
          setDaisiesLeft(data.daisies_left)
        }
      } catch {}
    })()
  }, [])

  const handleCustomize = () => {
    onScreenChange('shop')
  }

  const handleBuyDaisies = () => {
    onPayment(50)
  }

  const handleShare = () => {
    // Рисуем канвас результата
    const canvas = document.createElement('canvas')
    const size = 600
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Фон
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, '#87CEEB')
    grad.addColorStop(1, '#98FB98')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Ромашка центр (цвет текущего скина, если задан)
    const cx = size / 2
    const cy = size / 2
    const centerR = 90
    const currentSkin = (user as any).current_skin_color || '#FFD700'
    ctx.fillStyle = currentSkin
    ctx.beginPath()
    ctx.arc(cx, cy, centerR, 0, Math.PI * 2)
    ctx.fill()

    // Текст результата
    ctx.fillStyle = '#333'
    ctx.font = 'bold 40px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Результат:', cx, cy - 60)
    ctx.font = 'bold 56px Arial, sans-serif'
    // Здесь можно подставить реальный последний результат, если хранить его в состоянии
    const resultText = lastResult || 'любит / не любит'
    ctx.fillText(resultText, cx, cy)
    ctx.font = '24px Arial, sans-serif'
    ctx.fillStyle = '#1b5e20'
    const username = user.username ? `@${user.username}` : `${user.first_name || ''}`.trim()
    ctx.fillText(`Играй в "Ромашка" в Telegram ${username}`, cx, cy + 70)

    const dataUrl = canvas.toDataURL('image/png')

    // Сохраняем результат на бэкенде
    fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: resultText })
    }).catch(() => {})
    // Telegram WebApp share (как ссылка) или системный шаринг с изображением, если поддерживается
    if (navigator.share && (navigator as any).canShare?.({ files: [] })) {
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'romashka.png', { type: 'image/png' })
          ;(navigator as any).share({ files: [file], title: 'Игра Ромашка' }).catch(() => {})
      })
    } else {
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = 'romashka.png'
      link.click()
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
            <div className="daisy-center" style={{ background: (user as any).current_skin_color || '#FFD700' }}></div>
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
