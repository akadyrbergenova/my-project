import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBanks } from "../api/client";

const SORT_OPTIONS = [
  { value: "name", label: "Название банка" },
  { value: "rate_min", label: "Ставка (мин.)" },
  { value: "amount_min", label: "Сумма (мин.)" },
  { value: "term_min_months", label: "Срок (мес., мин.)" },
  { value: "updated_at", label: "Дата обновления" },
];

function formatRange(min, max, unit = "") {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min}–${max}${unit}`;
  return `${min ?? max}${unit}`;
}

export default function Dashboard() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ rate_max: "", amount_min: "", term_min_months: "" });
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  const load = () => {
    setLoading(true);
    listBanks({ ...filters, sort_by: sortBy, order })
      .then(setBanks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [sortBy, order]);

  const applyFilters = (e) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="dashboard">
      <h1>Сравнение банков — залоговые кредиты МСБ</h1>

      <form className="filters" onSubmit={applyFilters}>
        <label>
          Ставка не выше, %
          <input
            type="number"
            step="0.1"
            value={filters.rate_max}
            onChange={(e) => setFilters({ ...filters, rate_max: e.target.value })}
          />
        </label>
        <label>
          Сумма от, тенге
          <input
            type="number"
            value={filters.amount_min}
            onChange={(e) => setFilters({ ...filters, amount_min: e.target.value })}
          />
        </label>
        <label>
          Срок от, мес.
          <input
            type="number"
            value={filters.term_min_months}
            onChange={(e) => setFilters({ ...filters, term_min_months: e.target.value })}
          />
        </label>
        <label>
          Сортировать по
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Порядок
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </label>
        <button type="submit">Применить фильтр</button>
      </form>

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Банк</th>
              <th>Ставка, %</th>
              <th>Сумма, тенге</th>
              <th>Срок, мес.</th>
              <th>LTV макс., %</th>
              <th>Погашение</th>
              <th>Обновлено</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b) => (
              <tr key={b.id} className={b.is_stale ? "row-stale" : ""}>
                <td>{b.name}</td>
                <td>{b.offer ? formatRange(b.offer.rate_min, b.offer.rate_max) : "—"}</td>
                <td>{b.offer ? formatRange(b.offer.amount_min, b.offer.amount_max) : "—"}</td>
                <td>{b.offer ? formatRange(b.offer.term_min_months, b.offer.term_max_months) : "—"}</td>
                <td>{b.offer?.ltv_max_percent ?? "—"}</td>
                <td>{repaymentLabel(b.offer?.repayment_method)}</td>
                <td>
                  {b.offer ? new Date(b.offer.updated_at).toLocaleDateString("ru-RU") : "нет данных"}
                  {b.is_stale && <span className="badge-stale">устарело</span>}
                </td>
                <td>
                  <Link to={`/banks/${b.id}`}>Подробнее</Link>
                </td>
              </tr>
            ))}
            {banks.length === 0 && (
              <tr>
                <td colSpan={8}>Нет данных. Добавьте банки и условия в разделе «Администрирование».</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function repaymentLabel(method) {
  switch (method) {
    case "annuity":
      return "Аннуитет";
    case "differentiated":
      return "Дифференцированный";
    case "other":
      return "Иное";
    default:
      return "—";
  }
}
