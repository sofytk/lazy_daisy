import axios from 'axios'
import { User, Skin, Referral, GameState, PlayerAction } from '../types/game'
import { tg } from '../telegram'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Helper function to get init data
const getInitData = () => {
  if (tg?.initData) {
    return tg.initData
  }
  throw new Error('Telegram WebApp not available')
}

export const gameAPI = {
  // Auth
  async authUser(): Promise<User> {
    const response = await api.post('/auth', {
      initData: getInitData()
    })
    return response.data
  },

  // User
  async getUser(userId: number): Promise<User> {
    const response = await api.get(`/user/${userId}`)
    return response.data
  },

  // Balance
  async getBalance(): Promise<{ balance: number }> {
    const response = await api.get('/balance', {
      params: { initData: getInitData() }
    })
    return response.data
  },

  async addBalance(amount: number): Promise<{ message: string; new_balance: number }> {
    const response = await api.post('/balance/add', null, {
      params: { amount, initData: getInitData() }
    })
    return response.data
  },

  // Skins
  async getSkins(): Promise<Skin[]> {
    const response = await api.get('/skins', {
      params: { initData: getInitData() }
    })
    return response.data
  },

  async buySkin(skinId: number): Promise<{ message: string; new_balance: number }> {
    const response = await api.post('/skins/buy', { skin_id: skinId }, {
      params: { initData: getInitData() }
    })
    return response.data
  },

  async selectSkin(skinId: number): Promise<{ message: string }> {
    const response = await api.post('/skins/select', null, {
      params: { skin_id: skinId, initData: getInitData() }
    })
    return response.data
  },

  // Referrals
  async getReferrals(): Promise<Referral[]> {
    const response = await api.get('/referrals', {
      params: { initData: getInitData() }
    })
    return response.data
  },

  async applyReferral(referralCode: string): Promise<{ message: string; bonus: number }> {
    const response = await api.post('/referrals/apply', null, {
      params: { referral_code: referralCode, initData: getInitData() }
    })
    return response.data
  },

  // Payments
  async createPayment(amount: number, description?: string): Promise<{ invoice: any }> {
    const response = await api.post('/payments/create', {
      amount,
      description: description || 'Пополнение баланса'
    }, {
      params: { initData: getInitData() }
    })
    return response.data
  },

  // Custom Texts
  async getCustomTexts(): Promise<{ texts: string[] }> {
    const response = await api.get('/custom-texts', {
      params: { initData: getInitData() }
    })
    return response.data
  },

  async updateCustomTexts(texts: string[]): Promise<{ message: string; texts: string[] }> {
    const response = await api.post('/custom-texts', { texts }, {
      params: { initData: getInitData() }
    })
    return response.data
  },

  // Game (legacy)
  async getGameState(): Promise<GameState> {
    const response = await api.get('/game/state')
    return response.data
  },

  async performAction(action: string, position?: { x: number; y: number }): Promise<void> {
    const payload: PlayerAction = {
      action,
      position
    }
    await api.post('/game/action', payload)
  },

  async resetGame(): Promise<void> {
    await api.post('/game/reset')
  },

  async getLeaderboard(): Promise<any[]> {
    const response = await api.get('/game/leaderboard')
    return response.data.leaderboard
  }
}

export const daisiesAPI = {
  async getDaisiesLeft(): Promise<{ daisies_left: number }> {
    const response = await api.get('/daisies', {
      params: { initData: getInitData() }
    })
    return response.data
  },
  async setDaisiesLeft(value: number): Promise<{ daisies_left: number }> {
    const response = await api.post('/daisies', { value }, {
      params: { initData: getInitData() }
    })
    return response.data
  }
}

export const resultsAPI = {
  async saveResult(text: string): Promise<{ id: number; result_text: string; created_at: string }> {
    const response = await api.post('/results', { text }, {
      params: { initData: getInitData() }
    })
    return response.data
  }
}

export const historyAPI = {
  async getPurchases(offset = 0, limit = 20): Promise<{ purchases: any[] }> {
    const response = await api.get('/purchases', { params: { initData: getInitData(), offset, limit } })
    return response.data
  },
  async getResults(offset = 0, limit = 20): Promise<{ results: any[] }> {
    const response = await api.get('/results', { params: { initData: getInitData(), offset, limit } })
    return response.data
  },
  async setPreset(key?: string, texts?: string[]): Promise<{ texts_preset_key: string | null }> {
    const response = await api.post('/preset', { key, texts }, { params: { initData: getInitData() } })
    return response.data
  }
}
