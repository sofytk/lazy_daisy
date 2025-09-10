import requests
import json
from typing import Dict, Any, Optional
from fastapi import HTTPException

class TelegramPaymentService:
    def __init__(self, bot_token: str, provider_token: str):
        self.bot_token = bot_token
        self.provider_token = provider_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
    
    def create_invoice(self, user_id: int, title: str, description: str, 
                      amount: int, currency: str = "RUB", 
                      payload: str = "") -> Dict[str, Any]:
        """
        Создает счет для оплаты через Telegram
        """
        try:
            # Конвертируем сумму в копейки для Telegram
            price_amount = amount * 100  # 1 рубль = 100 копеек
            
            url = f"{self.base_url}/sendInvoice"
            data = {
                "chat_id": user_id,
                "title": title,
                "description": description,
                "payload": payload,
                "provider_token": self.provider_token,
                "currency": currency,
                "prices": [{"label": title, "amount": price_amount}]
            }
            
            response = requests.post(url, json=data)
            response.raise_for_status()
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Payment creation failed: {str(e)}")
    
    def verify_payment(self, payment_data: Dict[str, Any]) -> bool:
        """
        Проверяет подлинность платежа (базовая проверка)
        В реальном проекте здесь должна быть более сложная логика
        """
        required_fields = ['id', 'currency', 'total_amount', 'invoice_payload']
        return all(field in payment_data for field in required_fields)
    
    def process_successful_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Обрабатывает успешный платеж
        """
        if not self.verify_payment(payment_data):
            raise HTTPException(status_code=400, detail="Invalid payment data")
        
        return {
            "payment_id": payment_data.get('id'),
            "amount": payment_data.get('total_amount', 0) // 100,  # Конвертируем обратно в рубли
            "currency": payment_data.get('currency'),
            "payload": payment_data.get('invoice_payload')
        }





