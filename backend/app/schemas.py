from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .models import ParsingStatus, RateSource, RepaymentMethod, UserRole


# ---------- Auth ----------


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: UserRole
    is_active: bool


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole = UserRole.DIRECTOR


# ---------- Bank ----------


class BankBase(BaseModel):
    name: str
    website_url: Optional[str] = None
    source_url: Optional[str] = None
    is_active: bool = True


class BankCreate(BankBase):
    pass


class BankUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[str] = None
    source_url: Optional[str] = None
    is_active: Optional[bool] = None


class BankOut(BankBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


# ---------- Credit offer ----------


class CreditOfferBase(BaseModel):
    rate_min: Optional[float] = None
    rate_max: Optional[float] = None
    amount_min: Optional[float] = None
    amount_max: Optional[float] = None
    term_min_months: Optional[int] = None
    term_max_months: Optional[int] = None
    collateral_type: Optional[str] = None
    ltv_max_percent: Optional[float] = None
    borrower_requirements: Optional[str] = None
    fees: Optional[str] = None
    repayment_method: Optional[RepaymentMethod] = None
    source_note: Optional[str] = None
    verified: bool = False


class CreditOfferUpsert(CreditOfferBase):
    pass


class CreditOfferOut(CreditOfferBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bank_id: int
    updated_at: datetime


class RateHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bank_id: int
    rate_min: Optional[float]
    rate_max: Optional[float]
    source: RateSource
    recorded_at: datetime


# ---------- Bank + offer combined (для дашборда) ----------


class BankWithOfferOut(BaseModel):
    id: int
    name: str
    website_url: Optional[str] = None
    source_url: Optional[str] = None
    is_active: bool
    offer: Optional[CreditOfferOut] = None
    is_stale: bool = False  # данные не обновлялись дольше порога актуальности


# ---------- Parsing log ----------


class ParsingLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bank_id: int
    status: ParsingStatus
    message: Optional[str]
    run_at: datetime
