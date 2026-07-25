import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { POST as issueTicketRoute } from "../ticket/route";
import { hashHtmlPayload, issuePdfTicket, verifyTicketEnvelope } from "@/lib/server/pdf-access";

describe("PDF Render Access Policy & Capability Fuzzing (W25-C)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("PDF_REMOTE_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Ticket Issuer Route (/api/pdf/ticket)", () => {
    it("returns 404 when remote PDF rendering is disabled (default OFF)", async () => {
      vi.stubEnv("PDF_REMOTE_ENABLED", "false");
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Test</body></html>");
      const req = new Request("http://localhost/api/pdf/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlHash }),
      });
      const res = await issueTicketRoute(req);
      expect(res.status).toBe(404);
    });

    it("issues a valid ticket when given a valid htmlHash (dev anonymous issuer)", async () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Test</body></html>");
      const req = new Request("http://localhost/api/pdf/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlHash }),
      });

      const res = await issueTicketRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.ticket).toBeDefined();
      expect(typeof data.ticket).toBe("string");
      expect(data.expiresAt).toBeGreaterThan(Date.now());
    });

    it("rejects anonymous issuance in production when no trusted issuer mode is configured", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Prod</body></html>");
      const req = new Request("http://localhost/api/pdf/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlHash }),
      });
      const res = await issueTicketRoute(req);
      expect(res.status).toBe(403);
    });

    it("requires X-Verified-Identity when PDF_TICKET_TRUSTED_ISSUER_MODE=upstream-identity", async () => {
      vi.stubEnv("PDF_TICKET_TRUSTED_ISSUER_MODE", "upstream-identity");
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Test</body></html>");
      const withoutIdentity = await issueTicketRoute(new Request("http://localhost/api/pdf/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlHash }),
      }));
      expect(withoutIdentity.status).toBe(403);

      const withIdentity = await issueTicketRoute(new Request("http://localhost/api/pdf/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-verified-identity": "user-123" },
        body: JSON.stringify({ htmlHash }),
      }));
      expect(withIdentity.status).toBe(200);
    });

    it("rejects cross-site ticket requests from browser clients with 403", async () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Cross Site</body></html>");
      const req = new Request("http://localhost/api/pdf/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "sec-fetch-site": "cross-site",
        },
        body: JSON.stringify({ htmlHash }),
      });

      const res = await issueTicketRoute(req);
      expect(res.status).toBe(403);
    });
  });

  describe("Ticket Envelope Verification Logic", () => {
    it("accepts a valid ticket envelope and binds the subject", () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Hello</body></html>");
      const ticket = issuePdfTicket(htmlHash, "user-123");

      const result = verifyTicketEnvelope(ticket);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.sub).toBe("user-123");
        expect(result.payload.htmlHash).toBe(htmlHash);
      }
    });

    it("rejects expired tickets", () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Expired</body></html>");
      const expiredTicket = issuePdfTicket(htmlHash, "anonymous", -10); // Expired 10 seconds ago

      const result = verifyTicketEnvelope(expiredTicket);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.code).toBe("EXPIRED_TICKET");
      }
    });

    it("rejects a ticket signed with a different secret version", () => {
      vi.stubEnv("PDF_TICKET_SECRET", "a-dedicated-ticket-secret-value");
      vi.stubEnv("PDF_TICKET_SECRET_VERSION", "v1");
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Rotate</body></html>");
      const ticket = issuePdfTicket(htmlHash, "anonymous");

      vi.stubEnv("PDF_TICKET_SECRET_VERSION", "v2");
      const result = verifyTicketEnvelope(ticket);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.code).toBe("SECRET_VERSION_MISMATCH");
      }
    });

    it("rejects a tampered signature", () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Tamper</body></html>");
      const ticket = issuePdfTicket(htmlHash, "anonymous");
      const tampered = `${ticket.slice(0, -4)}AAAA`;
      const result = verifyTicketEnvelope(tampered);
      expect(result.valid).toBe(false);
    });

    it("rejects malformed ticket strings without throwing", () => {
      for (const bad of ["", "not-a-ticket", "a.b", "a.b.c.d", null, undefined]) {
        const result = verifyTicketEnvelope(bad as string | null | undefined);
        expect(result.valid).toBe(false);
      }
    });
  });
});
