<script setup lang="ts">
import { colorClassMap } from "~/constants/ui";

defineProps<{
  transaction: {
    id: string;
    name: string;
    amount: number;
    type: "income" | "spending";
    transactionDate: string | Date;
    notes?: string | null;
    categoryName?: string | null;
    categoryIcon?: string | null;
    categoryColor?: string | null;
    categoryId?: string;
  };
  /** Override icon (e.g. pocket detail pages use the pocket icon) */
  icon?: string;
  /** Override color (e.g. pocket detail pages use the pocket color) */
  color?: string;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const { formatDate } = useFormatters();
</script>

<template>
  <div
    class="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-elevated border border-default shadow-sm hover:shadow-md hover:border-default transition-all duration-300 gap-3 sm:gap-4 group"
  >
    <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
      <!-- Category Icon Badge -->
      <div
        :class="[
          'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
          colorClassMap[color || transaction.categoryColor || 'slate'] ||
            colorClassMap.slate,
        ]"
      >
        <UIcon
          :name="icon || transaction.categoryIcon || 'i-lucide-folder'"
          class="w-5 h-5"
        />
      </div>

      <!-- Transaction Info -->
      <div class="flex-1 min-w-0">
        <p class="font-bold text-default truncate text-sm sm:text-base">
          {{ transaction.name }}
        </p>
        <div class="flex items-center gap-2 mt-0.5 sm:mt-1">
          <span class="text-xs text-muted">
            {{ formatDate(transaction.transactionDate) }}
          </span>
          <template v-if="transaction.categoryName">
            <span class="text-xs text-dimmed">•</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted font-semibold"
            >
              {{ transaction.categoryName }}
            </span>
          </template>
        </div>
        <p v-if="transaction.notes" class="text-xs text-dimmed mt-1 truncate">
          {{ transaction.notes }}
        </p>
      </div>
    </div>

    <!-- Amount and Actions -->
    <div
      class="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-muted pt-2 sm:pt-0"
    >
      <span
        :class="[
          'text-base sm:text-lg font-extrabold tabular-nums',
          transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500',
        ]"
      >
        {{ transaction.type === "income" ? "+" : "-" }} Rp.
        {{ transaction.amount.toLocaleString() }}
      </span>

      <div
        class="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
      >
        <UButton
          icon="i-lucide-pencil"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Edit transaction"
          @click="emit('edit')"
        />
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="error"
          variant="ghost"
          aria-label="Delete transaction"
          @click="emit('delete')"
        />
      </div>
    </div>
  </div>
</template>
