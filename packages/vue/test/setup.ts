import { afterEach, vi } from "vitest";

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: vi.fn(() => "blob:label")
});
Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: vi.fn()
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
