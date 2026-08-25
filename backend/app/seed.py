"""
Первоначальное наполнение БД для MVP:
- 3 пользователя (админ/оператор, начальник управления, директор департамента)
- список крупнейших БВУ РК (только названия — ссылки на страницы условий
  нужно собрать и проверить вручную, см. раздел 5.3 и F5 ТЗ)

Условия по кредитам (ставки, суммы и т.д.) сюда намеренно НЕ включены —
это реальные финансовые данные, которые должен внести оператор через
админ-панель после сверки с официальным сайтом банка (F1: "ручная проверка
данных оператором перед публикацией").

Запуск:
    python -m app.seed
"""

from .auth import hash_password
from .config import settings
from .database import Base, SessionLocal, engine
from .models import Bank, User, UserRole

# Крупнейшие действующие БВУ РК на момент составления ТЗ (2026).
# Список подлежит сверке с реестром АРРФР (https://www.gov.kz) — раздел 5.1 ТЗ.
SEED_BANKS = [
    "Halyk Bank",
    "Kaspi Bank",
    "Bank CenterCredit",
    "ForteBank",
    "Eurasian Bank",
    "Bereke Bank",
    "Jusan Bank",
]

def _seed_users():
    return [
        {
            "username": "admin",
            "password": settings.seed_admin_password,
            "full_name": "Оператор данных",
            "role": UserRole.ADMIN,
        },
        {
            "username": "head",
            "password": settings.seed_head_password,
            "full_name": "Начальник управления",
            "role": UserRole.HEAD,
        },
        {
            "username": "director",
            "password": settings.seed_director_password,
            "full_name": "Директор департамента",
            "role": UserRole.DIRECTOR,
        },
    ]


def run():
    Base.metadata.create_all(bind=engine)
    seed_users = _seed_users()
    db = SessionLocal()
    try:
        created_users = []
        for u in seed_users:
            if not db.query(User).filter(User.username == u["username"]).first():
                db.add(
                    User(
                        username=u["username"],
                        hashed_password=hash_password(u["password"]),
                        full_name=u["full_name"],
                        role=u["role"],
                    )
                )
                created_users.append(u)

        for name in SEED_BANKS:
            if not db.query(Bank).filter(Bank.name == name).first():
                db.add(Bank(name=name, website_url=None, source_url=None, is_active=True))

        db.commit()
        print(f"Готово. Пользователей: {len(seed_users)}, банков: {len(SEED_BANKS)}.")
        if created_users:
            print("Созданы учётные записи (ОБЯЗАТЕЛЬНО смените пароли перед реальным использованием):")
            for u in created_users:
                print(f"  {u['username']} / {u['password']}  ({u['role'].value})")
    finally:
        db.close()


if __name__ == "__main__":
    run()
