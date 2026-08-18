import { test as base } from "@playwright/test";

export const test = base.extend({
  // custom fixtures here
});

export { expect } from "@playwright/test";