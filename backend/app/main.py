from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import settings
from .database import Base, engine
from .routers import auth_router, banks, offers

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Платформа анализа рыночных ставок БВУ РК по залоговым кредитам МСБ",
    version="0.1.0-mvp",
)

allow_origins = ["http://localhost:5173"]
if settings.frontend_origin:
    allow_origins.append(settings.frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
