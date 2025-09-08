import React, { useState, useEffect } from 'react'
import { User, Referral } from '../types/game'
import { ArrowLeft, Users, History, ShoppingBag, Globe, Palette, HelpCircle } from 'lucide-react'
import { gameAPI } from '../services/api'
import './ProfileScreen.css'

interface ProfileScreenProps {
  user: User
  onScreenChange: (screen: 'main' | 'shop' | 'profile') => void
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onScreenChange }) => {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadReferrals()
  }, [])

  const loadReferrals = async () => {
    try {
      setIsLoading(true)
      const data = await gameAPI.getReferrals()
      setReferrals(data)
    } catch (error) {
      console.error('Failed to load referrals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMenuClick = (menuItem: string) => {
    switch (menuItem) {
      case 'friends':
        // Показать друзей/рефералов
        break
      case 'history':
        // Показать историю
        break
      case 'purchases':
        // Показать покупки
        break
      case 'language':
        // Смена языка
        break
      case 'appearance':
        // Настройки оформления
        break
      case 'help':
        // Помощь
        break
      default:
        break
    }
  }

  const getReferralLink = () => {
    return `https://t.me/your_bot?start=ref${user.id}`
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink())
    alert('Реферальная ссылка скопирована!')
  }

  return (
    <div className="profile-screen">
      {/* Header */}
      <div className="header">
        <button className="back-btn" onClick={() => onScreenChange('main')}>
          <ArrowLeft size={20} />
        </button>
        <h2>Профиль</h2>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* User Info */}
        <div className="user-info">
          <div className="user-avatar">
            <div className="avatar-daisy">
              <div className="avatar-center"></div>
              <div className="avatar-petals">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`avatar-petal avatar-petal-${i + 1}`}></div>
                ))}
              </div>
            </div>
          </div>
          <div className="user-details">
            <h3>{user.first_name} {user.last_name}</h3>
            <p>@{user.username || 'user'}</p>
            <div className="user-stats">
              <div className="stat">
                <span className="stat-value">{user.balance}</span>
                <span className="stat-label">Листиков</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user.referrals_count}</span>
                <span className="stat-label">Рефералов</span>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Section */}
        <div className="referral-section">
          <h4>Пригласи друзей</h4>
          <p>Получай бонусы за каждого приглашенного друга!</p>
          <div className="referral-link">
            <input 
              type="text" 
              value={getReferralLink()} 
              readOnly 
              className="referral-input"
            />
            <button className="copy-btn" onClick={copyReferralLink}>
              Копировать
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="menu-section">
          <div className="menu-item" onClick={() => handleMenuClick('friends')}>
            <Users size={20} />
            <span>Друзья ({referrals.length})</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('history')}>
            <History size={20} />
            <span>История</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('purchases')}>
            <ShoppingBag size={20} />
            <span>Покупки</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('language')}>
            <Globe size={20} />
            <span>Язык</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('appearance')}>
            <Palette size={20} />
            <span>Оформление</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('help')}>
            <HelpCircle size={20} />
            <span>Помощь</span>
          </div>
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
          className="nav-btn"
          onClick={() => onScreenChange('shop')}
        >
          <span>🛍️</span>
        </button>
        <button 
          className="nav-btn active"
          onClick={() => onScreenChange('profile')}
        >
          <span>👤</span>
        </button>
      </div>
    </div>
  )
}

export default ProfileScreen




