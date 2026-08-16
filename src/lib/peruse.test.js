import { describe, it, expect } from 'vitest'
import {
  STORAGE_KEY,
  RETIRED_KEY,
  PRICE_MIN,
  PRICE_MAX,
  clampPrice,
  clampUses,
  displayAmount,
  formatMoney,
  increment,
  undo,
  retire,
  begin,
  canStart,
  startItem,
  serialize,
  parse,
  save,
  load,
  clear,
  saveRetired,
  loadRetired,
  commitRetire,
} from './peruse.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v)
    },
    removeItem: (k) => {
      delete data[k]
    },
    _data: data,
  }
}

const kettle = { name: 'Kettle', price: 200, uses: 0, currency: '£' }

describe('displayAmount', () => {
  it('unused display is the full price', () => {
    expect(displayAmount(200, 0)).toBe(200)
    expect(displayAmount(200, -1)).toBe(200)
    expect(displayAmount(19.99, 0)).toBe(19.99)
  })

  it('is 200 when price is 200 and uses is 1', () => {
    expect(displayAmount(200, 1)).toBe(200)
  })

  it('is 100 when price is 200 and uses is 2', () => {
    expect(displayAmount(200, 2)).toBe(100)
  })

  it('is approximately 66.666… when price is 200 and uses is 3', () => {
    expect(displayAmount(200, 3)).toBeCloseTo(66.66666666666667, 10)
  })
})

describe('formatMoney', () => {
  it('formats pounds with a £ prefix', () => {
    expect(formatMoney(200, '£')).toBe('£200')
    expect(formatMoney(200, '£')).toBe('£200')
    expect(formatMoney(66.66666666666667, '£')).toBe('£66.67')
    expect(formatMoney(0.5, '£')).toBe('£0.50')
    expect(formatMoney(19.99, '£')).toBe('£19.99')
  })

  it('formats dollars with a $ prefix', () => {
    expect(formatMoney(200, '$')).toBe('$200')
    expect(formatMoney(66.66666666666667, '$')).toBe('$66.67')
    expect(formatMoney(0.5, '$')).toBe('$0.50')
  })

  it('formats euros with a € prefix', () => {
    expect(formatMoney(200, '€')).toBe('€200')
    expect(formatMoney(66.66666666666667, '€')).toBe('€66.67')
    expect(formatMoney(0.5, '€')).toBe('€0.50')
  })

  it('defaults to pounds and drops .00', () => {
    expect(formatMoney(100)).toBe('£100')
    expect(formatMoney(100.0, '£')).toBe('£100')
    expect(formatMoney(5.00, '$')).toBe('$5')
  })
})

describe('increment', () => {
  it('adds one use', () => {
    expect(increment(kettle).uses).toBe(1)
    expect(increment(increment(kettle)).uses).toBe(2)
    expect(increment({ ...kettle, uses: 99998 }).uses).toBe(99999)
    expect(increment({ ...kettle, uses: 99999 }).uses).toBe(99999)
  })

  it('keeps name, price, and currency', () => {
    expect(increment(kettle)).toEqual({
      name: 'Kettle',
      price: 200,
      uses: 1,
      currency: '£',
    })
  })
})

describe('undo', () => {
  it('stays at 0 when already 0', () => {
    expect(undo(kettle).uses).toBe(0)
    expect(undo({ ...kettle, uses: 0 }).uses).toBe(0)
  })

  it('undoes the last tap after increment', () => {
    const afterTap = increment(kettle)
    expect(afterTap.uses).toBe(1)
    expect(undo(afterTap).uses).toBe(0)
    expect(undo(increment(increment(kettle))).uses).toBe(1)
  })
})

describe('retire', () => {
  it('stamps a last-retired line and empties the slot', () => {
    const used = { name: 'Kettle', price: 200, uses: 3, currency: '£' }
    const result = retire(used)
    expect(result.item).toBe(null)
    expect(result.line).toBe('Kettle · £66.67 / use · 3 uses')
  })

  it('uses the item currency and whole-number money', () => {
    expect(retire({ name: 'Coat', price: 80, uses: 2, currency: '$' })).toEqual({
      line: 'Coat · $40 / use · 2 uses',
      item: null,
    })
    expect(retire({ name: 'Bag', price: 90, uses: 1, currency: '€' })).toEqual({
      line: 'Bag · €90 / use · 1 uses',
      item: null,
    })
  })

  it('unused retire still shows the full price', () => {
    expect(retire(kettle)).toEqual({
      line: 'Kettle · £200 / use · 0 uses',
      item: null,
    })
  })
})

