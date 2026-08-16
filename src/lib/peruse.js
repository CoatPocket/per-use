export const STORAGE_KEY = 'per-use-item'
export const RETIRED_KEY = 'per-use-retired'

export const PRICE_MIN = 0.01
export const PRICE_MAX = 999999
export const USES_MIN = 0
export const USES_MAX = 99999

export const CURRENCIES = ['£', '$', '€']
export const DEFAULT_CURRENCY = '£'

export function clampPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return PRICE_MIN
  const rounded = Math.round(n * 100) / 100
  if (rounded < PRICE_MIN) return PRICE_MIN
  if (rounded > PRICE_MAX) return PRICE_MAX
  return rounded
}

export function clampUses(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return USES_MIN
  return Math.min(USES_MAX, Math.max(USES_MIN, Math.round(n)))
}

export function normalizeCurrency(value) {
  return CURRENCIES.includes(value) ? value : DEFAULT_CURRENCY
}

export function displayAmount(price, uses) {
  if (uses < 1) return price
  return price / uses
}

export function formatMoney(amount, currency = DEFAULT_CURRENCY) {
  const symbol = normalizeCurrency(currency)
  const n = Number(amount)
  if (!Number.isFinite(n)) return `${symbol}0`
  const rounded = Math.round(n * 100) / 100
  if (Number.isInteger(rounded)) return `${symbol}${rounded}`
  return `${symbol}${rounded.toFixed(2)}`
}

function fields(item, uses) {
  return {
    name: item.name,
    price: item.price,
    uses,
    currency: normalizeCurrency(item.currency),
  }
}

export function increment(item) {
  return fields(item, clampUses(item.uses + 1))
}

export function undo(item) {
  if (item.uses <= 0) {
    return fields(item, item.uses)
  }
  return fields(item, clampUses(item.uses - 1))
}

export function retire(item) {
  const amount = displayAmount(item.price, item.uses)
  const money = formatMoney(amount, item.currency)
  const uses = clampUses(item.uses)
  return {
    line: `${item.name} · ${money} / use · ${uses} uses`,
    item: null,
  }
}

export function begin(existing, draft) {
  if (existing != null) return existing
  return {
    name: String(draft?.name ?? '').trim().slice(0, 40),
    price: clampPrice(draft?.price),
    uses: 0,
    currency: normalizeCurrency(draft?.currency),
  }
}

export function serialize(item) {
  return JSON.stringify({
    name: String(item.name ?? ''),
    price: clampPrice(item.price),
    uses: clampUses(item.uses),
    currency: normalizeCurrency(item.currency),
  })
}

export function parse(raw) {
  if (raw == null || raw === '') return null
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (typeof data.name !== 'string' || typeof data.price !== 'number') {
      return null
    }
    return {
      name: data.name,
      price: clampPrice(data.price),
      uses: clampUses(typeof data.uses === 'number' ? data.uses : 0),
      currency: normalizeCurrency(data.currency),
    }
  } catch {
    return null
  }
}

export function save(storage, item) {
  storage.setItem(STORAGE_KEY, serialize(item))
}

export function load(storage) {
  try {
    return parse(storage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function clear(storage) {
  storage.removeItem(STORAGE_KEY)
}

export function saveRetired(storage, line) {
  if (line && typeof line === 'object' && line.line != null) {
    storage.setItem(RETIRED_KEY, String(line.line))
    return
  }
  storage.setItem(RETIRED_KEY, String(line ?? ''))
}

export function loadRetired(storage) {
  try {
    const raw = storage.getItem(RETIRED_KEY)
    if (raw == null || raw === '') return null
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && parsed.line != null) {
        return String(parsed.line)
      }
    } catch {
      /* plain string */
    }
    return String(raw)
  } catch {
    return null
  }
}

export function commitRetire(storage, item) {
  const result = retire(item)
  saveRetired(storage, result.line)
  clear(storage)
  return result
}

export const saveItem = save
export const loadItem = load
export const clearItem = clear

export function canStart(storage, draft) {
  if (load(storage) != null) return false
  if (draft == null) return true
  const name = String(draft.name ?? '').trim()
  const price = Number(draft.price)
  return name.length > 0 && Number.isFinite(price) && price >= PRICE_MIN
}

export function startItem(storage, draft) {
  const existing = load(storage)
  if (existing != null) {
    return { ok: false, item: existing }
  }
  if (!canStart(storage, draft)) {
    return { ok: false, item: null }
  }
  const item = begin(null, draft)
  save(storage, item)
  return { ok: true, item }
}
