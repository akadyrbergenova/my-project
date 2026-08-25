from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routers import auth_router, banks, offers

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Платформа анализа рыночных ставок БВУ РК по залоговым кредитам МСБ",
    version="0.1.0-mvp",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(banks.router)
app.include_router(offers.router)


@app.get("/health")
def health():
    return {"status": "ok"}
