<script setup lang="ts">
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
  },
  color: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String as () => "income" | "spending",
    default: "income",
  },
});

const { addTransaction, getCategories } = useFinance();

const iconName = computed(
  () =>
    props.icon ??
    (props.type === "income"
      ? "hugeicons:money-receive-02"
      : "hugeicons:money-send-02"),
);

const transactionName = ref("");
const selectedCategory = ref<number | undefined>(undefined);
const transactionAmount = ref(30000);
const categories = computed(() =>
  getCategories(props.type).map((cat) => ({ label: cat.name, value: cat.id })),
);

watch(
  () => props.type,
  (newType) => {
    const cats = getCategories(newType);
    selectedCategory.value = cats.length > 0 ? cats[0]?.id : undefined;
  },
  { immediate: true },
);

const isOpen = ref(false);

const handleAddTransaction = async () => {
  if (
    transactionName.value &&
    selectedCategory.value !== undefined &&
    transactionAmount.value > 0
  ) {
    await addTransaction(
      transactionName.value,
      selectedCategory.value,
      transactionAmount.value,
      props.type,
    );
    transactionName.value = "";
    const cats = getCategories(props.type);
    selectedCategory.value = cats.length > 0 ? cats[0]?.id : undefined;
    transactionAmount.value = 30000;
    isOpen.value = false;
  }
};
</script>

<template>
  <div
    :class="[
      'flex flex-row items-center justify-between h-28 border rounded-2xl p-6 w-full relative overflow-hidden transition-all duration-300 hover:scale-[1.01]',
      type === 'income'
        ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
        : 'bg-gradient-to-br from-rose-500/10 to-pink-500/5 dark:from-rose-950/20 dark:to-pink-950/10 border-rose-200/50 dark:border-rose-900/30 text-rose-800 dark:text-rose-300',
    ]"
  >
    <div class="flex flex-col gap-1 z-10">
      <div class="flex flex-row gap-2 items-center opacity-80">
        <UIcon :name="iconName" class="w-5 h-5" />
        <p class="text-xs font-semibold uppercase tracking-wider">
          {{ label }}
        </p>
      </div>
      <p class="text-2xl md:text-3xl font-extrabold tabular-nums">
        Rp. {{ amount.toLocaleString() }}
      </p>
    </div>

    <!-- Background glowing circle decoration -->
    <div
      :class="[
        'absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none',
        type === 'income' ? 'bg-emerald-500' : 'bg-rose-500',
      ]"
    />

    <UDrawer v-model="isOpen" handle-only>
      <UButton
        :color="type === 'income' ? 'success' : 'error'"
        variant="subtle"
        icon="i-lucide-plus"
        class="rounded-full shadow-sm absolute right-6 z-10"
        size="md"
        @click="isOpen = true"
      />

      <template #content>
        <UContainer class="flex flex-col gap-4 py-8">
          <p class="text-lg font-semibold">
            Add {{ type === "income" ? "Income" : "Spending" }}
          </p>

          <div>
            <p class="text-sm mb-2">Transaction Name</p>
            <UInput
              class="w-full"
              v-model="transactionName"
              placeholder="Enter name"
            />
          </div>

          <div>
            <p class="text-sm mb-2">Category</p>
            <USelect
              class="w-full"
              v-model="selectedCategory"
              :items="categories"
            />
          </div>

          <div>
            <p class="text-sm mb-2">Amount</p>
            <UInputNumber
              class="w-full"
              v-model="transactionAmount"
              :format-options="{
                style: 'currency',
                currency: 'IDR',
                currencyDisplay: 'code',
                currencySign: 'accounting',
              }"
            />
          </div>

          <UButton @click="handleAddTransaction" class="justify-center">
            {{ type === "income" ? "Add Income" : "Add Spending" }}
          </UButton>
        </UContainer>
      </template>
    </UDrawer>
  </div>
</template>
