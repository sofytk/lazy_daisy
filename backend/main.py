from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import uvicorn
import os
import json
from dotenv import load_dotenv

# Import our modules
from database import get_db, create_tables, init_default_skins, User, Skin, UserSkin, Referral, Purchase
from telegram_auth import TelegramAuth
from payment_service import TelegramPaymentService

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Daisy Game Telegram Mini App API",
    description="API for the Daisy Game Telegram Mini App with referrals, shop, and payments",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
BOT_TOKEN = os.getenv("BOT_TOKEN", "your_bot_token_here")
PROVIDER_TOKEN = os.getenv("PROVIDER_TOKEN", "your_provider_token_here")

telegram_auth = TelegramAuth(BOT_TOKEN)
payment_service = TelegramPaymentService(BOT_TOKEN, PROVIDER_TOKEN)

# Pydantic models
class AuthRequest(BaseModel):
    initData: str

class UserResponse(BaseModel):
    id: int
    tg_id: int
    username: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    balance: int
    referrals_count: int
    current_skin_id: int
    custom_texts: Optional[List[str]] = None

class SkinResponse(BaseModel):
    id: int
    name: str
    price: int
    color: str
    is_default: bool
    owned: bool = False

class BuySkinRequest(BaseModel):
    skin_id: int

class ReferralResponse(BaseModel):
    id: int
    invited_user: Dict[str, Any]
    rewarded: bool
    created_at: str

class CreatePaymentRequest(BaseModel):
    amount: int
    description: str = "Пополнение баланса"

class PaymentCallback(BaseModel):
    id: str
    currency: str
    total_amount: int
    invoice_payload: str

class CustomTextRequest(BaseModel):
    texts: List[str]

