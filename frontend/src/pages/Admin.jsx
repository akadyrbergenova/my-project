import React, { useEffect, useState } from "react";
import {
  createBank,
  deleteBank,
  listBanks,
  updateBank,
  upsertOffer,
} from "../api/client";

const EMPTY_BANK = { name: "", website_url: "", source_url: "" };

const EMPTY_OFFER = {
  rate_min: "",
  rate_max: "",
  amount_min: "",
  amount_max: "",
  term_min_months: "",
  term_max_months: "",
  collateral_type: "",
  ltv_max_percent: "",
  borrower_requirements: "",
  fees: "",
  repayment_method: "",
  source_note: "",
  verified: false,
};

export default function Admin({ currentUser }) {
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [newBank, setNewBank] = useState(EMPTY_BANK);
  const [selectedId, setSelectedId] = useState(null);
  const [offerForm, setOfferForm] = useState(EMPTY_OFFER);
  const [bankEditForm, setBankEditForm] = useState(null);

  const load = () => {
    listBanks({ only_active: false }).then(setBanks).catch((err) => setError(err.message));
  };

  useEffect(load, []);

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="admin-page">
        <p className="form-error">
          Раздел администрирования доступен только роли «Администратор/оператор данных».
        </p>
      </div>
    );
  }

  const selectedBank = banks.find((b) => b.id === selectedId) || null;

  const selectBank = (bank) => {
    setSelectedId(bank.id);
    setBankEditForm({
      name: bank.name,
      website_url: bank.website_url || "",
      source_url: bank.source_url || "",
    });
    const o = bank.offer;
    setOfferForm(
      o
        ? {
            rate_min: o.rate_min ?? "",
            rate_max: o.rate_max ?? "",
            amount_min: o.amount_min ?? "",
            amount_max: o.amount_max ?? "",
            term_min_months: o.term_min_months ?? "",
            term_max_months: o.term_max_months ?? "",
            collateral_type: o.collateral_type ?? "",
            ltv_max_percent: o.ltv_max_percent ?? "",
            borrower_requirements: o.borrower_requirements ?? "",
            fees: o.fees ?? "",
            repayment_method: o.repayment_method ?? "",
            source_note: o.source_note ?? "",
            verified: o.verified ?? false,
          }
        : EMPTY_OFFER
    );
  };

  const handleCreateBank = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createBank(newBank);
      setNewBank(EMPTY_BANK);
      setNotice("Банк добавлен.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!selectedBank) return;
    setError(null);
    try {
      await updateBank(selectedBank.id, bankEditForm);
      setNotice("Данные банка обновлены.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBank = async (bank) => {
    if (!window.confirm(`Удалить банк «${bank.name}» и все связанные данные?`)) return;
    setError(null);
    try {
      await deleteBank(bank.id);
      if (selectedId === bank.id) setSelectedId(null);
      setNotice("Банк удалён.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!selectedBank) return;
    setError(null);
    const numericFields = [
      "rate_min",
      "rate_max",
      "amount_min",
      "amount_max",
      "term_min_months",
      "term_max_months",
      "ltv_max_percent",
    ];
    const payload = { ...offerForm };
    for (const f of numericFields) {
      payload[f] = payload[f] === "" ? null : Number(payload[f]);
    }
    if (payload.repayment_method === "") payload.repayment_method = null;
    try {
      await upsertOffer(selectedBank.id, payload);
      setNotice("Условия по банку сохранены и зафиксированы в истории.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <h1>Администрирование</h1>
      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-notice">{notice}</div>}

      <section>
        <h2>Банки</h2>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Активен</th>
              <th>Данные внесены</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.is_active ? "Да" : "Нет"}</td>
                <td>{b.offer ? "Да" : "Нет"}</td>
                <td>
                  <button onClick={() => selectBank(b)}>Редактировать</button>{" "}
                  <button onClick={() => handleDeleteBank(b)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Добавить банк</h2>
        <form className="stacked-form" onSubmit={handleCreateBank}>
          <label>
            Название
            <input
              value={newBank.name}
              onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
              required
            />
          </label>
          <label>
            Сайт банка (главная)
            <input
              value={newBank.website_url}
              onChange={(e) => setNewBank({ ...newBank, website_url: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label>
            Ссылка на раздел «Кредиты для бизнеса / МСБ»
            <input
              value={newBank.source_url}
              onChange={(e) => setNewBank({ ...newBank, source_url: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <button type="submit">Добавить банк</button>
        </form>
      </section>

      {selectedBank && (
        <>
          <section>
            <h2>Карточка банка: {selectedBank.name}</h2>
            <form className="stacked-form" onSubmit={handleSaveBank}>
              <label>
                Название
                <input
                  value={bankEditForm.name}
                  onChange={(e) => setBankEditForm({ ...bankEditForm, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Сайт банка
                <input
                  value={bankEditForm.website_url}
                  onChange={(e) => setBankEditForm({ ...bankEditForm, website_url: e.target.value })}
                />
              </label>
              <label>
                Ссылка на условия МСБ
                <input
                  value={bankEditForm.source_url}
                  onChange={(e) => setBankEditForm({ ...bankEditForm, source_url: e.target.value })}
                />
              </label>
              <button type="submit">Сохранить данные о банке</button>
            </form>
          </section>

          <section>
            <h2>Условия залогового кредитования МСБ</h2>
            <p className="muted">
              Вносите данные только после сверки с официальным сайтом банка (раздел «Кредиты для
              бизнеса»). Каждое сохранение фиксируется в истории ставок.
            </p>
            <form className="stacked-form offer-form" onSubmit={handleSaveOffer}>
              <div className="form-row">
                <label>
                  Ставка мин., %
                  <input
                    type="number"
                    step="0.01"
                    value={offerForm.rate_min}
                    onChange={(e) => setOfferForm({ ...offerForm, rate_min: e.target.value })}
                  />
                </label>
                <label>
                  Ставка макс., %
                  <input
                    type="number"
                    step="0.01"
                    value={offerForm.rate_max}
                    onChange={(e) => setOfferForm({ ...offerForm, rate_max: e.target.value })}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Сумма мин., тенге
                  <input
                    type="number"
                    value={offerForm.amount_min}
                    onChange={(e) => setOfferForm({ ...offerForm, amount_min: e.target.value })}
                  />
                </label>
                <label>
                  Сумма макс., тенге
                  <input
                    type="number"
                    value={offerForm.amount_max}
                    onChange={(e) => setOfferForm({ ...offerForm, amount_max: e.target.value })}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Срок мин., мес.
                  <input
                    type="number"
                    value={offerForm.term_min_months}
                    onChange={(e) => setOfferForm({ ...offerForm, term_min_months: e.target.value })}
                  />
                </label>
                <label>
                  Срок макс., мес.
                  <input
                    type="number"
                    value={offerForm.term_max_months}
                    onChange={(e) => setOfferForm({ ...offerForm, term_max_months: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Вид залога
                <input
                  value={offerForm.collateral_type}
                  onChange={(e) => setOfferForm({ ...offerForm, collateral_type: e.target.value })}
                  placeholder="Недвижимость, оборудование и т.д."
                />
              </label>
              <label>
                LTV макс., %
                <input
                  type="number"
                  step="0.1"
                  value={offerForm.ltv_max_percent}
                  onChange={(e) => setOfferForm({ ...offerForm, ltv_max_percent: e.target.value })}
                />
              </label>
              <label>
                Требования к заёмщику
                <textarea
                  value={offerForm.borrower_requirements}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, borrower_requirements: e.target.value })
                  }
                  rows={2}
                />
              </label>
              <label>
                Комиссии и доп. платежи
                <textarea
                  value={offerForm.fees}
                  onChange={(e) => setOfferForm({ ...offerForm, fees: e.target.value })}
                  rows={2}
                />
              </label>
              <label>
                Способ погашения
                <select
                  value={offerForm.repayment_method}
                  onChange={(e) => setOfferForm({ ...offerForm, repayment_method: e.target.value })}
                >
                  <option value="">Не указано</option>
                  <option value="annuity">Аннуитетный</option>
                  <option value="differentiated">Дифференцированный</option>
                  <option value="other">Иное</option>
                </select>
              </label>
              <label>
                Источник / комментарий оператора
                <textarea
                  value={offerForm.source_note}
                  onChange={(e) => setOfferForm({ ...offerForm, source_note: e.target.value })}
                  rows={2}
                  placeholder="Например: сверено с сайтом банка 25.08.2026, раздел «Кредиты для бизнеса»"
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={offerForm.verified}
                  onChange={(e) => setOfferForm({ ...offerForm, verified: e.target.checked })}
                />
                Данные проверены оператором и готовы к публикации
              </label>
              <button type="submit">Сохранить условия</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
