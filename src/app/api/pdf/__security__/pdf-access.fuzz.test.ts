import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST as issueTicketRoute } from "../ticket/route";
import { hashHtmlPayload, issuePdfTicket, verifyPdfTicket } from "@/lib/server/pdf-access";

describe("PDF Render Access Policy & Capability Fuzzing (W25-C)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Ticket Issuer Route (/api/pdf/ticket)", () => {
    it("issues a valid ticket when given a valid htmlHash", async () => {
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

  describe("Ticket Verification Logic", () => {
    it("accepts valid ticket for exact htmlHash match", () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Hello</body></html>");
      const ticket = issuePdfTicket(htmlHash);

      const result = verifyPdfTicket(ticket, htmlHash);
      expect(result.valid).toBe(true);
    });

    it("rejects ticket if htmlHash does not match content", () => {
      const hashA = hashHtmlPayload("<!doctype html><html><body>Document A</body></html>");
      const hashB = hashHtmlPayload("<!doctype html><html><body>Document B</body></html>");
      const ticketForA = issuePdfTicket(hashA);

      const result = verifyPdfTicket(ticketForA, hashB);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.code).toBe("HASH_MISMATCH");
      }
    });

    it("rejects expired tickets", () => {
      const htmlHash = hashHtmlPayload("<!doctype html><html><body>Expired</body></html>");
      const expiredTicket = issuePdfTicket(htmlHash, -10); // Expired 10 seconds ago

      const result = verifyPdfTicket(expiredTicket, htmlHash);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.code).toBe("EXPIRED_TICKET");
      }
    });
  });
});
