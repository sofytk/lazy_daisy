export interface User {
  id: number
  tg_id: number
  username?: string
  first_name?: string
  last_name?: string
  balance: number
  referrals_count: number
  current_skin_id: number
  custom_texts?: string[]
}

export interface Skin {
  id: number
  name: string
  price: number
  color: string
  is_default: boolean
  owned: boolean
}

export interface Referral {
  id: number
  invited_user: {
    id: number
    username?: string
    first_name?: string
  }
  rewarded: boolean
  created_at: string
}

export interface GameState {
  score: number
  level: number
  daisies_collected: number
  is_game_over: boolean
}

export interface PlayerAction {
  action: string
  position?: {
    x: number
    y: number
  }
}

export interface LeaderboardEntry {
  player: string
  score: number
}
