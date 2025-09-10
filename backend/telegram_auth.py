import hashlib
import hmac
import json
import urllib.parse
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timezone

class TelegramAuth:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
    
    def verify_init_data(self, init_data: str) -> Optional[Dict[str, Any]]:
            try:
            # Разбираем пары
                pairs: List[Tuple[str, str]] = urllib.parse.parse_qsl(init_data, keep_blank_values=True)
                received_hash: Optional[str] = None
                filtered_pairs: List[Tuple[str, str]] = []

                for key, value in pairs:
                    if key == "hash":
                        received_hash = value
                        continue
                    filtered_pairs.append((key, value))  # ⚠️ не unquote здесь

                if not received_hash:
                    return None

                # Сортируем по ключу
                filtered_pairs.sort(key=lambda kv: kv[0])
                data_check_string = "\n".join([f"{k}={v}" for k, v in filtered_pairs])

                # SHA256 от bot_token
                secret_key = hashlib.sha256(self.bot_token.encode()).digest()

                calculated_hash = hmac.new(
                    key=secret_key,
                    msg=data_check_string.encode(),
                    digestmod=hashlib.sha256,
                ).hexdigest()

                if not hmac.compare_digest(calculated_hash, received_hash):
                    print("❌ Hash mismatch")
                    return None

                # Проверяем auth_date
                auth_date_str = dict(pairs).get("auth_date", "0")
                try:
                    auth_date = int(auth_date_str)
                except ValueError:
                    return None

                now_ts = int(datetime.now(timezone.utc).timestamp())
                if now_ts - auth_date > 86400:  # 1 день
                    print("❌ Expired auth_date")
                    return None

                # user (JSON-строка)
                user_json = dict(pairs).get("user")
                user_data: Optional[Dict[str, Any]] = None
                if user_json:
                    try:
                        user_data = json.loads(user_json)  # ⚠️ уже правильно
                    except Exception:
                        user_data = None

                return {
                    "user": user_data or {},
                    "auth_date": auth_date,
                    "query_id": dict(pairs).get("query_id"),
                    "hash": received_hash,
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





