import './style.css'
import { initCard } from './card'
import { selectedMonth } from './month'
import { blockers, escape as e, initialState, KEY, MONTH, parseState, SITES, TODAY, type State } from './state'
import { bots, dialogContent, dialogs, expenseForm, header, invoiceForm, page, searchResults, sidebar, timeFigure, workForm } from './views'

const app = document.querySelector<HTMLDivElement>('#app')!
let state: State
let storageAvailable = true
try { state = parseState(localStorage.getItem(KEY)) } catch { state = initialState(); storageAvailable = false }
let cleanupCard = () => {}, timer: ReturnType<typeof setTimeout> | undefined
let photo = '', generation = 0, lastRoute = ''
let opener: HTMLElement | null = null
const route = () => {
  const value = location.hash.slice(1).split('?')[0] || '/'
  return value.startsWith('/') ? value : '/'
}

function toast(message: string) {
  const el = document.querySelector<HTMLElement>('#toast')!
  el.textContent = message; el.hidden = false
  clearTimeout(timer); timer = setTimeout(() => { el.hidden = true }, 6000)
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true }
  catch { storageAvailable = false }
}

function update(change: () => void, message: string, to?: string) {
  change(); save()
  if (to && route() !== to) location.hash = to
  else render()
  toast(storageAvailable ? message : 'このタブには反映しましたが、ブラウザに保存できません。保存容量・設定をご確認ください。')
}

function applyTheme() {
  if (state.theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = state.theme
  const dark = state.theme === 'dark' || state.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1a1513' : '#fffcf0')
}

function render() {
  const path = route(), current = path.split('/')[1] || '', ym = selectedMonth(location.hash)
  const navigated = location.hash !== lastRoute
  const scroll = document.querySelector('.desktop-content')?.scrollTop ?? 0
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const focusAction = focused?.dataset.action, focusId = focused?.dataset.id
  cleanupCard(); generation++; photo = ''; lastRoute = location.hash
  const view = page(state, path, ym)
  document.title = `${view.title} — 出面帳デモ`
  document.body.classList.toggle('desktop-home', path === '/')
  applyTheme()
  app.innerHTML = `<a class="skip-link" href="#main-content">本文へ</a>${sidebar(state, current, ym)}<main class="page">${header(state, path, view.title, ym)}<div class="desktop-content" id="main-content" tabindex="-1"><div class="desktop-body">${view.body}</div></div>${view.action ? `<div class="bar bot-bar">${view.action}<button class="ghost ask-trigger" data-action="menu" aria-label="${e(view.title)}のメニュー">メニュー</button></div>` : ''}</main>${dialogs()}`
  const menu = document.querySelector<HTMLDialogElement>('#bot-actions')!
  menu.innerHTML = `<div class="sheet-grip" aria-hidden="true"></div><div class="sheet-heading"><h2 id="bot-actions-title" tabindex="-1">${e(view.title)}のメニュー</h2><button class="round-button" data-action="dismiss" aria-label="閉じる">×</button></div>${view.menu}`
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus({ preventScroll: true }) })
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return
      const r = dialog.getBoundingClientRect()
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close()
    })
  }
  cleanupCard = initCard(); elapsed()
  if (navigated) {
    window.scrollTo(0, 0)
    const heading = path === '/' && matchMedia('(min-width: 900px)').matches
      ? app.querySelector<HTMLElement>('.home-clock, .home-past')
      : app.querySelector<HTMLElement>('main h1')
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }) }
  } else {
    document.querySelector('.desktop-content')!.scrollTop = scroll
    const target = focusAction ? app.querySelector<HTMLElement>(`[data-action="${CSS.escape(focusAction)}"]${focusId ? `[data-id="${CSS.escape(focusId)}"]` : ''}`) : null
    if (target && !target.hasAttribute('disabled')) target.focus({ preventScroll: true })
    else if (focused?.closest('dialog')) app.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
  }
}

function elapsed() {
  const target = document.querySelector('[data-elapsed]')
  if (!target || !state.clock) return
  const minutes = Math.max(0, Math.floor((Date.now() - state.clock.at) / 60000))
  target.innerHTML = timeFigure(minutes)
}
setInterval(elapsed, 1000)

function show(title: string, content: string) {
  for (const dialog of document.querySelectorAll('dialog[open]')) (dialog as HTMLDialogElement).close()
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const dialog = document.querySelector<HTMLDialogElement>('#edit-dialog')!
  dialog.innerHTML = dialogContent(title, content); dialog.showModal()
  dialog.querySelector<HTMLElement>('input:not([type=file]), select, h2')?.focus({ preventScroll: true })
}

function mutable(work = false) {
  if (state.closed) { toast('この月は締め済みです。「しめ」で締めを取り消してください。'); return false }
  if (work && state.payoutConfirmed) { toast('支払明細が確定済みです。「しはらい」で確定を取り消してください。'); return false }
  return true
}