describe('begin', () => {
  it('does not allow two live items', () => {
    const first = begin(null, { name: 'Kettle', price: 200, currency: '£' })
    expect(first).toEqual({
      name: 'Kettle',
      price: 200,
      uses: 0,
      currency: '£',
    })
    const second = begin(first, { name: 'Coat', price: 50, currency: '$' })
    expect(second).toEqual(first)
    const after = retire(first)
    expect(after.item).toBe(null)
    const third = begin(after.item, { name: 'Coat', price: 50, currency: '$' })
    expect(third).toEqual({
      name: 'Coat',
      price: 50,
      uses: 0,
      currency: '$',
    })
  })
})

describe('startItem', () => {
  it('refuses a second live item until retired', () => {
    const storage = memoryStorage()
    const draft = { name: 'Kettle', price: 200, currency: '£' }
    expect(canStart(storage, draft)).toBe(true)
    const first = startItem(storage, draft)
    expect(first.ok).toBe(true)
    expect(first.item.name).toBe('Kettle')
    expect(canStart(storage, { name: 'Coat', price: 50, currency: '$' })).toBe(false)
    const second = startItem(storage, { name: 'Coat', price: 50, currency: '$' })
    expect(second.ok).toBe(false)
    expect(second.item.name).toBe('Kettle')
    expect(load(storage).name).toBe('Kettle')
    commitRetire(storage, first.item)
    expect(load(storage)).toBe(null)
    expect(canStart(storage, { name: 'Coat', price: 50, currency: '$' })).toBe(true)
    const third = startItem(storage, { name: 'Coat', price: 50, currency: '$' })
    expect(third.ok).toBe(true)
    expect(third.item).toEqual({
      name: 'Coat',
      price: 50,
      uses: 0,
      currency: '$',
    })
  })
})

describe('clampPrice', () => {
  it('clamps to 0.01–999999 and two decimal places', () => {
    expect(clampPrice(0)).toBe(PRICE_MIN)
    expect(clampPrice(-12)).toBe(0.01)
    expect(clampPrice(0.004)).toBe(0.01)
    expect(clampPrice(1.239)).toBe(1.24)
    expect(clampPrice(200)).toBe(200)
    expect(clampPrice(999999)).toBe(PRICE_MAX)
    expect(clampPrice(1_000_000)).toBe(999999)
    expect(clampPrice(NaN)).toBe(0.01)
    expect(clampPrice('nope')).toBe(0.01)
  })
})

describe('clampUses', () => {
  it('clamps to 0–99999 as an integer', () => {
    expect(clampUses(-3)).toBe(0)
    expect(clampUses(0)).toBe(0)
    expect(clampUses(2.6)).toBe(3)
    expect(clampUses(99999)).toBe(99999)
    expect(clampUses(100000)).toBe(99999)
    expect(clampUses(NaN)).toBe(0)
  })
})

describe('persist', () => {
  it('saves and reloads an item with currency', () => {
    const storage = memoryStorage()
    const item = { name: 'Kettle', price: 200, uses: 3, currency: '$' }
    save(storage, item)
    expect(storage._data[STORAGE_KEY]).toBeTruthy()
    expect(load(storage)).toEqual({
      name: 'Kettle',
      price: 200,
      uses: 3,
      currency: '$',
    })
  })

  it('round-trips through serialize and parse', () => {
    const item = { name: 'Coat', price: 19.99, uses: 4, currency: '€' }
    expect(parse(serialize(item))).toEqual({
      name: 'Coat',
      price: 19.99,
      uses: 4,
      currency: '€',
    })
  })

  it('defaults missing currency to pounds', () => {
    expect(parse(JSON.stringify({ name: 'Kettle', price: 200, uses: 1 }))).toEqual({
      name: 'Kettle',
      price: 200,
      uses: 1,
      currency: '£',
    })
  })

  it('clears the stored item', () => {
    const storage = memoryStorage()
    save(storage, kettle)
    clear(storage)
    expect(load(storage)).toBe(null)
  })

  it('returns null for missing or junk data', () => {
    expect(parse(null)).toBe(null)
    expect(parse('')).toBe(null)
    expect(parse('{')).toBe(null)
    expect(parse('{"foo":1}')).toBe(null)
    expect(load(memoryStorage())).toBe(null)
  })

  it('persists a single last-retired line and empties the live slot', () => {
    const storage = memoryStorage()
    const item = { name: 'Kettle', price: 200, uses: 3, currency: '£' }
    save(storage, item)
    const result = commitRetire(storage, item)
    expect(result.item).toBe(null)
    expect(result.line).toBe('Kettle · £66.67 / use · 3 uses')
    expect(load(storage)).toBe(null)
    expect(loadRetired(storage)).toBe('Kettle · £66.67 / use · 3 uses')
    expect(storage._data[RETIRED_KEY]).toBe('Kettle · £66.67 / use · 3 uses')
    saveRetired(storage, 'Coat · $40 / use · 2 uses')
    expect(loadRetired(storage)).toBe('Coat · $40 / use · 2 uses')
  })
})
