// Данные для статического демо на GitHub Pages (без backend).
// Реальные банки перечислены БЕЗ выдуманных ставок — как и в рабочей версии
// проекта, эти цифры должен вносить оператор после сверки с сайтом банка.
// Единственный банк с заполненными условиями — явно вымышленный
// «Банк «Пример»», чтобы показать, как выглядит таблица/карточка/график
// после того как оператор внесёт реальные данные.

const now = new Date();
const staleDate = new Date(now);
staleDate.setDate(staleDate.getDate() - 5);

export const DEMO_BANKS = [
  { id: 1, name: "Halyk Bank", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  { id: 2, name: "Kaspi Bank", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  { id: 3, name: "Bank CenterCredit", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  { id: 4, name: "ForteBank", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  { id: 5, name: "Eurasian Bank", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  { id: 6, name: "Bereke Bank", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  { id: 7, name: "Jusan Bank", website_url: null, source_url: null, is_active: true, offer: null, is_stale: true },
  {
    id: 8,
    name: 'Банк «Пример» (демо-данные, не реальный банк)',
    website_url: null,
    source_url: null,
    is_active: true,
    is_stale: false,
    offer: {
      id: 1,
      bank_id: 8,
      rate_min: 14.5,
      rate_max: 18.0,
      amount_min: 5000000,
      amount_max: 300000000,
      term_min_months: 6,
      term_max_months: 84,
      collateral_type: "Недвижимость, оборудование",
      ltv_max_percent: 70,
      borrower_requirements: "Стаж бизнеса от 6 месяцев, положительная кредитная история",
      fees: "Комиссия за рассмотрение заявки — 0%, за выдачу — 1%",
      repayment_method: "annuity",
      source_note: "Иллюстративный пример — не реальные условия банка",
      verified: true,
      updated_at: staleDate.toISOString(),
    },
  },
];

export const DEMO_HISTORY = {
  8: [
    { id: 1, bank_id: 8, rate_min: 16.5, rate_max: 19.5, source: "manual", recorded_at: "2025-09-01T00:00:00Z" },
    { id: 2, bank_id: 8, rate_min: 16.0, rate_max: 19.0, source: "manual", recorded_at: "2025-11-01T00:00:00Z" },
    { id: 3, bank_id: 8, rate_min: 15.5, rate_max: 18.5, source: "manual", recorded_at: "2026-01-15T00:00:00Z" },
    { id: 4, bank_id: 8, rate_min: 14.5, rate_max: 18.0, source: "manual", recorded_at: "2026-03-20T00:00:00Z" },
  ],
};

export function demoListBanks(params = {}) {
  let results = DEMO_BANKS.filter((b) => (params.only_active === "false" ? true : b.is_active));

  if (params.rate_min) {
    results = results.filter((r) => r.offer && r.offer.rate_min != null && r.offer.rate_min >= Number(params.rate_min));
  }
  if (params.rate_max) {
    results = results.filter((r) => r.offer && r.offer.rate_max != null && r.offer.rate_max <= Number(params.rate_max));
  }
  if (params.amount_min) {
    results = results.filter(
      (r) => r.offer && r.offer.amount_max != null && r.offer.amount_max >= Number(params.amount_min)
    );
  }
  if (params.term_min_months) {
    results = results.filter(
      (r) => r.offer && r.offer.term_max_months != null && r.offer.term_max_months >= Number(params.term_min_months)
    );
  }

  const sortBy = params.sort_by || "name";
  const order = params.order || "asc";
  results = [...results].sort((a, b) => {
    let av, bv;
    if (sortBy === "name") {
      av = a.name.toLowerCase();
      bv = b.name.toLowerCase();
    } else {
      av = a.offer ? a.offer[sortBy] : null;
      bv = b.offer ? b.offer[sortBy] : null;
      av = av == null ? Infinity : av;
      bv = bv == null ? Infinity : bv;
    }
    if (av < bv) return order === "asc" ? -1 : 1;
    if (av > bv) return order === "asc" ? 1 : -1;
    return 0;
  });

  return Promise.resolve(results);
}

export function demoGetBank(id) {
  const bank = DEMO_BANKS.find((b) => String(b.id) === String(id));
  if (!bank) return Promise.reject(new Error("Банк не найден"));
  return Promise.resolve(bank);
}

export function demoGetHistory(id) {
  return Promise.resolve(DEMO_HISTORY[id] || []);
}
