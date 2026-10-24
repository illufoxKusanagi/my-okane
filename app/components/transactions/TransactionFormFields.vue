<script setup lang="ts">
import type { Category } from "~/composables/useFinance";

withDefaults(
  defineProps<{
    showType?: boolean;
    showCategory?: boolean;
    categories?: Category[];
  }>(),
  {
    showType: false,
    showCategory: false,
    categories: () => [],
  },
);

const name = defineModel<string>("name", { required: true });
const amount = defineModel<number>("amount", { required: true });
const notes = defineModel<string>("notes", { required: true });
const date = defineModel<string>("date", { required: true });
const type = defineModel<"income" | "spending">("type", {
  default: "spending",
});
const categoryId = defineModel<string | undefined>("categoryId");
</script>

<template>
  <UFormField label="Transaction Name">
    <UInput
      v-model="name"
      placeholder="e.g. Lunch at McD, Monthly Salary"
      class="w-full"
      autofocus
    />
  </UFormField>

  <UFormField v-if="showType" label="Transaction Type">
    <USelect
      v-model="type"
      class="w-full"
      :items="[
        { label: 'Spending', value: 'spending' },
        { label: 'Income', value: 'income' },
      ]"
    />
  </UFormField>

  <UFormField v-if="showCategory" label="Category">
    <USelect
      v-model="categoryId"
      class="w-full"
      :items="categories.map((c) => ({ label: c.name, value: c.id }))"
      placeholder="Select category"
    />
  </UFormField>

  <UFormField label="Amount">
    <UInputNumber
      v-model="amount"
      class="w-full"
      :format-options="{
        style: 'currency',
        currency: 'IDR',
        currencyDisplay: 'code',
        currencySign: 'accounting',
      }"
    />
  </UFormField>

  <UFormField label="Date">
    <UInput v-model="date" type="date" class="w-full" />
  </UFormField>

  <UFormField label="Notes (Optional)">
    <UTextarea
      v-model="notes"
      placeholder="Add details, store name, or description..."
      class="w-full"
    />
  </UFormField>
</template>
