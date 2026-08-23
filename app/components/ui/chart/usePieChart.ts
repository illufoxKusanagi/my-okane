import { computed } from "vue";
import type { ChartData, ChartOptions, Chart as ChartJS } from "chart.js";

interface DataItem {
  label: string;
  value: number;
  color: string;
}

export function usePieChart(props: {
  data: DataItem[];
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const colorMode = useColorMode();
  const isDark = computed(() => colorMode.value === "dark");

  const total = computed(() => props.data.reduce((acc, d) => acc + d.value, 0));
  const computedCenterLabel = computed(
    () => props.centerLabel ?? total.value.toLocaleString(),
  );

  const chartData = computed<ChartData<"doughnut">>(() => ({
    labels: props.data.map((d) => d.label),
    datasets: [
      {
        data: props.data.map((d) => d.value),
        backgroundColor: props.data.map((d) => d.color),
        borderWidth: 2,
        borderColor: "transparent",
        hoverBorderColor: "transparent",
        hoverOffset: 6,
      },
    ],
  }));

  const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark.value ? "#1f2937" : "#ffffff",
        titleColor: isDark.value ? "#f3f4f6" : "#111827",
        bodyColor: isDark.value ? "#9ca3af" : "#4b5563",
        borderColor: isDark.value ? "#374151" : "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => {
            const pct = total.value > 0 ? ((ctx.parsed / total.value) * 100).toFixed(1) : "0.0";
            return ` ${ctx.label}: Rp. ${ctx.parsed.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      duration: 800,
      easing: "easeInOutQuart",
    },
  }));

  const centerTextPlugin = {
    id: "centerText",
    afterDraw(chart: ChartJS) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDark.value ? "#f3f4f6" : "#111827";
      ctx.font = "bold 1.4rem system-ui, sans-serif";
      ctx.fillText(`Rp. ${computedCenterLabel.value}`, cx, cy - 10);
      ctx.fillStyle = isDark.value ? "#9ca3af" : "#6b7280";
      ctx.font = "0.8rem system-ui, sans-serif";
      ctx.fillText(props.centerSubLabel ?? "", cx, cy + 14);
      ctx.restore();
    },
  };

  return {
    colorMode,
    chartData,
    chartOptions,
    centerTextPlugin,
  };
}
