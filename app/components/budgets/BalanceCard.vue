<script setup lang="ts">
withDefaults(
  defineProps<{
    balance: number
    totalIncome: number
    totalSpending: number
    loading?: boolean
  }>(),
  {
    loading: false
  }
)

const { formatCurrency } = useFormatters()
</script>

<template>
  <div
    class="flex flex-col justify-between p-6 rounded-3xl bg-primary-600 dark:bg-primary-950/40 text-white border border-primary-500/20 dark:border-primary-900/30 shadow-lg relative overflow-hidden group transition-all duration-300"
  >
    <!-- Decorative Circle -->
    <div
      class="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"
    />

    <div>
      <div class="flex items-center gap-2 mb-2 opacity-90">
        <UIcon
          name="i-lucide-wallet"
          class="w-5 h-5"
        />
        <span class="text-sm font-semibold tracking-wide uppercase">Main Account Balance</span>
      </div>
      <div class="h-10 flex items-center mb-4">
        <USkeleton
          v-if="loading"
          class="h-9 w-44 rounded-xl bg-white/20"
        />
        <h2
          v-else
          class="text-3xl font-extrabold tracking-tight"
        >
          {{ formatCurrency(balance) }}
        </h2>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
      <div>
        <p class="opacity-80 text-xs">
          This Month Income
        </p>
        <USkeleton
          v-if="loading"
          class="h-5 w-24 rounded-lg bg-white/20 mt-1"
        />
        <p
          v-else
          class="font-bold text-emerald-300 mt-1"
        >
          +{{ formatCurrency(totalIncome) }}
        </p>
      </div>
      <div>
        <p class="opacity-80 text-xs">
          This Month Spent
        </p>
        <USkeleton
          v-if="loading"
          class="h-5 w-24 rounded-lg bg-white/20 mt-1"
        />
        <p
          v-else
          class="font-bold text-rose-300 mt-1"
        >
          -{{ formatCurrency(totalSpending) }}
        </p>
      </div>
    </div>
  </div>
</template>
