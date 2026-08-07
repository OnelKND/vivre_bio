import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAdminPassword, createSessionToken, isSessionTokenValid } from "./admin-auth";

describe("admin-auth", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "test-secret-for-vitest");
    vi.stubEnv("ADMIN_PASSWORD", "correct-horse-battery-staple");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  describe("checkAdminPassword", () => {
    it("accepts the correct password", () => {
      expect(checkAdminPassword("correct-horse-battery-staple")).toBe(true);
    });

    it("rejects an incorrect password", () => {
      expect(checkAdminPassword("wrong-password")).toBe(false);
    });

    it("rejects any password when ADMIN_PASSWORD is not configured", () => {
      vi.stubEnv("ADMIN_PASSWORD", "");
      expect(checkAdminPassword("anything")).toBe(false);
    });
  });

  describe("session tokens", () => {
    it("validates a freshly created token", () => {
      const token = createSessionToken();
      expect(isSessionTokenValid(token)).toBe(true);
    });

    it("rejects a tampered signature", () => {
      const token = createSessionToken();
      const [issuedAt] = token.split(".");
      expect(isSessionTokenValid(`${issuedAt}.deadbeef`)).toBe(false);
    });

    it("rejects malformed or missing tokens", () => {
      expect(isSessionTokenValid(undefined)).toBe(false);
      expect(isSessionTokenValid(null)).toBe(false);
      expect(isSessionTokenValid("")).toBe(false);
      expect(isSessionTokenValid("no-dot-separator")).toBe(false);
    });

    it("rejects a token signed with a different secret", () => {
      const token = createSessionToken();
      vi.stubEnv("SESSION_SECRET", "a-different-secret");
      expect(isSessionTokenValid(token)).toBe(false);
    });

    it("rejects an expired token", () => {
      vi.useFakeTimers();
      const token = createSessionToken();
      vi.advanceTimersByTime(1000 * 60 * 60 * 24 * 15); // 15 jours > 14 jours max
      expect(isSessionTokenValid(token)).toBe(false);
    });
  });
});
