import { blockers, duration, escape as e, MONTH, SITES, TODAY, totals, yen, type State, type Invoice } from './state'
import { adjacentMonth, monthLink, monthName } from './month'

export const bots = [
  { id: 'kintai', name: 'きんたい', color: 'k-kin' },
  { id: 'keihi', name: 'けいひ', color: 'k-kei' },
  { id: 'seikyu', name: 'せいきゅう', color: 'k-sei' },
  { id: 'shiharai', name: 'しはらい', color: 'k-shi' },
  { id: 'shime', name: 'しめ', color: 'k-sim' },
  { id: 'uriage', name: 'うりあげ', color: 'k-uri' },
] as const
export const searchIcon = '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'
const cameraIcon = '<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5A1.5 1.5 0 014.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0121 8.5V18a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18z"/><circle cx="12" cy="13" r="3.3"/></svg>'
const camera = () => `<button class="round-button" data-action="photo" aria-label="レシートを追加する">${cameraIcon}</button>`
const demo = '<a class="demo-badge" href="#/app" aria-label="デモについて">DEMO</a>'
const day = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`
const msg = (text: string, lead = false) => `<div class="msg${lead ? ' lead' : ''}">${text}</div>`
const row = (left: string, right: string, sub = '') => `<div class="it"><div class="r"><span>${e(left)}</span><b class="n">${e(right)}</b></div>${sub ? `<div class="sub">${e(sub)}</div>` : ''}</div>`
const chips = (items: [string, string][]) => `<div class="chips">${items.map(([label, href]) => `<a class="chip" href="#${href}">${e(label)}</a>`).join('')}</div>`
const button = (label: string, action: string, extra = '') => `<button class="solid main-action" data-action="${action}" ${extra}>${label}</button>`
const field = (label: string, input: string) => `<label class="fld"><span>${label}</span>${input}</label>`
const dateField = () => field('日付', `<input name="day" type="date" value="${TODAY}" min="2026-09-01" max="2026-09-30" required>`)
const siteField = () => field('現場', `<select name="site">${SITES.map(site => `<option>${site}</option>`).join('')}</select>`)
const moneyField = (value: number) => field('金額（円）', `<input name="amount" type="number" min="1" max="100000000" step="1" value="${value}" required inputmode="numeric">`)
const menuLink = (label: string, href: string) => `<a class="sheet-action" href="#${href}"><span>${label}</span></a>`

function summary(s: State, id: string, ym: string) {
  if (ym !== MONTH) {
    const name = `${Number(ym.slice(5))}月`
    return id === 'kintai' ? `${name}の勤務記録はありません`
      : id === 'keihi' ? `${name}の経費はありません`
      : id === 'shiharai' ? `${name}の支払明細は未確定です`
      : id === 'seikyu' ? `${name}の請求書はありません`
      : id === 'shime' ? `${name}はまだ締められていません`
      : 'まだ締めた月がありません'
  }
  const t = totals(s)
  switch (id) {
    case 'kintai': return s.clock ? `${e(s.clock.site)}で勤務中です` : `${t.days}日ぶんの勤務を記録しました`;
    case 'keihi': { const n = s.expenses.filter(x => !x.confirmed).length; return n ? `確認待ちの経費が <b>${n}件</b> あります` : '経費の確認が終わりました' }
    case 'seikyu': { const n = s.invoices.filter(x => !x.issued).length; return n ? `請求書の下書きが <b>${n}件</b> あります` : `${s.invoices.length}件の請求書を発行しました` }
    case 'shiharai': return s.payoutPaid ? '振込済みにしました' : s.payoutConfirmed ? `支払明細 ${yen(t.pay)} を確定しました` : `今月の支払は ${yen(t.pay)} です`;
    case 'shime': return s.closed ? '9月の締めが終わりました' : blockers(s).length ? '今月を締める前に確認があります' : '今月を締められます';
    default: return `今月の売上は ${yen(t.revenue)} です`;
  }
}

export function botList(s: State, current: string, sidebar = false, ym = MONTH) {
  return `<nav class="list${sidebar ? '' : ' home-bots'}" aria-label="bot一覧">${[...bots].sort((a, b) => Number(s.pins.includes(b.id)) - Number(s.pins.includes(a.id))).map(b => `<a class="row" href="${monthLink(`/${b.id}`, ym)}" data-bot="${b.id}" data-pinned="${s.pins.includes(b.id)}" ${current === b.id ? 'aria-current="page"' : ''}><i class="blob ${b.color}" aria-hidden="true"></i><div class="body"><div class="top"><span class="name">${b.name}</span><span class="when">${Number(ym.slice(5))}月</span></div><div class="said">${summary(s, b.id, ym)}</div></div></a>`).join('')}</nav>`
}

export function sidebar(s: State, current: string, ym = MONTH) {
  const inBot = bots.some(bot => bot.id === current)
  return `<aside class="desktop-sidebar" aria-label="ナビゲーション"><div class="desktop-sidebar-top"><header><a class="demo-brand${inBot ? ' sidebar-period' : ''}" href="${monthLink('/', ym)}">${inBot ? `<span class="month">${monthName(ym)}</span>` : '出面帳'} <span class="demo-brand-label">demo</span></a><a class="search-link round-button" href="${monthLink('/search', ym)}" aria-label="記録を探す">${searchIcon}</a><button class="round-button sidebar-photo" data-action="photo" aria-label="レシートを追加する">${cameraIcon}</button></header></div>${botList(s, current, true, ym)}<div class="desktop-sidebar-bottom"><p class="demo-caption">架空の9月を、ひととおり。<br>操作はこのブラウザの中だけ。</p><a class="account-link round-button" href="${monthLink('/app', ym)}"><span class="face">${e(s.name.slice(0, 1))}</span><span class="desktop-label">${e(s.name)}</span></a></div></aside>`
}

export function header(s: State, route: string, title: string, ym = MONTH) {
  const bot = bots.find(b => b.id === route.split('/')[1])
  if (route === '/') return `<header><a class="account-link round-button" href="${monthLink('/app', ym)}" aria-label="アプリ設定を開く"><span class="face">${e(s.name.slice(0, 1))}</span></a><h1>出面帳</h1>${demo}<a class="round-button search-link" href="${monthLink('/search', ym)}" aria-label="記録を探す">${searchIcon}</a>${camera()}</header>`
  return `<header class="bot-header"><a class="back" href="${monthLink(route.split('/').length > 2 ? '/' + route.split('/')[1] : '/', ym)}" aria-label="戻る">←</a>${bot ? `<i class="blob ${bot.color}" aria-hidden="true"></i>` : ''}<h1 tabindex="-1">${e(title)}</h1>${demo}${camera()}</header>`
}

function monthPeriod(ym: string) {
  const previous = adjacentMonth(ym, -1), next = adjacentMonth(ym, 1)
  return `<div class="home-period"><div class="month-nav">${previous < '0001-01' ? '<span class="month-step" aria-hidden="true"></span>' : `<a class="month-step" href="${monthLink('/', previous)}" aria-label="前の月">‹</a>`}<span class="month">${monthName(ym)}</span>${next > MONTH ? '<span class="month-step" aria-hidden="true"></span>' : `<a class="month-step" href="${monthLink('/', next)}" aria-label="次の月">›</a>`}</div>${ym === MONTH ? '<span class="home-day">22日 火曜日</span>' : ''}</div>`
}

function home(s: State, ym: string) {
  if (ym !== MONTH) return `<div class="now home-past">${monthPeriod(ym)}<div class="mid"><div>打刻は今月に戻ってからできます</div><a class="ghost" href="#/">今月に戻る</a></div></div>${botList(s, '', false, ym)}<p class="home-demo-note">サンプルの記録は2026年9月にあります。</p>`
  const t = totals(s), todayWork = s.works.filter(w => w.day === TODAY).at(-1)
  const front = s.clock
    ? `<div class="where"><i class="live"></i><span>${e(s.clock.site)} · 勤務中</span></div><div class="mid"><div class="fig"><small>経過 </small><span data-elapsed>0:00</span></div>${button('退勤', 'clock-out')}</div><div class="since">${s.clock.start}に出勤</div>`
    : todayWork
      ? `<div class="where">9月22日の勤務は記録済みです</div><div class="mid"><div class="fig"><small>実働 </small>${Math.floor(todayWork.minutes / 60)}<small>時間</small>${todayWork.minutes % 60 ? `${todayWork.minutes % 60}<small>分</small>` : ''}</div><a class="ghost" href="#/kintai">勤務を確認</a></div><div class="since">${todayWork.start}–${todayWork.end}　${e(todayWork.site)}</div>`
      : `<div class="mid"><form data-form="clock-in" class="home-clock-form"><span class="site-box"><select class="site" name="site" aria-label="出勤する現場">${SITES.map(n => `<option>${n}</option>`).join('')}</select><svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></span><button class="solid" ${s.closed ? 'disabled' : ''}>出勤</button></form></div>${s.closed ? '<div class="since">この月は締め済みです</div>' : ''}`
  const mark = ['g2', 'g3', 'g1', 'g2', 'g2', '', '', 'g2', 'g2', 'g3', 'g2', 'g1', 'g2', ''].map(c => `<i class="${c}"></i>`).join('')
  return `<section class="home-clock" aria-label="打刻"><div class="flip" tabindex="-1" data-flip-ready><div class="flip-inner"><div class="flip-face"><button class="flip-mark" data-flip aria-label="今月のつみあげを見る" aria-expanded="false" aria-controls="home-card-back"><span class="mark-kusa" aria-hidden="true">${mark}</span></button><div class="now">${monthPeriod(ym)}${front}</div></div><div class="flip-face ura" id="home-card-back" role="button" tabindex="-1" aria-label="打刻に戻る" aria-describedby="home-card-summary" hidden inert aria-hidden="true"><span class="visually-hidden" id="home-card-summary">${yen(t.pay)} · ${t.days}日ぶん</span><div class="now"><div class="stack-summary">${monthPeriod(ym)}<div class="stack-value"><div class="mid"><div class="fig"><span class="count-size" aria-hidden="true">${yen(t.pay)}</span><span data-yen="${t.pay}">${yen(t.pay)}</span></div></div></div></div><div class="cal" aria-hidden="true">${['月', '火', '水', '木', '金', '土', '日'].map(n => `<span class="cal-head">${n}</span>`).join('')}<i class="blank"></i>${Array.from({ length: 30 }, (_, i) => { const w = s.works.find(w => Number(w.day.slice(8)) === i + 1); return `<i class="${w && i < 22 ? w.minutes > 480 ? 'g3' : 'g2' : 'unworked'}${i === 21 ? ' today' : ''}" style="--w:${Math.floor((i + 1) / 7)}"></i>` }).join('')}</div></div></div></div></div></section>${botList(s, '')}<p class="home-demo-note">サンプルの9月22日を体験できます。<br>入力した内容は、このブラウザだけに保存されます。</p>`
}

function attendance(s: State) {
  const t = totals(s)
  return `<div class="talk"><div class="day">2026年9月</div>${msg(`${e(s.name)}さん、今月は <b>${t.days}日</b> 現場に出ています。`, true)}${s.clock ? msg(`${e(s.clock.site)}で勤務中です。${chips([['打刻に戻る', '/']])}`) : ''}${msg(`実働は ${duration(s.works.reduce((n, w) => n + w.minutes, 0))}。<br>うち残業は ${duration(t.overtime)} です。`)}<div class="card record-list">${[...s.works].reverse().map(w => `<div class="it">${row(`${day(w.day)} · ${w.site}`, duration(w.minutes), `${w.start}–${w.end}　休憩60分`)}</div>`).join('')}</div>${msg('記録を追加すると、ホームのつみあげにも反映されます。')}</div>`
}

function expenses(s: State) {
  const pending = s.expenses.filter(x => !x.confirmed).length
  return `<div class="talk"><div class="day">2026年9月</div>${msg(pending ? `確認待ちの経費が <b>${pending}件</b> あります。<br>金額と内容を確認しましょう。` : '経費の確認が終わりました。', true)}${s.expenses.length ? [...s.expenses].reverse().map(x => `<a class="record-link" href="#/keihi/${x.id}"><span class="record-icon">${x.confirmed ? '✓' : '・'}</span><span><strong>${e(x.vendor)}</strong><small>${day(x.day)} · ${e(x.category)} · ${x.confirmed ? '確定済み' : '確認待ち'}</small></span><b>${yen(x.amount)}</b><span aria-hidden="true">›</span></a>`).join('') : '<p class="empty">まだ経費がありません。</p>'}${msg(`確認済みの経費は ${yen(totals(s).expenses)} です。`)}</div>`
}

function expenseDetail(s: State, id: string) {
  const x = s.expenses.find(x => x.id === id)
  if (!x) return notFound()
  return `<div class="talk"><div class="day">${day(x.day)}</div>${msg(x.confirmed ? 'この経費は確定済みです。' : '内容を確認して、経費を確定してください。', true)}${x.photo ? `<img class="shot" src="${e(x.photo)}" alt="このブラウザで追加した領収書">` : `<div class="sample-receipt"><span>SAMPLE RECEIPT</span><h2>${e(x.vendor)}</h2><p>2026年${day(x.day)}</p><hr><p>${e(x.category)}</p><strong>合計 ${yen(x.amount)}</strong><small>これはデモ用の架空の領収書です</small></div>`}<div class="card">${row('支払先', x.vendor)}${row('分類', x.category)}${row('金額', yen(x.amount))}</div>${x.confirmed ? chips([['経費の一覧へ', '/keihi']]) : `<div class="chips"><button class="chip" data-action="confirm-expense" data-id="${e(x.id)}">この内容で確定する</button></div>`}</div>`
}

function invoices(s: State) {
  return `<div class="talk"><div class="day">2026年9月</div>${msg('今月の仕事を、請求書に。', true)}${s.invoices.map(i => `<a class="record-link" href="#/seikyu/${i.id}"><i class="blob k-sei" aria-hidden="true"></i><span><strong>${e(i.client)}</strong><small>${e(i.site)} · ${!i.issued ? '下書き' : i.paid ? '入金済み' : '入金待ち'}</small></span><b>${yen(i.amount)}</b><span aria-hidden="true">›</span></a>`).join('')}${msg('下書きの内容を確認して、発行できます。<br>デモの帳票はそのままプレビューできます。')}</div>`
}

export function invoicePaper(i: Invoice, name: string) {
  const subtotal = Math.round(i.amount / 1.1)
  return `<article class="invoice-paper"><div class="paper-top"><h2>請求書</h2><span>DEMO / SAMPLE</span></div><p class="paper-client">${e(i.client)} 御中</p><p>${e(i.site)}の工事につき、下記のとおりご請求申し上げます。</p><div class="paper-total"><span>ご請求金額</span><strong>${yen(i.amount)}</strong><small>税込</small></div><dl><div><dt>請求日</dt><dd>2026年9月30日</dd></div><div><dt>お支払期限</dt><dd>${e(i.due)}</dd></div></dl><table><thead><tr><th>内容</th><th>金額</th></tr></thead><tbody><tr><td>${e(i.site)} 工事一式</td><td>${yen(subtotal)}</td></tr><tr><td>消費税（10%）</td><td>${yen(i.amount - subtotal)}</td></tr></tbody></table><div class="paper-issuer"><b>山の手ワークス（サンプル）</b><br>担当 ${e(name)}<br>サンプル銀行 本店　普通 0000000</div><p class="paper-note">架空のデータによるデモ帳票です。実際の請求には使用できません。</p></article>`
}

function invoiceDetail(s: State, id: string) {
  const i = s.invoices.find(i => i.id === id)
  if (!i) return notFound()
  return `<div class="talk">${msg(!i.issued ? '請求書の下書きです。内容を確認してください。' : i.paid ? '入金済みの請求書です。' : '請求書を発行しました。入金待ちです。', true)}${invoicePaper(i, s.name)}<div class="chips">${!i.issued ? `<button class="chip" data-action="issue-invoice" data-id="${i.id}">この内容で発行する</button>` : `<button class="chip" data-action="pay-invoice" data-id="${i.id}">${i.paid ? '未入金に戻す' : '入金済みにする'}</button>`}<button class="chip" data-action="print">印刷・PDF</button></div></div>`
}

function payments(s: State) {
  const t = totals(s)
  return `<div class="talk"><div class="day">2026年9月</div>${msg(s.payoutPaid ? '振込済みにしました。今月もおつかれさまでした。' : s.payoutConfirmed ? '支払明細を確定しました。' : '勤務記録から、今月の支払をまとめました。', true)}<div class="doc payment-doc"><div class="t">${e(s.name)}さんの支払明細</div><div class="r"><span>日当 ¥18,000 × ${t.days}日</span><b>${yen(t.days * 18000)}</b></div><div class="r"><span>残業 ${duration(t.overtime)}</span><b>${yen(Math.round(t.overtime * 2500 / 60))}</b></div><div class="r sum"><span>支払合計</span><b>${yen(t.pay)}</b></div></div>${chips([['勤務の内訳を見る', '/kintai']])}${msg(s.payoutConfirmed ? '確定を取り消すと、勤務の追加や打刻を再開できます。' : '内容に間違いがなければ、明細を確定してください。')}${s.payoutConfirmed ? `<div class="chips"><button class="chip" data-action="undo-payout" ${s.closed ? 'disabled' : ''}>確定を取り消す</button></div>` : ''}</div>`
}

function closing(s: State) {
  const t = totals(s), pending = blockers(s)
  return `<div class="talk"><div class="day">2026年9月</div>${msg(s.closed ? '9月を締めました。<br>今月もおつかれさまでした。' : pending.length ? '今月を締める前に、残っていることを確認しましょう。' : '確認がそろいました。9月を締められます。', true)}${!s.closed && pending.length ? `<div class="card">${pending.map(p => row(p, '未完了')).join('')}</div>${chips([['勤務を見る', '/kintai'], ['経費を確認', '/keihi'], ['支払を確定', '/shiharai'], ['請求書を発行', '/seikyu']])}` : ''}<div class="card">${row('売上', yen(t.revenue))}${row('人件費', yen(t.pay))}${row('経費', yen(t.expenses))}${row('粗利', yen(t.profit))}</div>${msg(s.closed ? '修正したい場合は、締めを取り消せます。' : '締めると、この月の勤務・経費・請求内容を固定します。')}</div>`
}

function sales(s: State) {
  const t = totals(s), max = Math.max(1, ...s.invoices.map(i => i.amount))
  return `<div class="talk"><div class="day">2026年9月</div>${msg(`今月の売上は <b>${yen(t.revenue)}</b> です。`, true)}<div class="card">${row('入金済み', yen(t.received))}${row('入金待ち', yen(t.revenue - t.received))}</div><div class="sales-chart" aria-label="取引先ごとの売上">${s.invoices.filter(i => i.issued).map(i => `<div><span>${e(i.client)}</span><b>${yen(i.amount)}</b><i style="--width:${i.amount / max * 100}%"></i></div>`).join('')}</div>${msg('発行した請求書を、売上として集計しています。')}${chips([['請求書を見る', '/seikyu'], ['今月を締める', '/shime']])}</div>`
}

function settings(s: State) {
  return `<div class="settings-view"><h2>このデモについて</h2><p class="lede">現場仕事の、時間とお金の帳面。<br>6つのbotと、架空の9月を体験できます。</p><p class="small-note">登場する人・会社・金額はすべてサンプルです。入力や写真は外部へ送信せず、このブラウザにだけ保存します。</p><h2>名前</h2><form data-form="profile">${field('表示名', `<input name="name" value="${e(s.name)}" maxlength="40" required autocomplete="off">`)}<button class="ghost">名前を保存</button></form><h2>外観</h2><fieldset class="theme-options"><legend class="visually-hidden">外観を選ぶ</legend>${[['system', '端末に合わせる'], ['light', '明るい'], ['dark', '暗い']].map(([v, label]) => `<label><input type="radio" name="theme" value="${v}" ${s.theme === v ? 'checked' : ''}>${label}</label>`).join('')}</fieldset><h2>よく使うbot</h2><div class="pin-options">${bots.map(b => `<label><input type="checkbox" name="pin" value="${b.id}" ${s.pins.includes(b.id) ? 'checked' : ''}><i class="blob ${b.color}" aria-hidden="true"></i>${b.name}</label>`).join('')}</div><h2>はじめから</h2><p class="small-note">このデモに追加した記録・写真・設定を消し、最初のサンプルに戻します。</p><button class="ghost" data-action="reset">デモをリセット</button></div>`
}

export function searchResults(s: State, query: string, ym = MONTH) {
  if (ym !== MONTH) return '<p class="small-note" role="status">0件の記録</p><p class="empty">この月のサンプル記録はありません。</p>'
  const rows = [
    ...s.works.map(w => ({ title: `${day(w.day)} ${w.site}`, sub: `勤務 · ${duration(w.minutes)}`, href: '/kintai' })),
    ...s.expenses.map(x => ({ title: x.vendor, sub: `経費 · ${x.category} · ${yen(x.amount)}`, href: `/keihi/${x.id}` })),
    ...s.invoices.map(i => ({ title: i.client, sub: `請求 · ${i.site} · ${yen(i.amount)}`, href: `/seikyu/${i.id}` })),
  ].filter(r => `${r.title} ${r.sub}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return `<p class="small-note" role="status">${rows.length}件の記録</p>${rows.map(r => `<a class="record-link search-result" href="#${r.href}"><span><strong>${e(r.title)}</strong><small>${e(r.sub)}</small></span><span aria-hidden="true">›</span></a>`).join('') || '<p class="empty">一致する記録がありません。</p>'}`
}

