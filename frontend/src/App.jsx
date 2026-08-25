import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { isAuthenticated, logout, me } from "./api/client";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BankCard from "./pages/BankCard.jsx";
import Admin from "./pages/Admin.jsx";

function RequireAuth({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
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
          {user ? (
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
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login onLoggedIn={() => me().then(setUser)} />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/banks/:id" element={<BankCard />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Admin currentUser={user} />
              </RequireAuth>
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
