import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Route Breadth Page Existence Checks (Static Smoke Tests)", () => {
  const pagesDir = path.resolve(__dirname, "../../app/pages");

  const expectedPages = [
    "index.vue",
    "login.vue",
    "register.vue",
    "categories.vue",
    "transactions.vue",
    "budgets/index.vue",
  ];

  expectedPages.forEach((pagePath) => {
    it(`should verify that the page file '${pagePath}' exists in the workspace`, () => {
      const fullPath = path.join(pagesDir, pagePath);
      const exists = fs.existsSync(fullPath);
      expect(exists).toBe(true);
    });
  });
});
