import React, { useState, useEffect } from 'react'
import { User } from '../types/game'
import { gameAPI } from '../services/api'
import { showTelegramAlert } from '../telegram'
import './TextCustomization.css'

interface TextCustomizationProps {
  user: User
  onClose: () => void
  onTextsUpdate: (texts: string[]) => void
}

const TextCustomization: React.FC<TextCustomizationProps> = ({ 
  user, 
  onClose, 
  onTextsUpdate 
}) => {
  const [texts, setTexts] = useState<string[]>(user.custom_texts || ['любит', 'не любит'])
  const [isLoading, setIsLoading] = useState(false)

  const handleTextChange = (index: number, value: string) => {
    const newTexts = [...texts]
    newTexts[index] = value
    setTexts(newTexts)
  }

  const addText = () => {
    if (texts.length < 3) {
      setTexts([...texts, ''])
    }
  }

  const removeText = (index: number) => {
    if (texts.length > 1) {
      const newTexts = texts.filter((_, i) => i !== index)
      setTexts(newTexts)
    }
  }

  const saveTexts = async () => {
    try {
      setIsLoading(true)
      
      // Фильтруем пустые тексты
      const filteredTexts = texts.filter(text => text.trim().length > 0)
      
      if (filteredTexts.length === 0) {
        showTelegramAlert('Добавьте хотя бы один текст!')
        return
      }

      await gameAPI.updateCustomTexts(filteredTexts)
      onTextsUpdate(filteredTexts)
      showTelegramAlert('Тексты сохранены!')
      onClose()
    } catch (error: any) {
      showTelegramAlert(error.response?.data?.detail || 'Ошибка сохранения текстов')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="text-customization-overlay">
      <div className="text-customization-modal">
        <div className="modal-header">
          <h3>Кастомизация текстов</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <p className="description">
            Настройте тексты, которые будут появляться при нажатии на ромашку. 
            Можно добавить до 3 текстов бесплатно.
          </p>
          
          <div className="texts-list">
            {texts.map((text, index) => (
              <div key={index} className="text-input-group">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  placeholder={`Текст ${index + 1}`}
                  maxLength={20}
                  className="text-input"
                />
                {texts.length > 1 && (
                  <button 
                    className="remove-btn"
                    onClick={() => removeText(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {texts.length < 3 && (
            <button className="add-text-btn" onClick={addText}>
              + Добавить текст
            </button>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="save-btn" 
            onClick={saveTexts}
            disabled={isLoading}
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextCustomization



