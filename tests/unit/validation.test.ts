import { describe, expect, it } from "vitest";
import { appointmentSchema, isAllowedUpload, referralSchema } from "@/lib/validation";
import { overlaps } from "@/lib/dates";

describe("validação de sinalização", () => {
  it("rejeita descrição curta", () => {
    const r = referralSchema.safeParse({
      studentId: "00000000-0000-0000-0000-000000000000",
      category: "absentismo",
      factualDescription: "curta",
      urgency: "normal",
    });
    expect(r.success).toBe(false);
  });

  it("aceita sinalização válida", () => {
    const r = referralSchema.safeParse({
      studentId: "00000000-0000-0000-0000-000000000000",
      category: "absentismo",
      factualDescription: "Aluno faltou 6 vezes nas últimas duas semanas sem justificação apresentada.",
      urgency: "normal",
    });
    expect(r.success).toBe(true);
  });
});

describe("conflitos de agenda", () => {
  it("deteta sobreposição", () => {
    const a1 = new Date("2026-09-10T10:00:00Z");
    const a2 = new Date("2026-09-10T11:00:00Z");
    expect(overlaps(a1, a2, new Date("2026-09-10T10:30:00Z"), new Date("2026-09-10T11:30:00Z"))).toBe(true);
    expect(overlaps(a1, a2, new Date("2026-09-10T11:00:00Z"), new Date("2026-09-10T12:00:00Z"))).toBe(false);
  });

  it("schema rejeita fim antes do início", () => {
    const r = appointmentSchema.safeParse({
      caseId: "00000000-0000-0000-0000-000000000000",
      type: "individual",
      startsAt: "2026-09-10T11:00:00.000Z",
      endsAt: "2026-09-10T10:00:00.000Z",
      room: "Gabinete 1",
    });
    expect(r.success).toBe(false);
  });
});

describe("uploads", () => {
  it("bloqueia executáveis e ficheiros grandes", () => {
    expect(isAllowedUpload("application/x-msdownload", 100)).toBe(false);
    expect(isAllowedUpload("application/pdf", 11 * 1024 * 1024)).toBe(false);
    expect(isAllowedUpload("application/pdf", 1024)).toBe(true);
  });
});
