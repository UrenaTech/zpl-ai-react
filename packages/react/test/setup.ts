import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:barcode")
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn()
});

afterEach(cleanup);
