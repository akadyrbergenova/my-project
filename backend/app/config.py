from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # SQLite для старта MVP. Для перехода на PostgreSQL достаточно
    # переопределить DATABASE_URL, например:
    # postgresql+psycopg2://user:password@localhost:5432/rates_db
    database_url: str = "sqlite:///./rates.db"

    secret_key: str = "change-me-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12

    # Порог актуальности данных (дней) — раздел 7 ТЗ
    data_freshness_days: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
