<script setup>
import { computed, ref } from 'vue'
import { displayAmount, formatMoney } from '../lib/peruse.js'

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['use', 'undo', 'retire'])

const confirming = ref(false)

const amount = computed(() =>
  formatMoney(displayAmount(props.item.price, props.item.uses), props.item.currency),
)

function askRetire() {
  confirming.value = true
}

function keep() {
  confirming.value = false
}

function confirmRetire() {
  confirming.value = false
  emit('retire')
}
</script>

<template>
  <section class="run">
    <header class="top">
      <p class="name">{{ item.name }}</p>
      <button type="button" class="retire" @click="askRetire">Retire</button>
    </header>

    <button
      type="button"
      class="hit"
      :aria-label="`Add one use. ${amount}`"
      @click="emit('use')"
    >
      <span class="giant" aria-live="polite">{{ amount }}</span>
      <span class="uses">uses: {{ item.uses }}</span>
    </button>

    <button
      type="button"
      class="undo"
      :disabled="item.uses <= 0"
      @click="emit('undo')"
    >
      Undo
    </button>

    <div v-if="confirming" class="confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="sheet">
        <p id="confirm-title" class="ask">Retire {{ item.name }}?</p>
        <p class="hint">Stamps a last line and empties the slot.</p>
        <div class="row">
          <button type="button" class="keep" @click="keep">Keep</button>
          <button type="button" class="drop" @click="confirmRetire">Retire</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.run {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  background: #F3EDE3;
  color: #111;
  position: relative;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.retire {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: #111;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.45;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.retire:active {
  opacity: 1;
}

.hit {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 0;
  width: calc(100% + 32px);
  margin-left: -16px;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.hit:active .giant {
  transform: scale(0.97);
}

.giant {
  display: block;
  font-variant-numeric: tabular-nums;
  font-size: clamp(64px, 22vw, 128px);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.05em;
  color: #F15A24;
}

.uses {
  display: block;
  margin-top: 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #111;
  opacity: 0.35;
}

.undo {
  align-self: center;
  min-height: 44px;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: #111;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.4;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.undo:disabled {
  opacity: 0.18;
  cursor: default;
}

.undo:not(:disabled):active {
  opacity: 0.8;
}

.confirm {
  position: fixed;
  inset: 0;
  background: #111;
  color: #F3EDE3;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10;
}

.sheet {
  width: 100%;
  max-width: 390px;
  padding: 28px 20px calc(20px + env(safe-area-inset-bottom));
}

.ask {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.hint {
  margin: 0 0 24px;
  font-size: 16px;
  opacity: 0.7;
}

.row {
  display: flex;
  gap: 12px;
}

.keep,
.drop {
  flex: 1;
  min-height: 56px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.keep {
  border: 2px solid #F3EDE3;
  background: transparent;
  color: #F3EDE3;
}

.drop {
  border: 0;
  background: #F15A24;
  color: #fff;
}
</style>