const notFound = () => `<div class="talk">${msg('このデモには見つからない記録です。')}${chips([['ホームに戻る', '/']])}</div>`

export function page(s: State, route: string, ym = MONTH) {
  const [section, id] = route.slice(1).split('/')
  let title = bots.find(b => b.id === section)?.name ?? '出面帳'
  let body = '', action = '', menu = ''
  if (ym !== MONTH && bots.some(bot => bot.id === section)) return {
    title,
    body: `<div class="talk"><div class="day">対象月：${ym}</div>${msg(`${Number(ym.slice(5))}月のサンプル記録はありません。`, true)}${chips([['今月に戻る', '/']])}</div>`,
    action, menu,
  }
  switch (section) {
    case '': body = home(s, ym); break
    case 'kintai': body = attendance(s); action = button('勤務を追加', 'add-work', s.closed ? 'disabled' : ''); menu = menuLink('打刻に戻る', '/') + menuLink('支払明細', '/shiharai'); break
    case 'keihi': body = id ? expenseDetail(s, id) : expenses(s); action = button('経費を追加', 'add-expense', s.closed ? 'disabled' : ''); menu = `<button class="sheet-action" data-action="photo">領収書の写真から</button>` + menuLink('経費一覧', '/keihi'); break
    case 'seikyu': body = id ? invoiceDetail(s, id) : invoices(s); action = button('請求書を作成', 'add-invoice', s.closed ? 'disabled' : ''); menu = menuLink('請求書の一覧', '/seikyu') + menuLink('売上を見る', '/uriage'); break
    case 'shiharai': body = payments(s); action = button(s.payoutConfirmed ? s.payoutPaid ? '振込前に戻す' : '振込済みにする' : '支払明細を確定', s.payoutConfirmed ? 'pay-payout' : 'confirm-payout'); menu = menuLink('勤務の内訳', '/kintai') + menuLink('今月を締める', '/shime'); break
    case 'shime': body = closing(s); action = button(s.closed ? '締めを取り消す' : '9月を締める', s.closed ? 'undo-close' : 'close-month', !s.closed && blockers(s).length ? 'disabled' : ''); menu = menuLink('売上を見る', '/uriage') + menuLink('経費を見る', '/keihi'); break
    case 'uriage': body = sales(s); action = button('サンプルCSV', 'csv'); menu = menuLink('請求書を見る', '/seikyu') + menuLink('今月を締める', '/shime'); break
    case 'app': title = 'アプリ設定'; body = settings(s); break
    case 'search': title = '記録を探す'; body = `<div class="search-view"><label class="fld"><span>現場・取引先・支払先など</span><input id="search-input" type="search" placeholder="例：桜町" autocomplete="off"></label><div id="search-results">${searchResults(s, '', ym)}</div></div>`; break
    default: body = notFound()
  }
  return { title, body, action, menu }
}

