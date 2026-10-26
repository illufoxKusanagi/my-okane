<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const modelValue = defineModel<number | null>({ default: 0 })

const props = withDefaults(
  defineProps<{
    step?: number
    min?: number
    max?: number
    autofocus?: boolean
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    step: 1000,
    min: 0,
    max: 1_000_000_000_000,
    autofocus: false,
    placeholder: undefined,
    disabled: false
  }
)

function formatRupiah(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) {
    return ''
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val)
}

function parseDigits(str: string): number {
  const digits = str.replace(/\D/g, '')
  return digits ? Number.parseInt(digits, 10) : 0
}

const displayValue = ref(
  modelValue.value !== null && modelValue.value !== undefined
    ? formatRupiah(modelValue.value)
    : ''
)

watch(
  modelValue,
  (newVal) => {
    const currentNum = parseDigits(displayValue.value)
    if (newVal !== currentNum) {
      displayValue.value
        = newVal !== null && newVal !== undefined ? formatRupiah(newVal) : ''
    }
  },
  { immediate: true }
)

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const rawValue = input.value
  const oldCursorPos = input.selectionStart ?? rawValue.length

  // Count how many digits were before the cursor prior to formatting
  const digitsBeforeCursor = rawValue
    .slice(0, oldCursorPos)
    .replace(/\D/g, '').length

  const allDigits = rawValue.replace(/\D/g, '')

  if (!allDigits) {
    modelValue.value = 0
    displayValue.value = ''
    input.value = ''
    return
  }

  const num = Number.parseInt(allDigits, 10)
  const clamped = Math.min(props.max, Math.max(props.min, num))
  modelValue.value = clamped

  const formatted = formatRupiah(clamped)
  displayValue.value = formatted
  input.value = formatted

  // Keep cursor position stable relative to digits
  nextTick(() => {
    if (!input) return
    let digitCount = 0
    let newCursorPos = formatted.length
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i] ?? '')) {
        digitCount++
      }
      if (digitCount >= digitsBeforeCursor) {
        newCursorPos = i + 1
        break
      }
    }
    input.setSelectionRange(newCursorPos, newCursorPos)
  })
}

function onBlur() {
  if (modelValue.value !== null && modelValue.value !== undefined) {
    displayValue.value = formatRupiah(modelValue.value)
  } else if (!props.placeholder) {
    displayValue.value = formatRupiah(0)
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    stepUp()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    stepDown()
  } else if (event.key === 'Backspace') {
    const input = event.target as HTMLInputElement
    const start = input.selectionStart
    const end = input.selectionEnd
    if (start !== null && start === end && start > 0) {
      const charBefore = input.value[start - 1]
      if (charBefore && /\D/.test(charBefore)) {
        let pos = start - 1
        while (pos > 0 && input.value[pos - 1] && /\D/.test(input.value[pos - 1] ?? '')) {
          pos--
        }
        if (pos > 0) {
          event.preventDefault()
          const before = input.value.slice(0, pos - 1)
          const after = input.value.slice(start)
          input.value = before + after
          input.setSelectionRange(pos - 1, pos - 1)
          input.dispatchEvent(new Event('input'))
        }
      }
    }
  }
}

function stepUp() {
  if (props.disabled) return
  const current = modelValue.value ?? 0
  const next = Math.min(props.max, current + props.step)
  modelValue.value = next
  displayValue.value = formatRupiah(next)
}

function stepDown() {
  if (props.disabled) return
  const current = modelValue.value ?? 0
  const next = Math.max(props.min, current - props.step)
  modelValue.value = next
  displayValue.value = formatRupiah(next)
}
</script>

<template>
  <UInput
    v-model="displayValue"
    type="text"
    inputmode="numeric"
    class="w-full"
    :ui="{
      base: 'text-center font-medium',
      leading: 'ps-2',
      trailing: 'pe-2'
    }"
    :autofocus="autofocus"
    :placeholder="placeholder ?? 'Rp 0'"
    :disabled="disabled"
    @input="onInput"
    @blur="onBlur"
    @keydown="onKeydown"
  >
    <template #leading>
      <UButton
        type="button"
        icon="i-lucide-minus"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Decrease amount"
        tabindex="-1"
        :disabled="disabled || (modelValue ?? 0) <= min"
        @click="stepDown"
      />
    </template>
    <template #trailing>
      <UButton
        type="button"
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        size="xs"
        aria-label="Increase amount"
        tabindex="-1"
        :disabled="disabled || (modelValue ?? 0) >= max"
        @click="stepUp"
      />
    </template>
  </UInput>
</template>
