import hashlib
import hmac
import json
import urllib.parse
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

class TelegramAuth:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
    
    def verify_init_data(self, init_data: str) -> Optional[Dict[str, Any]]:
        """
        Проверяет подпись initData от Telegram WebApp
        """
        try:
            # Парсим данные
            parsed_data = urllib.parse.parse_qs(init_data)
            
            # Извлекаем hash и остальные данные
            received_hash = parsed_data.get('hash', [None])[0]
            if not received_hash:
                return None
            
            # Удаляем hash из данных для проверки
            data_check_string = init_data.replace(f'&hash={received_hash}', '').replace(f'hash={received_hash}&', '').replace(f'hash={received_hash}', '')
            
            # Создаем секретный ключ
            secret_key = hmac.new(
                b"WebAppData",
                self.bot_token.encode(),
                hashlib.sha256
            ).digest()
            
            # Вычисляем hash
            calculated_hash = hmac.new(
                secret_key,
                data_check_string.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Проверяем подпись
            if calculated_hash != received_hash:
                return None
            
            # Проверяем время (данные не старше 24 часов)
            auth_date = int(parsed_data.get('auth_date', [0])[0])
            if datetime.now().timestamp() - auth_date > 86400:  # 24 часа
                return None
            
            # Парсим user данные
            user_data = parsed_data.get('user', [None])[0]
            if user_data:
                user_data = json.loads(user_data)
            
            return {
                'user': user_data,
                'auth_date': auth_date,
                'query_id': parsed_data.get('query_id', [None])[0],
                'hash': received_hash
            }
            
        except Exception as e:
            print(f"Error verifying init data: {e}")
            return None
    
    def extract_user_info(self, verified_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Извлекает информацию о пользователе из проверенных данных
        """
        user = verified_data.get('user', {})
        return {
            'tg_id': user.get('id'),
            'username': user.get('username'),
            'first_name': user.get('first_name'),
            'last_name': user.get('last_name'),
            'language_code': user.get('language_code'),
            'is_premium': user.get('is_premium', False)
        }