# Helper function to get current user
def get_current_user(init_data: str, db: Session = Depends(get_db)) -> User:
    verified_data = telegram_auth.verify_init_data(init_data)
    if not verified_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    
    user_info = telegram_auth.extract_user_info(verified_data)
    tg_id = user_info['tg_id']
    
    # Find or create user
    user = db.query(User).filter(User.tg_id == tg_id).first()
    if not user:
        user = User(
            tg_id=tg_id,
            username=user_info.get('username'),
            first_name=user_info.get('first_name'),
            last_name=user_info.get('last_name'),
            balance=100,  # Стартовый бонус
            custom_texts=json.dumps(["любит", "не любит"])  # Дефолтные тексты
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

# Routes
@app.on_event("startup")
async def startup_event():
    create_tables()
    init_default_skins()

@app.get("/")
async def root():
    return {"message": "Welcome to Daisy Game Telegram Mini App API!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Auth endpoints
@app.post("/api/auth", response_model=UserResponse)
async def auth_user(auth_request: AuthRequest, db: Session = Depends(get_db)):
    """Авторизация пользователя через Telegram WebApp"""
    user = get_current_user(auth_request.initData, db)
    
    # Парсим кастомные тексты
    custom_texts = []
    if user.custom_texts:
        try:
            custom_texts = json.loads(user.custom_texts)
        except:
            custom_texts = ["любит", "не любит"]
    else:
        custom_texts = ["любит", "не любит"]
    
    return UserResponse(
        id=user.id,
        tg_id=user.tg_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        balance=user.balance,
        referrals_count=user.referrals_count,
        current_skin_id=user.current_skin_id,
        custom_texts=custom_texts
    )

# User endpoints
@app.get("/api/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Получение профиля пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        tg_id=user.tg_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        balance=user.balance,
        referrals_count=user.referrals_count,
        current_skin_id=user.current_skin_id
    )

# Balance endpoints
@app.get("/api/balance")
async def get_balance(init_data: str, db: Session = Depends(get_db)):
    """Получение текущего баланса"""
    user = get_current_user(init_data, db)
    return {"balance": user.balance}

@app.post("/api/balance/add")
async def add_balance(amount: int, init_data: str, db: Session = Depends(get_db)):
    """Добавление валюты (по оплате или рефералу)"""
    user = get_current_user(init_data, db)
    user.balance += amount
    
    # Записываем покупку
    purchase = Purchase(
        user_id=user.id,
        item_type="balance",
        amount=amount
    )
    db.add(purchase)
    db.commit()
    
    return {"message": "Balance updated", "new_balance": user.balance}

# Skins endpoints
@app.get("/api/skins", response_model=List[SkinResponse])
async def get_skins(init_data: str, db: Session = Depends(get_db)):
    """Получение всех доступных скинов ромашек"""
    user = get_current_user(init_data, db)
    skins = db.query(Skin).all()
    
    # Получаем скины пользователя
    user_skin_ids = {us.skin_id for us in user.user_skins}
    
    result = []
    for skin in skins:
        result.append(SkinResponse(
            id=skin.id,
            name=skin.name,
            price=skin.price,
            color=skin.color or "#FFFFFF",
            is_default=skin.is_default,
            owned=skin.id in user_skin_ids or skin.is_default
        ))
    
    return result

@app.post("/api/skins/buy")
async def buy_skin(request: BuySkinRequest, init_data: str, db: Session = Depends(get_db)):
    """Покупка скина ромашки"""
    user = get_current_user(init_data, db)
    skin = db.query(Skin).filter(Skin.id == request.skin_id).first()
    
    if not skin:
        raise HTTPException(status_code=404, detail="Skin not found")
    
    if skin.is_default:
        raise HTTPException(status_code=400, detail="Cannot buy default skin")
    
    # Проверяем, есть ли уже этот скин
    existing_skin = db.query(UserSkin).filter(
        UserSkin.user_id == user.id,
        UserSkin.skin_id == request.skin_id
    ).first()
    
    if existing_skin:
        raise HTTPException(status_code=400, detail="Skin already owned")
    
    if user.balance < skin.price:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Покупаем скин
    user.balance -= skin.price
    user_skin = UserSkin(user_id=user.id, skin_id=request.skin_id)
    
    # Записываем покупку
    purchase = Purchase(
        user_id=user.id,
        item_type="skin",
        item_id=request.skin_id,
        amount=skin.price
    )
    
    db.add(user_skin)
    db.add(purchase)
    db.commit()
    
    return {"message": "Skin purchased successfully", "new_balance": user.balance}

@app.post("/api/skins/select")
async def select_skin(skin_id: int, init_data: str, db: Session = Depends(get_db)):
    """Выбор текущего скина"""
    user = get_current_user(init_data, db)
    
    # Проверяем, есть ли у пользователя этот скин
    user_skin = db.query(UserSkin).filter(
        UserSkin.user_id == user.id,
        UserSkin.skin_id == skin_id
    ).first()
    
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    
    if not skin:
        raise HTTPException(status_code=404, detail="Skin not found")
    
    if not user_skin and not skin.is_default:
        raise HTTPException(status_code=400, detail="Skin not owned")
    
    user.current_skin_id = skin_id
    db.commit()
    
    return {"message": "Skin selected successfully"}

# Referrals endpoints
@app.get("/api/referrals", response_model=List[ReferralResponse])
async def get_referrals(init_data: str, db: Session = Depends(get_db)):
    """Получение списка приглашенных пользователей"""
    user = get_current_user(init_data, db)
    referrals = db.query(Referral).filter(Referral.inviter_id == user.id).all()
    
    result = []
    for ref in referrals:
        invited_user = db.query(User).filter(User.id == ref.invited_id).first()
        result.append(ReferralResponse(
            id=ref.id,
            invited_user={
                "id": invited_user.id,
                "username": invited_user.username,
                "first_name": invited_user.first_name
            },
            rewarded=ref.rewarded,
            created_at=ref.created_at.isoformat()
        ))
    
    return result

@app.post("/api/referrals/apply")
async def apply_referral(referral_code: str, init_data: str, db: Session = Depends(get_db)):
    """Применение реферального кода"""
    user = get_current_user(init_data, db)
    
    # Извлекаем ID пригласившего из кода
    if not referral_code.startswith("ref"):
        raise HTTPException(status_code=400, detail="Invalid referral code")
    
    try:
        inviter_id = int(referral_code[3:])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid referral code")
    
    # Проверяем, что пользователь не приглашает сам себя
    if inviter_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot refer yourself")
    
    # Проверяем, что реферал уже не был применен
    existing_referral = db.query(Referral).filter(
        Referral.invited_id == user.id
    ).first()
    
    if existing_referral:
        raise HTTPException(status_code=400, detail="Referral already applied")
    
    # Создаем реферал
    referral = Referral(inviter_id=inviter_id, invited_id=user.id)
    db.add(referral)
    
    # Даем бонусы обоим пользователям
    inviter = db.query(User).filter(User.id == inviter_id).first()
    if inviter:
        inviter.balance += 50  # Бонус за приглашение
        inviter.referrals_count += 1
        
        # Записываем покупку
        purchase = Purchase(
            user_id=inviter.id,
            item_type="referral_bonus",
            amount=50
        )
        db.add(purchase)
    
    user.balance += 25  # Бонус за регистрацию по рефералу
    
    # Записываем покупку
    purchase = Purchase(
        user_id=user.id,
        item_type="referral_bonus",
        amount=25
    )
    db.add(purchase)
    
    db.commit()
    
    return {"message": "Referral applied successfully", "bonus": 25}

# Payments endpoints
@app.post("/api/payments/create")
async def create_payment(request: CreatePaymentRequest, init_data: str, db: Session = Depends(get_db)):
    """Создание счета для пополнения баланса"""
    user = get_current_user(init_data, db)
    
    if request.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum amount is 10 rubles")
    
    try:
        invoice = payment_service.create_invoice(
            user_id=user.tg_id,
            title="Пополнение баланса",
            description=f"Пополнение баланса на {request.amount} листиков",
            amount=request.amount,
            payload=f"balance_{user.id}_{request.amount}"
        )
        
        return {"invoice": invoice}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/payments/callback")
async def payment_callback(payment: PaymentCallback, db: Session = Depends(get_db)):
    """Обработка успешного платежа"""
    try:
        payment_data = payment_service.process_successful_payment(payment.dict())
        
        # Извлекаем данные из payload
        payload_parts = payment_data["payload"].split("_")
        if len(payload_parts) >= 3 and payload_parts[0] == "balance":
            user_id = int(payload_parts[1])
            amount = int(payload_parts[2])
            
            # Обновляем баланс пользователя
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.balance += amount
                
                # Записываем покупку
                purchase = Purchase(
                    user_id=user.id,
                    item_type="balance",
                    amount=amount,
                    payment_id=payment_data["payment_id"]
                )
                db.add(purchase)
                db.commit()
                
                return {"status": "success", "new_balance": user.balance}
        
        return {"status": "error", "message": "Invalid payload"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Custom texts endpoints
@app.get("/api/custom-texts")
async def get_custom_texts(init_data: str, db: Session = Depends(get_db)):
    """Получение кастомных текстов пользователя"""
    user = get_current_user(init_data, db)
    
    custom_texts = []
    if user.custom_texts:
        try:
            custom_texts = json.loads(user.custom_texts)
        except:
            custom_texts = ["любит", "не любит"]
    else:
        custom_texts = ["любит", "не любит"]
    
    return {"texts": custom_texts}

@app.post("/api/custom-texts")
async def update_custom_texts(request: CustomTextRequest, init_data: str, db: Session = Depends(get_db)):
    """Обновление кастомных текстов пользователя"""
    user = get_current_user(init_data, db)
    
    # Проверяем количество текстов (максимум 3 бесплатно)
    if len(request.texts) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 custom texts allowed")
    
    # Проверяем длину каждого текста
    for text in request.texts:
        if len(text) > 20:
            raise HTTPException(status_code=400, detail="Text too long (max 20 characters)")
        if len(text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Обновляем тексты
    user.custom_texts = json.dumps(request.texts)
    db.commit()
    
    return {"message": "Custom texts updated successfully", "texts": request.texts}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
