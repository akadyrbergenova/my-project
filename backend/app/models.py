import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    ADMIN = "admin"  # Администратор/оператор данных
    HEAD = "head"  # Начальник управления
    DIRECTOR = "director"  # Директор департамента


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.DIRECTOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)


class Bank(Base):
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    website_url = Column(String(500), nullable=True)
    source_url = Column(String(500), nullable=True)  # страница "Кредиты для бизнеса / МСБ"
    is_active = Column(Boolean, default=True)  # отслеживается ли банк
    created_at = Column(DateTime(timezone=True), default=utcnow)

    offer = relationship("CreditOffer", back_populates="bank", uselist=False, cascade="all, delete-orphan")
    history = relationship("RateHistory", back_populates="bank", cascade="all, delete-orphan")
    parsing_logs = relationship("ParsingLog", back_populates="bank", cascade="all, delete-orphan")


class RepaymentMethod(str, enum.Enum):
    ANNUITY = "annuity"  # аннуитетный
    DIFFERENTIATED = "differentiated"  # дифференцированный
    OTHER = "other"


class CreditOffer(Base):
    """Актуальные (последние верифицированные) условия по банку — раздел 5.4 ТЗ."""

    __tablename__ = "credit_offers"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), unique=True, nullable=False)

    rate_min = Column(Float, nullable=True)  # % годовых
    rate_max = Column(Float, nullable=True)

    amount_min = Column(Float, nullable=True)  # тенге
    amount_max = Column(Float, nullable=True)

    term_min_months = Column(Integer, nullable=True)
    term_max_months = Column(Integer, nullable=True)

    collateral_type = Column(String(500), nullable=True)  # вид залога
    ltv_max_percent = Column(Float, nullable=True)  # LTV / соотношение кредит-залог

    borrower_requirements = Column(Text, nullable=True)  # стаж бизнеса, оборот и т.п.
    fees = Column(Text, nullable=True)  # комиссии и доп. платежи
    repayment_method = Column(Enum(RepaymentMethod), nullable=True)

    source_note = Column(String(1000), nullable=True)  # откуда взяты данные / комментарий оператора
    verified = Column(Boolean, default=False)  # прошло ручную проверку оператором перед публикацией (F1)

    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    bank = relationship("Bank", back_populates="offer")
    updated_by = relationship("User")


class RateSource(str, enum.Enum):
    MANUAL = "manual"
    PARSER = "parser"
    WAYBACK = "wayback"
    NBRK = "nbrk"


class RateHistory(Base):
    """Снимок ставки на момент фиксации — для графиков динамики (F2) и требования раздела 7."""

    __tablename__ = "rate_history"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)

    rate_min = Column(Float, nullable=True)
    rate_max = Column(Float, nullable=True)

    source = Column(Enum(RateSource), default=RateSource.MANUAL)
    recorded_at = Column(DateTime(timezone=True), default=utcnow)

    bank = relationship("Bank", back_populates="history")


class ParsingStatus(str, enum.Enum):
    SUCCESS = "success"
    ERROR = "error"


class ParsingLog(Base):
    """Журнал запусков сбора данных — F5. В MVP заполняется вручную/при ручном вводе."""

    __tablename__ = "parsing_logs"

    id = Column(Integer, primary_key=True, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False)

    status = Column(Enum(ParsingStatus), nullable=False)
    message = Column(Text, nullable=True)
    run_at = Column(DateTime(timezone=True), default=utcnow)

    bank = relationship("Bank", back_populates="parsing_logs")