const minutes = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3))

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return
  const skip = event.target.closest('.skip-link')
  if (skip) { event.preventDefault(); document.querySelector<HTMLElement>('#main-content')?.focus(); return }
  const target = event.target.closest<HTMLButtonElement>('[data-action]')
  if (!target || target.disabled) return
  const action = target.dataset.action, id = target.dataset.id
  if (action === 'photo' && selectedMonth(location.hash) !== MONTH) {
    toast('今月に戻ってからレシートを追加できます。'); return
  }
  switch (action) {
    case 'dismiss': target.closest('dialog')?.close(); break
    case 'menu': opener = target; document.querySelector<HTMLDialogElement>('#bot-actions')!.showModal(); break
    case 'clock-out':
      if (!mutable(true) || !state.clock) return
      show('退勤を記録', `<form data-form="clock-out"><p class="small-note">9月22日 ${state.clock.start}に出勤した勤務です。</p><label class="fld"><span>退勤時刻</span><input name="end" type="time" value="17:00" required></label><p class="small-note">サンプルの退勤時刻で、1日を体験できます。</p><button class="solid">退勤を記録</button></form>`); break
    case 'add-work': if (mutable(true)) show('勤務を追加', workForm()); break
    case 'add-expense': if (mutable()) { photo = ''; show('経費を追加', expenseForm()) } break
    case 'add-invoice': if (mutable()) show('請求書を作成', invoiceForm()); break
    case 'photo':
      if (mutable()) show('領収書を追加', '<p class="small-note">写真はこのブラウザだけで扱います。選んだ後に金額と支払先を入力できます。</p><label class="solid photo-picker" for="photo-input">写真を選ぶ</label><input id="photo-input" type="file" accept="image/*" class="photo-input"><p id="photo-status" role="status"></p>'); break
    case 'confirm-expense': {
      const item = state.expenses.find(x => x.id === id)
      if (item && mutable()) update(() => { item.confirmed = true }, '経費を確定しました。'); break
    }
    case 'issue-invoice': {
      const item = state.invoices.find(x => x.id === id)
      if (item && mutable()) update(() => { item.issued = true }, 'デモの請求書を発行しました。'); break
    }
    case 'pay-invoice': {
      const item = state.invoices.find(x => x.id === id)
      if (item?.issued) update(() => { item.paid = !item.paid }, item.paid ? '未入金に戻しました。' : '入金済みにしました。'); break
    }
    case 'confirm-payout':
      if (state.clock) { toast('先に退勤を記録してください。'); return }
      if (mutable()) update(() => { state.payoutConfirmed = true }, '支払明細を確定しました。'); break
    case 'undo-payout': if (mutable()) update(() => { state.payoutConfirmed = false; state.payoutPaid = false }, '支払明細の確定を取り消しました。'); break
    case 'pay-payout': if (state.payoutConfirmed) update(() => { state.payoutPaid = !state.payoutPaid }, state.payoutPaid ? '振込前に戻しました。' : '振込済みにしました。'); break
    case 'close-month': if (!blockers(state).length) update(() => { state.closed = true }, '9月を締めました。'); break
    case 'undo-close': update(() => { state.closed = false }, '9月の締めを取り消しました。'); break
    case 'print': window.print(); break
    case 'csv': {
      const safe = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`
      const data = [['区分', '対象月', '取引先', '現場', '金額（税込）', '入金'], ...state.invoices.filter(i => i.issued).map(i => ['DEMO', '2026-09', i.client, i.site, i.amount, i.paid ? '入金済み' : '未入金'])].map(r => r.map(safe).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob(['\uFEFF' + data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a'); a.href = url; a.download = 'dedura-demo-sales-2026-09.csv'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000); toast('サンプルCSVをダウンロードしました。'); break
    }
    case 'reset': show('デモをリセット', '<p>追加した記録・写真・設定を消し、最初のサンプルに戻します。</p><div class="dialog-actions"><button class="ghost" data-action="dismiss">戻る</button><button class="danger" data-action="reset-confirm">リセットする</button></div>'); break
    case 'reset-confirm': update(() => { state = initialState() }, '最初のサンプルに戻しました。', '/'); break
  }
})

document.addEventListener('submit', event => {
  const form = event.target
  if (!(form instanceof HTMLFormElement)) return
  event.preventDefault()
  if (!form.reportValidity()) return
  const data = new FormData(form), value = (name: string) => String(data.get(name) ?? '').trim()
  const kind = form.dataset.form
  if (kind !== 'profile' && !mutable(kind === 'add-work' || kind === 'clock-in' || kind === 'clock-out')) return
  switch (kind) {
    case 'clock-in':
      if (state.clock || state.works.some(w => w.day === TODAY)) return
      if (!SITES.includes(value('site'))) return
      update(() => { state.clock = { at: Date.now(), site: value('site'), start: '08:00' } }, '9月22日 08:00の出勤を記録しました。'); break
    case 'clock-out': {
      const clock = state.clock
      if (!clock) return
      const end = value('end'), total = minutes(end) - minutes(clock.start) - 60
      if (total <= 0) { toast('出勤から休憩60分を含めて、退勤時刻を指定してください。'); return }
      update(() => { state.works.push({ id: crypto.randomUUID(), day: TODAY, site: clock.site, start: clock.start, end, minutes: total }); state.clock = null }, '退勤を記録しました。'); break
    }
    case 'add-work': {
      if (state.works.length >= 200) { toast('デモの記録上限です。設定からリセットできます。'); return }
      const total = minutes(value('end')) - minutes(value('start')) - 60
      if (total <= 0) { toast('休憩60分を含めて、出勤より後の退勤時刻を指定してください。'); return }
      if (state.works.some(w => w.day === value('day')) || state.clock && value('day') === TODAY) { toast('その日は記録済み、または勤務中です。別の日を選んでください。'); return }
      update(() => { state.works.push({ id: crypto.randomUUID(), day: value('day'), site: value('site'), start: value('start'), end: value('end'), minutes: total }); state.works.sort((a, b) => a.day.localeCompare(b.day)) }, '勤務を追加しました。'); break
    }
    case 'add-expense': {
      if (state.expenses.length >= 200) { toast('デモの記録上限です。設定からリセットできます。'); return }
      if (!value('vendor')) { toast('支払先を入力してください。'); return }
      const id = crypto.randomUUID(), image = photo
      update(() => { state.expenses.push({ id, day: value('day'), vendor: value('vendor'), category: value('category'), amount: Number(value('amount')), confirmed: false, ...(image ? { photo: image } : {}) }) }, 'このブラウザに経費を追加しました。', `/keihi/${id}`); break
    }
    case 'add-invoice': {
      if (state.invoices.length >= 200) { toast('デモの記録上限です。設定からリセットできます。'); return }
      if (!value('client')) { toast('取引先を入力してください。'); return }
      const id = crypto.randomUUID()
      update(() => { state.invoices.push({ id, client: value('client'), site: value('site'), amount: Number(value('amount')), issued: false, paid: false, due: value('due') }) }, '下書きを作成しました。', `/seikyu/${id}`); break
    }
    case 'profile':
      if (!value('name')) { toast('名前を入力してください。'); return }
      update(() => { state.name = value('name') }, '表示名を保存しました。'); break
  }
})

document.addEventListener('input', event => {
  if (event.target instanceof HTMLInputElement && event.target.id === 'search-input') document.querySelector('#search-results')!.innerHTML = searchResults(state, event.target.value, selectedMonth(location.hash))
})

document.addEventListener('change', async event => {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  if (input.name === 'theme' && ['system', 'light', 'dark'].includes(input.value)) {
    state.theme = input.value as State['theme']; save(); applyTheme()
    if (!storageAvailable) toast('外観を変更しましたが、ブラウザに保存できません。')
  }
  if (input.name === 'pin' && bots.some(b => b.id === input.value)) {
    const value = input.value
    update(() => { state.pins = input.checked ? [...new Set([...state.pins, value])] : state.pins.filter(p => p !== value) }, input.checked ? 'botを上に固定しました。' : '固定を解除しました。')
    document.querySelector<HTMLInputElement>(`[name="pin"][value="${value}"]`)?.focus({ preventScroll: true })
  }
  if (input.id !== 'photo-input' || !input.files?.[0]) return
  const file = input.files[0], version = generation
  const status = document.querySelector<HTMLElement>('#photo-status')!
  if (file.size > 15 * 1024 * 1024) { status.textContent = '15MB以下の画像を選んでください。'; return }
  status.textContent = '写真を準備しています。'; input.disabled = true
  try {
    const bitmap = await createImageBitmap(file), ratio = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) { bitmap.close(); throw new Error('canvas') }
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
    const result = canvas.toDataURL('image/jpeg', .65)
    if (result.length >= 500_000) throw new Error('size')
    if (version !== generation || !input.isConnected || !input.closest('dialog')?.open) return
    photo = result; show('写真から経費を追加', expenseForm(photo))
  } catch { if (input.isConnected) { input.disabled = false; status.textContent = '写真を開けませんでした。JPEG・PNGなど、別の画像を選んでください。' } }
})

window.addEventListener('hashchange', render)
window.addEventListener('storage', event => {
  if (event.key === KEY || event.key === null) {
    try { state = parseState(localStorage.getItem(KEY)) } catch { return }
    render(); toast('別のタブの変更を反映しました。')
  }
})
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme)
render()
if (!storageAvailable) toast('ブラウザの保存が使えないため、このタブ内で体験できます。')
