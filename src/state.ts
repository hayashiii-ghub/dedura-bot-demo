export const MONTH = '2026-09'
export const TODAY = `${MONTH}-22`
export const KEY = 'dedura-bot-demo:v1'
export const SITES = ['桜町の家', 'ひなた商店', '川辺のアトリエ']
export type Work = { id: string; day: string; site: string; start: string; end: string; minutes: number }
export type Expense = { id: string; day: string; vendor: string; category: string; amount: number; confirmed: boolean; photo?: string }
export type Invoice = { id: string; client: string; site: string; amount: number; issued: boolean; paid: boolean; due: string }
export type State = {
  version: 1; name: string; theme: 'system' | 'light' | 'dark'; pins: string[];
  works: Work[]; expenses: Expense[]; invoices: Invoice[];
  clock: { site: string; at: number; start: string } | null;
  payoutConfirmed: boolean; payoutPaid: boolean; closed: boolean
}

export function initialState(): State {
  return {
    version: 1, name: '山田 はる', theme: 'system', pins: [], clock: null,
    works: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18].map((day, i) => ({
      id: `work-${day}`, day: `${MONTH}-${String(day).padStart(2, '0')}`, site: SITES[i % 3]!,
      start: '08:00', end: i % 4 === 0 ? '18:00' : '17:00', minutes: i % 4 === 0 ? 540 : 480,
    })),
    expenses: [
      { id: 'expense-1', day: `${MONTH}-18`, vendor: 'まちの建材店', category: '材料費', amount: 12800, confirmed: false },
      { id: 'expense-2', day: `${MONTH}-16`, vendor: '桜町パーキング', category: '交通費', amount: 1600, confirmed: true },
      { id: 'expense-3', day: `${MONTH}-14`, vendor: 'ひなた工具店', category: '消耗品費', amount: 3480, confirmed: true },
    ],
    invoices: [
      { id: 'invoice-1', client: '木と庭工務店', site: '桜町の家', amount: 330000, issued: false, paid: false, due: '2026-10-31' },
      { id: 'invoice-2', client: '合同会社ひなた', site: 'ひなた商店', amount: 220000, issued: true, paid: false, due: '2026-10-31' },
      { id: 'invoice-3', client: '川辺デザイン室', site: '川辺のアトリエ', amount: 165000, issued: true, paid: true, due: '2026-10-31' },
    ],
    payoutConfirmed: false, payoutPaid: false, closed: false,
  }
}

const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 200
const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(v)
const amount = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0 && Number(v) <= 100_000_000
const day = (v: unknown): v is string => typeof v === 'string' && /^2026-(09|10)-\d{2}$/.test(v)
const time = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
const list = (v: unknown, check: (row: Record<string, unknown>) => boolean): boolean => Array.isArray(v) && v.length <= 200 && v.every(row => record(row) && check(row))

export function parseState(raw: string | null): State {
  try {
    const s: unknown = JSON.parse(raw ?? '')
    if (!record(s) || s.version !== 1 || !text(s.name) || !['system', 'light', 'dark'].includes(String(s.theme))
      || !Array.isArray(s.pins) || !s.pins.every(p => ['kintai', 'keihi', 'seikyu', 'shiharai', 'shime', 'uriage'].includes(p))
      || !['payoutConfirmed', 'payoutPaid', 'closed'].every(k => typeof s[k] === 'boolean')
      || !(s.clock === null || record(s.clock) && text(s.clock.site) && Number.isFinite(s.clock.at) && time(s.clock.start))
      || !list(s.works, r => identifier(r.id) && day(r.day) && text(r.site) && time(r.start) && time(r.end) && amount(r.minutes))
      || !list(s.expenses, r => identifier(r.id) && day(r.day) && text(r.vendor) && text(r.category) && amount(r.amount) && typeof r.confirmed === 'boolean' && (r.photo === undefined || typeof r.photo === 'string' && r.photo.length < 500_000 && /^data:image\/(jpeg|png|webp);base64,/.test(r.photo)))
      || !list(s.invoices, r => identifier(r.id) && text(r.client) && text(r.site) && amount(r.amount) && typeof r.issued === 'boolean' && typeof r.paid === 'boolean' && day(r.due))) return initialState()
    return s as State
  } catch { return initialState() }
}

export function totals(s: State) {
  const days = new Set(s.works.map(w => w.day)).size
  const overtime = s.works.reduce((sum, w) => sum + Math.max(0, w.minutes - 480), 0)
  const pay = days * 18000 + Math.round(overtime * 2500 / 60)
  const expenses = s.expenses.filter(e => e.confirmed).reduce((sum, e) => sum + e.amount, 0)
  const revenue = s.invoices.filter(i => i.issued).reduce((sum, i) => sum + i.amount, 0)
  const received = s.invoices.filter(i => i.issued && i.paid).reduce((sum, i) => sum + i.amount, 0)
  return { days, overtime, pay, expenses, revenue, received, profit: revenue - pay - expenses }
}

export function blockers(s: State) {
  return [
    ...(s.clock ? ['勤務中の記録があります'] : []),
    ...(s.expenses.some(e => !e.confirmed) ? ['未確認の経費があります'] : []),
    ...(!s.payoutConfirmed ? ['支払明細が未確定です'] : []),
    ...(s.invoices.some(i => !i.issued) ? ['下書きの請求書があります'] : []),
  ]
}

export const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`
export const escape = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
export const duration = (n: number) => `${Math.floor(n / 60)}時間${n % 60 ? `${n % 60}分` : ''}`
