from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..config import settings
from ..database import get_db

router = APIRouter(prefix="/banks", tags=["banks"])


def _is_stale(updated_at: Optional[datetime]) -> bool:
    if updated_at is None:
        return True
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - updated_at > timedelta(days=settings.data_freshness_days)


def _to_bank_with_offer(bank: models.Bank) -> schemas.BankWithOfferOut:
    offer_out = schemas.CreditOfferOut.model_validate(bank.offer) if bank.offer else None
    stale = _is_stale(bank.offer.updated_at) if bank.offer else True
    return schemas.BankWithOfferOut(
        id=bank.id,
        name=bank.name,
        website_url=bank.website_url,
        source_url=bank.source_url,
        is_active=bank.is_active,
        offer=offer_out,
        is_stale=stale,
    )


@router.get("", response_model=list[schemas.BankWithOfferOut])
def list_banks(
    rate_min: Optional[float] = None,
    rate_max: Optional[float] = None,
    amount_min: Optional[float] = None,
    term_min_months: Optional[int] = None,
    only_active: bool = True,
    sort_by: Literal["name", "rate_min", "amount_min", "term_min_months", "updated_at"] = "name",
    order: Literal["asc", "desc"] = "asc",
    db: Session = Depends(get_db),
):
    query = db.query(models.Bank)
    if only_active:
        query = query.filter(models.Bank.is_active.is_(True))
    banks = query.all()

    results = [_to_bank_with_offer(b) for b in banks]

    # Фильтрация по параметрам предложения (раздел 5.4)
    if rate_min is not None:
        results = [r for r in results if r.offer and r.offer.rate_min is not None and r.offer.rate_min >= rate_min]
    if rate_max is not None:
        results = [r for r in results if r.offer and r.offer.rate_max is not None and r.offer.rate_max <= rate_max]
    if amount_min is not None:
        results = [
            r for r in results if r.offer and r.offer.amount_max is not None and r.offer.amount_max >= amount_min
        ]
    if term_min_months is not None:
        results = [
            r
            for r in results
            if r.offer and r.offer.term_max_months is not None and r.offer.term_max_months >= term_min_months
        ]

    def sort_key(r: schemas.BankWithOfferOut):
        if sort_by == "name":
            return r.name.lower()
        if not r.offer:
            return float("inf")
        value = getattr(r.offer, sort_by, None)
        return value if value is not None else float("inf")

    results.sort(key=sort_key, reverse=(order == "desc"))
    return results


@router.get("/{bank_id}", response_model=schemas.BankWithOfferOut)
def get_bank(bank_id: int, db: Session = Depends(get_db)):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")
    return _to_bank_with_offer(bank)


@router.post("", response_model=schemas.BankOut)
def create_bank(
    payload: schemas.BankCreate,
    db: Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    existing = db.query(models.Bank).filter(models.Bank.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Банк с таким названием уже существует")
    bank = models.Bank(**payload.model_dump())
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return bank


@router.patch("/{bank_id}", response_model=schemas.BankOut)
def update_bank(
    bank_id: int,
    payload: schemas.BankUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(auth.require_admin),
):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(bank, field, value)
    db.commit()
    db.refresh(bank)
    return bank


@router.delete("/{bank_id}", status_code=204)
def delete_bank(
    bank_id: int, db: Session = Depends(get_db), _admin=Depends(auth.require_admin)
):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")
    db.delete(bank)
    db.commit()
    return None
