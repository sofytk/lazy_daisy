from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./daisy_game.db")

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tg_id = Column(BigInteger, unique=True, index=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    balance = Column(Integer, default=0)  # Листики
    referrals_count = Column(Integer, default=0)
    current_skin_id = Column(Integer, default=1)  # ID текущего скина
    custom_texts = Column(String, nullable=True)  # JSON с кастомными текстами
    daisies_left = Column(Integer, default=2)  # Остаток ромашек
    texts_preset_key = Column(String, nullable=True)  # Ключ выбранного пресета
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    referrals = relationship("Referral", foreign_keys="Referral.inviter_id", back_populates="inviter")
    invited_by = relationship("Referral", foreign_keys="Referral.invited_id", back_populates="invited")
    user_skins = relationship("UserSkin", back_populates="user")
    purchases = relationship("Purchase", back_populates="user")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, index=True)
    inviter_id = Column(Integer, ForeignKey("users.id"))
    invited_id = Column(Integer, ForeignKey("users.id"))
    rewarded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    inviter = relationship("User", foreign_keys=[inviter_id], back_populates="referrals")
    invited = relationship("User", foreign_keys=[invited_id], back_populates="invited_by")

class Skin(Base):
    __tablename__ = "skins"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)  # Цена в листиках
    image_url = Column(String, nullable=True)
    color = Column(String, nullable=True)  # Цвет ромашки
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_skins = relationship("UserSkin", back_populates="skin")

class UserSkin(Base):
    __tablename__ = "user_skins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skin_id = Column(Integer, ForeignKey("skins.id"))
    purchased_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="user_skins")
    skin = relationship("Skin", back_populates="user_skins")

class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_type = Column(String, nullable=False)  # "skin", "balance", "referral_bonus"
    item_id = Column(Integer, nullable=True)  # ID скина или null для баланса
    amount = Column(Integer, nullable=False)  # Сумма в листиках
    payment_id = Column(String, nullable=True)  # ID платежа Telegram
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="purchases")

class Result(Base):
    __tablename__ = "results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    result_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize default skins
def init_default_skins():
    db = SessionLocal()
    try:
        # Check if skins already exist
        if db.query(Skin).count() > 0:
            return
            
        default_skins = [
            {"name": "Классическая ромашка", "price": 0, "color": "#FFFFFF", "is_default": True},
            {"name": "Фиолетовая ромашка", "price": 23, "color": "#9C27B0"},
            {"name": "Синяя ромашка", "price": 45, "color": "#2196F3"},
            {"name": "Розовая ромашка", "price": 37, "color": "#E91E63"},
            {"name": "Оранжевая ромашка", "price": 50, "color": "#FF9800"},
        ]
        
        for skin_data in default_skins:
            skin = Skin(**skin_data)
            db.add(skin)
        
        db.commit()
    finally:
        db.close()
