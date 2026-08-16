<script setup>
import { onMounted, ref } from 'vue'
import SetupScreen from './components/SetupScreen.vue'
import RunningScreen from './components/RunningScreen.vue'
import {
  begin,
  increment,
  undo,
  load,
  save,
  loadRetired,
  commitRetire,
} from './lib/peruse.js'

const item = ref(null)
const retiredLine = ref(null)

function persist(next) {
  item.value = next
  save(localStorage, next)
}

function onStart(draft) {
  const existing = load(localStorage)
  if (existing) {
    item.value = existing
    return
  }
  const next = begin(null, draft)
  if (!next?.name) return
  persist(next)
}

function onUse() {
  if (!item.value) return
  persist(increment(item.value))
}

function onUndo() {
  if (!item.value) return
  persist(undo(item.value))
}

function onRetire() {
  if (!item.value) return
  const result = commitRetire(localStorage, item.value)
  retiredLine.value = result.line
  item.value = null
}

onMounted(() => {
  item.value = load(localStorage)
  retiredLine.value = loadRetired(localStorage)
})
</script>

<template>
  <RunningScreen
    v-if="item"
    :item="item"
    @use="onUse"
    @undo="onUndo"
    @retire="onRetire"
  />
  <SetupScreen
    v-else
    :retired-line="retiredLine"
    @start="onStart"
  />
</template>
