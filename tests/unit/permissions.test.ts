import { describe, expect, it } from "vitest";
import {
  canTransitionAppointment,
  canTransitionReferral,
  hasPermission,
  SEED_ROLE_PERMISSIONS,
  suppressSmallCount,
  toDirectorSafeStatus,
} from "@/lib/permissions";

describe("RBAC seed", () => {
  it("psicóloga tem acesso clínico; diretor não", () => {
    expect(hasPermission(SEED_ROLE_PERMISSIONS.PSYCHOLOGIST_ADMIN, "cases.read")).toBe(true);
    expect(hasPermission(SEED_ROLE_PERMISSIONS.CLASS_DIRECTOR, "cases.read")).toBe(false);
    expect(hasPermission(SEED_ROLE_PERMISSIONS.CLASS_DIRECTOR, "referrals.create")).toBe(true);
  });

  it("papel personalizado começa sem permissões", () => {
    expect(hasPermission([], "students.read")).toBe(false);
  });
});

describe("transições de sinalização", () => {
  it("aceita fluxo válido e rejeita inválido", () => {
    expect(canTransitionReferral("RECEBIDA", "EM_ANALISE")).toBe(true);
    expect(canTransitionReferral("EM_ANALISE", "SPO_ACOMPANHAMENTO")).toBe(true);
    expect(canTransitionReferral("RECEBIDA", "SPO_ACOMPANHAMENTO")).toBe(false);
    expect(canTransitionReferral("ENCERRADA", "EM_ANALISE")).toBe(false);
  });

  it("mapeia estados internos para estados seguros do diretor", () => {
    expect(toDirectorSafeStatus("PENDENTE_INFO")).toBe("EM_ANALISE");
    expect(toDirectorSafeStatus("ENCAMINHADA")).toBe("SPO_ACOMPANHAMENTO");
    expect(toDirectorSafeStatus("NAO_PROSSEGUIR")).toBe("ENCERRADA");
  });
});

describe("transições de atendimento", () => {
  it("concluir só a partir de agendado/reagendado", () => {
    expect(canTransitionAppointment("SCHEDULED", "COMPLETED")).toBe(true);
    expect(canTransitionAppointment("COMPLETED", "SCHEDULED")).toBe(false);
  });
});

describe("supressão de grupos pequenos", () => {
  it("suprime valores < 5", () => {
    expect(suppressSmallCount(4)).toBeNull();
    expect(suppressSmallCount(5)).toBe(5);
  });
});
