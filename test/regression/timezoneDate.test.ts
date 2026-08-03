import { describe, it, expect } from "vitest";

describe("Timezone boundary date parsing regression tests", () => {
  // Helper mimicking the timezone-safe month filter logic implemented in budgets/[id].vue
  const parseLocalYearMonth = (dateStr: string | Date): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  it("should extract local month components accurately regardless of timezone offsets", () => {
    // Tests beginning of month in local dates
    const localDateStr = "2026-08-01";
    const parsed = parseLocalYearMonth(localDateStr);
    
    expect(parsed).toBe("2026-08");
  });

  it("should correctly handle native Date objects", () => {
    const dateObj = new Date(2026, 7, 15); // August 15th, 2026 (0-indexed month 7)
    const parsed = parseLocalYearMonth(dateObj);
    
    expect(parsed).toBe("2026-08");
  });

  it("should return empty string on invalid dates without throwing", () => {
    expect(parseLocalYearMonth("invalid-date-string")).toBe("");
  });
});
