import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock import.meta.glob for convex-test compatibility
type GlobalThisWithImport = typeof globalThis & {
  import?: {
    meta: {
      glob: ReturnType<typeof vi.fn>;
    };
  };
};

const globalThisWithImport = globalThis as GlobalThisWithImport;

if (typeof globalThisWithImport.import === 'undefined') {
  globalThisWithImport.import = {
    meta: {
      glob: vi.fn(() => ({}))
    }
  };
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
} as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as typeof ResizeObserver;
