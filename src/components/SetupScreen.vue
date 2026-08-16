<script setup>
import { computed, ref } from 'vue'
import { CURRENCIES, DEFAULT_CURRENCY, clampPrice } from '../lib/peruse.js'

defineProps({
  retiredLine: { type: String, default: null },
})

const emit = defineEmits(['start'])

const name = ref('')
const digits = ref('')
const currency = ref(DEFAULT_CURRENCY)

const price = computed(() => {
  if (digits.value === '' || digits.value === '.') return 0
  const n = Number(digits.value)
  return Number.isFinite(n) ? n : 0
})

const priceLabel = computed(() => {
  if (digits.value === '' || digits.value === '.') return '0'
  return digits.value
})

const canStart = computed(() => name.value.trim().length > 0 && price.value >= 0.01)

function setFromNumber(n) {
  const clamped = clampPrice(n)
  digits.value = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(2)
}

function step(delta) {
  const base = price.value > 0 ? price.value : 0
  setFromNumber(base + delta)
}

function pad(key) {
  if (key === 'back') {
    digits.value = digits.value.slice(0, -1)
    return
  }
  if (key === '.') {
    if (digits.value.includes('.')) return
    digits.value = digits.value === '' ? '0.' : `${digits.value}.`
    return
  }
  const frac = digits.value.split('.')[1]
  if (frac !== undefined && frac.length >= 2) return
  if (digits.value === '0') {
    digits.value = key
    return
  }
  const next = `${digits.value}${key}`
  const n = Number(next)
  if (Number.isFinite(n) && n > 999999) return
  digits.value = next
}

function start() {
  if (!canStart.value) return
  emit('start', {
    name: name.value.trim().slice(0, 40),
    price: clampPrice(price.value),
    currency: currency.value,
  })
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back']
</script>

<template>
  <section class="setup">
    <header class="mast">
      <h1>Per Use</h1>
      <p class="lede">One object. Type what it cost. Tap every time you use it.</p>
      <p v-if="retiredLine" class="retired">{{ retiredLine }}</p>
    </header>

    <label class="field">
      <span class="label">Name</span>
      <input
        v-model="name"
        class="name"
        type="text"
        maxlength="40"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
        placeholder="Kettle"
        enterkeyhint="done"
      />
    </label>

    <div class="field">
      <span class="label">Price</span>
      <div class="price-row" role="group" :aria-label="`Price in ${currency}`">
        <button type="button" class="step" aria-label="Minus one" @click="step(-1)">−</button>
        <p class="price" aria-live="polite">
          <span class="sym">{{ currency }}</span>{{ priceLabel }}
        </p>
        <button type="button" class="step" aria-label="Plus one" @click="step(1)">+</button>
      </div>
    </div>

    <div class="currencies" role="group" aria-label="Currency">
      <button
        v-for="symbol in CURRENCIES"
        :key="symbol"
        type="button"
        class="currency"
        :class="{ on: currency === symbol }"
        :aria-pressed="currency === symbol"
        @click="currency = symbol"
      >
        {{ symbol }}
      </button>
    </div>

    <div class="pad" role="group" aria-label="Number pad">
      <button
        v-for="key in keys"
        :key="key"
        type="button"
        class="key"
        :class="{ back: key === 'back' }"
        :aria-label="key === 'back' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key"
        @click="pad(key)"
      >
        {{ key === 'back' ? '⌫' : key }}
      </button>
    </div>

    <button type="button" class="start" :disabled="!canStart" @click="start">Start</button>
  </section>
</template>

<style scoped>
.setup {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  max-width: 390px;
  margin: 0 auto;
  width: 100%;
  background: #F3EDE3;
  color: #111;
}

.mast {
  margin-bottom: 16px;
}

h1 {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #111;
}

.lede {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  color: #111;
  opacity: 0.7;
}

.retired {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111;
  opacity: 0.45;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #111;
}

.name {
  width: 100%;
  min-height: 64px;
  border: 2px solid #111;
  background: #F3EDE3;
  color: #111;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.03em;
  padding: 12px 14px;
  border-radius: 8px;
  outline: none;
  -webkit-appearance: none;
}

.name::placeholder {
  color: #111;
  opacity: 0.28;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price {
  flex: 1;
  margin: 0;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
  font-size: clamp(40px, 12vw, 56px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #111;
}

.sym {
  margin-right: 2px;
}

.step {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border: 2px solid #111;
  background: #F3EDE3;
  color: #111;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.step:active {
  background: #111;
  color: #F3EDE3;
}

.currencies {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.currency {
  flex: 1;
  min-height: 48px;
  border: 2px solid #111;
  background: #F3EDE3;
  color: #111;
  font-size: 22px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.currency.on {
  background: #111;
  color: #F3EDE3;
}

.pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.key {
  min-height: 56px;
  border: 2px solid #111;
  background: #F3EDE3;
  color: #111;
  font-size: 26px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.key:active {
  background: #111;
  color: #F3EDE3;
}

.start {
  margin-top: auto;
  width: 100%;
  min-height: 72px;
  border: 0;
  background: #111;
  color: #F3EDE3;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.start:disabled {
  opacity: 0.28;
  cursor: default;
}

.start:not(:disabled):active {
  opacity: 0.85;
}
</style>
