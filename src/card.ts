export function initCard() {
  const flip = document.querySelector<HTMLElement>('.flip')
  if (!flip) return () => {}
  const front = flip.querySelector<HTMLElement>('.flip-face:not(.ura)')!
  const back = flip.querySelector<HTMLElement>('.ura')!
  const mark = flip.querySelector<HTMLButtonElement>('[data-flip]')!
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  let busy = false, turned = false, cancelled = false, frame = 0
  let animation: Animation | undefined

  function show(next: boolean) {
    turned = next
    flip!.classList.toggle('turned', next)
    for (const [face, visible] of [[front, !next], [back, next]] as const) {
      face.hidden = !visible; face.inert = !visible; face.setAttribute('aria-hidden', String(!visible))
    }
    back.tabIndex = next ? 0 : -1
    mark.setAttribute('aria-expanded', String(next))
  }
  function count() {
    const el = back.querySelector<HTMLElement>('[data-yen]')!, amount = Number(el.dataset.yen)
    if (media.matches) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 650)
      el.textContent = `¥${Math.round(amount * (1 - (1 - progress) ** 3)).toLocaleString('ja-JP')}`
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }
  async function animate(face: HTMLElement, from: number, to: number) {
    if (media.matches) return
    animation = face.animate([{ transform: `perspective(1200px) rotateY(${from}deg)` }, { transform: `perspective(1200px) rotateY(${to}deg)` }], { duration: 180, easing: 'ease-in-out', fill: 'both' })
    try { await animation.finished } catch {}
  }
  async function turn() {
    if (busy) return
    busy = true; mark.disabled = true; cancelAnimationFrame(frame)
    const next = !turned, from = turned ? back : front, to = next ? back : front, direction = next ? -1 : 1
    flip!.focus({ preventScroll: true }); from.inert = true
    await animate(from, 0, direction * 90)
    if (cancelled) return
    animation?.cancel(); show(next); to.inert = true
    if (next) { back.classList.remove('stacking'); void back.offsetWidth; back.classList.add('stacking'); count() }
    await animate(to, -direction * 90, 0)
    if (cancelled) return
    animation?.cancel(); to.inert = false; mark.disabled = false; busy = false
    if (flip!.contains(document.activeElement)) (next ? back : mark).focus({ preventScroll: true })
  }
  mark.addEventListener('click', turn)
  back.addEventListener('click', turn)
  back.addEventListener('keydown', event => {
    if (event.target === back && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); void turn() }
  })
  show(false)
  return () => { cancelled = true; animation?.cancel(); cancelAnimationFrame(frame) }
}
