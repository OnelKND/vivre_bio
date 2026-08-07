import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

function uniqueKey(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows calls up to the limit", () => {
    const key = uniqueKey("under-limit");
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks calls once the limit is exceeded", () => {
    const key = uniqueKey("over-limit");
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("resets once the time window elapses", () => {
    vi.useFakeTimers();
    const key = uniqueKey("reset-window");
    expect(checkRateLimit(key, 1, 1000)).toBe(true);
    expect(checkRateLimit(key, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(key, 1, 1000)).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const keyA = uniqueKey("a");
    const keyB = uniqueKey("b");
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(true);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
  });
});
