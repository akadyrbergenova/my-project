import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { DEMO_MODE, isAuthenticated, logout, me } from "./api/client";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BankCard from "./pages/BankCard.jsx";
import Admin from "./pages/Admin.jsx";

function RequireAuth({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function DemoNotice() {
  return (
    <div className="demo-banner demo-banner--page">
      <p>
        Админ-панель и вход недоступны в статическом демо на GitHub Pages — здесь нет backend
        для их работы.
      </p>
      <p className="muted">
        Полная версия с рабочим входом и редактированием данных разворачивается отдельно (backend
        + БД) — подробности в README репозитория.
      </p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      me()
        .then(setUser)
        .catch(() => setUser(null));
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">Ставки БВУ РК — залоговые кредиты МСБ</div>
        <nav className="app-header__nav">
          <Link to="/">Дашборд</Link>
          {user?.role === "admin" && <Link to="/admin">Администрирование</Link>}
        </nav>
        <div className="app-header__user">
          {DEMO_MODE ? (
            <span className="muted">Демо-версия (без входа)</span>
          ) : user ? (
            <>
              <span>
                {user.full_name} ({roleLabel(user.role)})
              </span>
              <button onClick={handleLogout}>Выйти</button>
            </>
          ) : (
            <Link to="/login">Вход для оператора данных</Link>
          )}
        </div>
      </header>
      {DEMO_MODE && (
        <div className="demo-banner">
          Статическое демо на GitHub Pages с примерами данных — не отражает реальные ставки
          банков. Один банк («Пример») заполнен вымышленными цифрами для наглядности; у
          остальных данных нет, как и в рабочей версии проекта.
        </div>
      )}
      <main className="app-main">
        <Routes>
          <Route
            path="/login"
            element={DEMO_MODE ? <DemoNotice /> : <Login onLoggedIn={() => me().then(setUser)} />}
          />
          <Route path="/" element={<Dashboard />} />
          <Route path="/banks/:id" element={<BankCard />} />
          <Route
            path="/admin"
            element={
              DEMO_MODE ? (
                <DemoNotice />
              ) : (
                <RequireAuth>
                  <Admin currentUser={user} />
                </RequireAuth>
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function roleLabel(role) {
  switch (role) {
    case "admin":
      return "администратор/оператор";
    case "head":
      return "начальник управления";
    case "director":
      return "директор департамента";
    default:
      return role;
  }
}
