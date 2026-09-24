import { MONTH } from './state'

export function selectedMonth(hash: string): string {
  const ym = new URLSearchParams(hash.split('?')[1] ?? '').get('ym')
  return ym && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym) && ym >= '0001-01' && ym < MONTH ? ym : MONTH
}

export const monthName = (ym: string) => `${ym.slice(0, 4)}年${Number(ym.slice(5))}月`
export const monthLink = (path: string, ym: string) => `#${path}${ym === MONTH ? '' : `?ym=${ym}`}`

export function adjacentMonth(ym: string, step: -1 | 1): string {
  const year = Number(ym.slice(0, 4)), month = Number(ym.slice(5)) + step
  return `${year + (month < 1 ? -1 : month > 12 ? 1 : 0)}`.padStart(4, '0') + '-' + String((month + 11) % 12 + 1).padStart(2, '0')
}
