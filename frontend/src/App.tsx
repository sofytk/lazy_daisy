import React, { useState, useEffect } from 'react'
import './App.css'
import { User, Skin } from './types/game'
import { gameAPI } from './services/api'
import { initTelegram, showTelegramAlert } from './telegram'
import MainScreen from './components/MainScreen'
import ShopScreen from './components/ShopScreen'
import ProfileScreen from './components/ProfileScreen'

type Screen = 'main' | 'shop' | 'profile'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main')
  const [user, setUser] = useState<User | null>(null)
  const [skins, setSkins] = useState<Skin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initTelegram()
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      setIsLoading(true)
      
      // Авторизация пользователя
      const userData = await gameAPI.authUser()
      setUser(userData)
      
      // Загружаем скины
      const skinsData = await gameAPI.getSkins()
      setSkins(skinsData)
      
    } catch (error) {
      console.error('Failed to initialize app:', error)
      showTelegramAlert('Ошибка загрузки приложения. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScreenChange = (screen: Screen) => {
    setCurrentScreen(screen)
  }

  const handleSkinPurchase = async (skinId: number) => {
    try {
      const result = await gameAPI.buySkin(skinId)
      
      // Обновляем данные пользователя
      const userData = await gameAPI.authUser()
      setUser(userData)
      
      // Обновляем скины
      const skinsData = await gameAPI.getSkins()
      setSkins(skinsData)
      
      showTelegramAlert(`Скин куплен! Новый баланс: ${result.new_balance} листиков`)
    } catch (error: any) {
      showTelegramAlert(error.response?.data?.detail || 'Ошибка покупки скина')
    }
  }

  const handleSkinSelect = async (skinId: number) => {
    try {
      await gameAPI.selectSkin(skinId)
      
      // Обновляем данные пользователя
      const userData = await gameAPI.authUser()
      setUser(userData)
      
      showTelegramAlert('Скин выбран!')
    } catch (error: any) {
      showTelegramAlert(error.response?.data?.detail || 'Ошибка выбора скина')
    }
  }

  const handlePayment = async (amount: number) => {
    try {
      const result = await gameAPI.createPayment(amount)
      
      // Открываем инвойс в Telegram
      if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(result.invoice.result.invoice_link, (status) => {
          if (status === 'paid') {
            // Обновляем данные пользователя после успешной оплаты
            initializeApp()
            showTelegramAlert('Баланс пополнен!')
          }
        })
      }
    } catch (error: any) {
      showTelegramAlert(error.response?.data?.detail || 'Ошибка создания платежа')
    }
  }

  const handleTextsUpdate = async (texts: string[]) => {
    // Обновляем данные пользователя
    const userData = await gameAPI.authUser()
    setUser(userData)
  }

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="App">
        <div className="error-screen">
          <h2>Ошибка авторизации</h2>
          <p>Не удалось загрузить данные пользователя</p>
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {currentScreen === 'main' && (
        <MainScreen 
          user={user}
          onScreenChange={handleScreenChange}
          onPayment={handlePayment}
        />
      )}
      
      {currentScreen === 'shop' && (
        <ShopScreen 
          user={user}
          skins={skins}
          onScreenChange={handleScreenChange}
          onSkinPurchase={handleSkinPurchase}
          onSkinSelect={handleSkinSelect}
          onTextsUpdate={handleTextsUpdate}
        />
      )}
      
      {currentScreen === 'profile' && (
        <ProfileScreen 
          user={user}
          onScreenChange={handleScreenChange}
        />
      )}
    </div>
  )
}

export default App
