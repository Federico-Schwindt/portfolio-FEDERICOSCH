/**
 * Service page demos. Local sample data, one interaction each, no network.
 * Each demo is rendered resolved in the HTML, so it reads without JavaScript too.
 */
import * as EN from '../data/samples'
import * as ESD from '../data/samples.es'

const ES = document.documentElement.lang === 'es'
const { fitment, treatments, slots, cars } = ES ? ESD : EN
const W = ES
  ? { part: 'Pieza', fits: 'Compatible con', choose: 'Elige marca, año y modelo para ver la pieza que corresponde.', make: 'Marca', year: 'Año', model: 'Modelo', booking: 'Pedido de turno', minutes: 'minutos', bookNote: 'Solo una vista previa. En un sitio real esto llega a la bandeja y al calendario del spa.', anyMake: 'Cualquier marca', miles: 'millas', carNote: 'Una consulta desde esta página nombraría este auto.', of: 'de', cars: 'autos', none: 'Ningún auto coincide.', reset: 'Limpiar los filtros', nothing: 'Todavía no hay nada para mostrar.' }
  : { part: 'Part', fits: 'Fits', choose: 'Choose a make, a year and a model to see the part that fits.', make: 'Make', year: 'Year', model: 'Model', booking: 'Booking request', minutes: 'minutes', bookNote: "Preview only. On a real site this lands in the spa's inbox and calendar.", anyMake: 'Any make', miles: 'miles', carNote: 'An enquiry from this page would name this car.', of: 'of', cars: 'cars', none: 'No cars match.', reset: 'Reset the filters', nothing: 'Nothing to show yet.' }

const $ = <T extends HTMLElement>(s: string, r: ParentNode) => r.querySelector<T>(s)!
const $$ = <T extends HTMLElement>(s: string, r: ParentNode) => [...r.querySelectorAll<T>(s)]
const money = (n: number) => '$' + n.toLocaleString('en-US')
const fill = (sel: HTMLSelectElement, items: (string | number)[], placeholder: string) => {
  sel.innerHTML = `<option value="">${placeholder}</option>` + items.map((i) => `<option>${i}</option>`).join('')
  sel.disabled = items.length === 0
}

/* Fitment: only combinations that exist in the catalog can be chosen */
document.querySelectorAll<HTMLElement>('[data-demo="fitment"]').forEach((root) => {
  const [make, year, model] = $$<HTMLSelectElement>('select', root)
  const out = $('[data-out]', root)
  const makes = [...new Set(fitment.map((f) => f.make))]
  const show = () => {
    const hit = fitment.find((f) => f.make === make.value && String(f.year) === year.value && f.model === model.value)
    out.innerHTML = hit
      ? `<p class="mono">${W.part} ${hit.part}</p><p class="demo__big">${hit.name}</p><p><b>${money(hit.price)}</b> <span class="chip">${hit.stock}</span></p><p class="demo__fit">${W.fits} ${hit.year} ${hit.make} ${hit.model}</p>`
      : `<p class="demo__hint">${W.choose}</p>`
  }
  fill(make, makes, W.make)
  fill(year, [], W.year); fill(model, [], W.model)
  make.addEventListener('change', () => { fill(year, [...new Set(fitment.filter((f) => f.make === make.value).map((f) => f.year))], W.year); fill(model, [], W.model); show() })
  year.addEventListener('change', () => { fill(model, fitment.filter((f) => f.make === make.value && String(f.year) === year.value).map((f) => f.model), W.model); show() })
  model.addEventListener('change', show)
  // start on a resolved example
  make.value = 'Ford'; make.dispatchEvent(new Event('change'))
  year.value = '2019'; year.dispatchEvent(new Event('change'))
  model.value = 'Ranger'; show()
})

/* Booking: treatment + time gives a preview of the request. Nothing is sent */
document.querySelectorAll<HTMLElement>('[data-demo="booking"]').forEach((root) => {
  const out = $('[data-out]', root)
  let t = 0, s = 0
  const paint = () => {
    $$('[data-t]', root).forEach((b, i) => b.setAttribute('aria-pressed', String(i === t)))
    $$('[data-slot]', root).forEach((b, i) => b.setAttribute('aria-pressed', String(i === s)))
    const tr = treatments[t]
    out.innerHTML = `<p class="mono">${W.booking}</p><p class="demo__big">${tr.name}</p><p>${slots[s]}, ${tr.mins} ${W.minutes}, <b>${money(tr.price)}</b></p><p class="demo__fit">${W.bookNote}</p>`
  }
  $$('[data-t]', root).forEach((b, i) => b.addEventListener('click', () => { t = i; paint() }))
  $$('[data-slot]', root).forEach((b, i) => b.addEventListener('click', () => { s = i; paint() }))
  paint()
})

/* Inventory: filter by make and price, open a car, recover from an empty result */
document.querySelectorAll<HTMLElement>('[data-demo="inventory"]').forEach((root) => {
  const [make, max] = $$<HTMLSelectElement>('select', root)
  const list = $('[data-list]', root), out = $('[data-out]', root), count = $('[data-count-out]', root)
  fill(make, [...new Set(cars.map((c) => c.make))], W.anyMake)
  make.disabled = false
  const open = (i: number) => {
    const c = cars[i]
    out.innerHTML = `<p class="mono">${c.year} / ${c.miles.toLocaleString('en-US')} ${W.miles}</p><p class="demo__big">${c.make} ${c.model}</p><p><b>${money(c.price)}</b></p><p>${c.notes}.</p><p class="demo__fit">${W.carNote}</p>`
    $$('[data-car]', root).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.car! === i)))
  }
  const render = () => {
    const hits = cars.map((c, i) => ({ c, i })).filter(({ c }) => (!make.value || c.make === make.value) && (!max.value || c.price <= +max.value))
    count.textContent = `${hits.length} ${W.of} ${cars.length} ${W.cars}`
    list.innerHTML = hits.length
      ? hits.map(({ c, i }) => `<button type="button" class="demo__car" data-car="${i}" aria-pressed="false"><span class="mono">${c.year}</span><b>${c.make} ${c.model}</b><span>${money(c.price)}</span></button>`).join('')
      : `<p class="demo__hint">${W.none} <button type="button" class="link" data-reset>${W.reset}</button></p>`
    if (hits.length) open(hits[0].i)
    else out.innerHTML = `<p class="demo__hint">${W.nothing}</p>`
  }
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const car = t.closest<HTMLElement>('[data-car]')
    if (car) open(+car.dataset.car!)
    if (t.closest('[data-reset]')) { make.value = ''; max.value = ''; render() }
  })
  make.addEventListener('change', render)
  max.addEventListener('change', render)
  render()
})
