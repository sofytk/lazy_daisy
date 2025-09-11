import React, { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { historyAPI } from '../services/api'
import './HistoryScreen.css'

interface HistoryScreenProps {
  onBack: () => void
}

const PAGE_SIZE = 20

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [tab, setTab] = useState<'purchases' | 'results'>('purchases')
  const [purchases, setPurchases] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [offset, setOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const load = async () => {
    try {
      setIsLoading(true)
      if (tab === 'purchases') {
        const data = await historyAPI.getPurchases(offset, PAGE_SIZE)
        setPurchases(prev => offset === 0 ? data.purchases : [...prev, ...data.purchases])
      } else {
        const data = await historyAPI.getResults(offset, PAGE_SIZE)
        setResults(prev => offset === 0 ? data.results : [...prev, ...data.results])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setOffset(0)
  }, [tab])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, offset])

  const onLoadMore = () => setOffset(o => o + PAGE_SIZE)

  return (
    <div className="history-screen">
      <div className="header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2>История</h2>
      </div>

      <div className="tabs">
        <button className={`tab ${tab==='purchases'?'active':''}`} onClick={() => setTab('purchases')}>Покупки</button>
        <button className={`tab ${tab==='results'?'active':''}`} onClick={() => setTab('results')}>Результаты</button>
      </div>

      {tab === 'purchases' && (
        <div className="list">
          {purchases.map((p) => (
            <div key={p.id} className="row">
              <div className="col type">{p.item_type}</div>
              <div className="col amount">{p.amount}</div>
              <div className="col date">{new Date(p.created_at).toLocaleString()}</div>
            </div>
          ))}
          <div className="actions">
            <button className="load-btn" disabled={isLoading} onClick={onLoadMore}>
              {isLoading ? 'Загрузка...' : 'Показать ещё'}
            </button>
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="list">
          {results.map((r) => (
            <div key={r.id} className="row">
              <div className="col type">{r.text}</div>
              <div className="col date">{new Date(r.created_at).toLocaleString()}</div>
            </div>
          ))}
          <div className="actions">
            <button className="load-btn" disabled={isLoading} onClick={onLoadMore}>
              {isLoading ? 'Загрузка...' : 'Показать ещё'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryScreen
