import { expect, test } from 'bun:test'
import { blockers, escape, initialState, parseState, totals } from './state'

test('サンプルの金額と締めの未完了項目が整合する', () => {
  const state = initialState()
  expect(totals(state)).toEqual({ days: 14, overtime: 240, pay: 262000, expenses: 5080, revenue: 385000, received: 165000, profit: 117920 })
  expect(blockers(state)).toHaveLength(3)
  state.expenses.forEach(x => { x.confirmed = true }); state.invoices.forEach(x => { x.issued = true }); state.payoutConfirmed = true
  expect(blockers(state)).toEqual([])
  expect(totals(state).profit).toBe(435120)
})

test('保存値を復元し、壊れた・旧形式・危険な画像の値は初期状態に戻す', () => {
  const state = initialState(); state.name = 'デモの名前'; state.theme = 'dark'
  expect(parseState(JSON.stringify(state))).toEqual(state)
  for (const raw of [null, '{broken', '{"version":0}', JSON.stringify({ ...state, works: [null] }), JSON.stringify({ ...state, clock: { at: 'bad' } }), JSON.stringify({ ...state, invoices: [{ ...state.invoices[0], id: '\" onclick=alert(1)' }] })]) expect(parseState(raw)).toEqual(initialState())
  state.expenses[0]!.photo = 'https://example.test/tracker'
  expect(parseState(JSON.stringify(state))).toEqual(initialState())
})

test('入力をHTMLとして実行せず、CSVや表示に使う前に区別できる', () => {
  expect(escape('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
  const first = initialState(), second = initialState(); first.works.pop()
  expect(second.works).toHaveLength(14)
})
