from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(prefix="/banks/{bank_id}", tags=["offers"])


@router.put("/offer", response_model=schemas.CreditOfferOut)
def upsert_offer(
    bank_id: int,
    payload: schemas.CreditOfferUpsert,
    db: Session = Depends(get_db),
    admin: models.User = Depends(auth.require_admin),
):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")

    offer = db.query(models.CreditOffer).filter(models.CreditOffer.bank_id == bank_id).first()
    data = payload.model_dump()
    if offer is None:
        offer = models.CreditOffer(bank_id=bank_id, **data)
        db.add(offer)
    else:
        for field, value in data.items():
            setattr(offer, field, value)
    offer.updated_by_id = admin.id

    # Раздел 7 ТЗ: каждое значение ставки сохраняется с датой фиксации
    history_entry = models.RateHistory(
        bank_id=bank_id,
        rate_min=payload.rate_min,
        rate_max=payload.rate_max,
        source=models.RateSource.MANUAL,
    )
    db.add(history_entry)

    db.commit()
    db.refresh(offer)
    return offer


@router.get("/history", response_model=List[schemas.RateHistoryOut])
def get_history(bank_id: int, db: Session = Depends(get_db)):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")
    return (
        db.query(models.RateHistory)
        .filter(models.RateHistory.bank_id == bank_id)
        .order_by(models.RateHistory.recorded_at.asc())
        .all()
    )


@router.post("/parsing-logs", response_model=schemas.ParsingLogOut)
def add_parsing_log(
    bank_id: int,
    status: models.ParsingStatus,
    message: str = "",
    db: Session = Depends(get_db),
    _admin: models.User = Depends(auth.require_admin),
):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")
    log = models.ParsingLog(bank_id=bank_id, status=status, message=message)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/parsing-logs", response_model=List[schemas.ParsingLogOut])
def list_parsing_logs(
    bank_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(auth.get_current_user),
):
    bank = db.query(models.Bank).filter(models.Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Банк не найден")
    return (
        db.query(models.ParsingLog)
        .filter(models.ParsingLog.bank_id == bank_id)
        .order_by(models.ParsingLog.run_at.desc())
        .all()
    )
