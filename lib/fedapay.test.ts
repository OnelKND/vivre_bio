import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { verifyFedapaySignature, parseFedapayWebhookEvent } from "./fedapay";

const SECRET = "test_webhook_secret";

function signPayload(rawBody: string, timestamp: number): string {
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `t=${timestamp},s=${signature}`;
}

describe("verifyFedapaySignature", () => {
  const originalSecret = process.env.FEDAPAY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.FEDAPAY_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.FEDAPAY_WEBHOOK_SECRET = originalSecret;
  });

  it("accepte une signature valide", () => {
    const body = '{"name":"transaction.approved"}';
    const header = signPayload(body, Math.floor(Date.now() / 1000));
    expect(verifyFedapaySignature(body, header)).toBe(true);
  });

  it("rejette une signature invalide", () => {
    const body = '{"name":"transaction.approved"}';
    expect(verifyFedapaySignature(body, "t=123,s=deadbeef")).toBe(false);
  });

  it("rejette un header absent", () => {
    expect(verifyFedapaySignature('{"name":"x"}', null)).toBe(false);
  });

  it("rejette si le secret n'est pas configuré", () => {
    delete process.env.FEDAPAY_WEBHOOK_SECRET;
    const body = '{"name":"transaction.approved"}';
    const header = signPayload(body, Math.floor(Date.now() / 1000));
    expect(verifyFedapaySignature(body, header)).toBe(false);
  });
});

describe("parseFedapayWebhookEvent", () => {
  it("parse un événement valide", () => {
    const event = parseFedapayWebhookEvent(
      JSON.stringify({ name: "transaction.approved", entity: { id: 42, status: "approved" } })
    );
    expect(event).toEqual({ name: "transaction.approved", entity: { id: 42, status: "approved" } });
  });

  it("retourne null pour un JSON invalide", () => {
    expect(parseFedapayWebhookEvent("pas du json")).toBeNull();
  });

  it("retourne null si la structure attendue est absente", () => {
    expect(parseFedapayWebhookEvent(JSON.stringify({ foo: "bar" }))).toBeNull();
  });
});