export function dialogs() {
  return '<dialog class="bottom-sheet" id="edit-dialog" aria-labelledby="edit-title"></dialog><dialog class="bottom-sheet" id="bot-actions" aria-labelledby="bot-actions-title"></dialog>'
}

export function dialogContent(title: string, body: string) {
  return `<div class="sheet-grip" aria-hidden="true"></div><div class="sheet-heading"><h2 id="edit-title" tabindex="-1">${title}</h2><button class="round-button" data-action="dismiss" aria-label="閉じる">×</button></div>${body}`
}

export function workForm() {
  return `<form data-form="add-work">${dateField()}${siteField()}<div class="pair">${field('出勤', '<input type="time" name="start" value="08:00" required>')}${field('退勤', '<input type="time" name="end" value="17:00" required>')}</div><p class="small-note">休憩60分を差し引いて記録します。</p><button class="solid">勤務を記録</button></form>`
}

export function expenseForm(photo = '') {
  return `<form data-form="add-expense">${photo ? `<img class="upload-preview" src="${e(photo)}" alt="選んだ領収書">` : ''}${dateField()}${field('支払先', '<input name="vendor" value="まちの建材店" maxlength="60" required>')}${moneyField(2400)}${field('分類', '<select name="category"><option>材料費</option><option>交通費</option><option>消耗品費</option><option>その他</option></select>')}<p class="small-note">内容は手入力です。写真を含め、外部へは送信しません。</p><button class="solid">経費に追加</button></form>`
}

export function invoiceForm() {
  return `<form data-form="add-invoice">${field('取引先', '<input name="client" value="木と庭工務店" maxlength="60" required>')}${siteField()}${moneyField(110000)}${field('支払期限', '<input type="date" name="due" value="2026-10-31" min="2026-09-01" max="2026-10-31" required>')}<p class="small-note">金額は税込です。まず下書きとして保存します。</p><button class="solid">下書きを作成</button></form>`
}
