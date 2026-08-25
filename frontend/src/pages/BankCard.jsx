import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBank, getHistory } from "../api/client";

export default function BankCard() {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBank(id).then(setBank).catch((err) => setError(err.message));
    getHistory(id)
      .then((rows) =>
        setHistory(
          rows.map((r) => ({
            date: new Date(r.recorded_at).toLocaleDateString("ru-RU"),
            rate_min: r.rate_min,
            rate_max: r.rate_max,
          }))
        )
      )
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="form-error">{error}</div>;
  if (!bank) return <p>Загрузка...</p>;

  const offer = bank.offer;

  return (
    <div className="bank-card">
      <Link to="/">&larr; К сравнительной таблице</Link>
      <h1>{bank.name}</h1>
      {bank.website_url && (
        <p>
          <a href={bank.website_url} target="_blank" rel="noreferrer">
            {bank.website_url}
          </a>
        </p>
      )}
      {bank.is_stale && <div className="badge-stale badge-stale--large">данные устарели</div>}

      {!offer && <p>По этому банку ещё не внесены условия кредитования.</p>}

      {offer && (
        <>
          <section className="bank-card__grid">
            <Field label="Процентная ставка" value={formatRange(offer.rate_min, offer.rate_max, " %")} />
            <Field label="Сумма кредита" value={formatRange(offer.amount_min, offer.amount_max, " тенге")} />
            <Field
              label="Срок кредитования"
              value={formatRange(offer.term_min_months, offer.term_max_months, " мес.")}
            />
            <Field label="Вид залога" value={offer.collateral_type || "—"} />
            <Field label="LTV макс." value={offer.ltv_max_percent != null ? `${offer.ltv_max_percent} %` : "—"} />
            <Field label="Способ погашения" value={repaymentLabel(offer.repayment_method)} />
            <Field label="Требования к заёмщику" value={offer.borrower_requirements || "—"} wide />
            <Field label="Комиссии и доп. платежи" value={offer.fees || "—"} wide />
            <Field label="Источник / комментарий" value={offer.source_note || "—"} wide />
            <Field
              label="Обновлено"
              value={new Date(offer.updated_at).toLocaleString("ru-RU")}
            />
            <Field label="Проверено оператором" value={offer.verified ? "Да" : "Нет"} />
          </section>

          <section className="bank-card__advantages">
            <h2>Конкурентные преимущества/недостатки</h2>
            <p className="muted">
              Автоматическое формирование преимуществ/недостатков относительно рынка (модуль анализа,
              F3) запланировано на следующем этапе развития платформы — после накопления данных по
              всем банкам.
            </p>
          </section>
        </>
      )}

      <section className="bank-card__history">
        <h2>Динамика ставки</h2>
        {history.length === 0 ? (
          <p className="muted">История ещё не накоплена.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit="%" />
              <Tooltip />
              <Line type="monotone" dataKey="rate_min" name="Ставка мин." stroke="#1f4e79" />
              <Line type="monotone" dataKey="rate_max" name="Ставка макс." stroke="#a02b2b" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, wide }) {
  return (
    <div className={`field ${wide ? "field--wide" : ""}`}>
      <div className="field__label">{label}</div>
      <div className="field__value">{value}</div>
    </div>
  );
}

function formatRange(min, max, unit = "") {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min}–${max}${unit}`;
  return `${min ?? max}${unit}`;
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
