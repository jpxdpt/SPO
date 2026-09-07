import { describe, expect, it } from "vitest";
import {
  canTransitionAppointment,
  canTransitionReferral,
  hasPermission,
  isAdministrator,
  isPsychologist,
  isReferrer,
  SEED_ROLE_PERMISSIONS,
  suppressSmallCount,
  toDirectorSafeStatus,
} from "@/lib/permissions";

describe("RBAC seed (4 perfis)", () => {
  it("psicólogo tem acesso clínico completo, sem gestão técnica", () => {
    const p = SEED_ROLE_PERMISSIONS.SPO_PSYCHOLOGIST;
    expect(hasPermission(p, "cases.read")).toBe(true);
    expect(hasPermission(p, "referrals.triage")).toBe(true);
    expect(hasPermission(p, "orientation.write")).toBe(true);
    expect(hasPermission(p, "users.manage")).toBe(false);
    expect(hasPermission(p, "roles.manage")).toBe(false);
    expect(hasPermission(p, "settings.manage")).toBe(false);
  });

  it("orientador vê alunos e orientação, sem casos nem triagem", () => {
    const p = SEED_ROLE_PERMISSIONS.GUIDANCE_COUNSELOR;
    expect(hasPermission(p, "students.read")).toBe(true);
    expect(hasPermission(p, "orientation.write")).toBe(true);
    expect(hasPermission(p, "referrals.create")).toBe(true);
    expect(hasPermission(p, "cases.read")).toBe(false);
    expect(hasPermission(p, "referrals.triage")).toBe(false);
    expect(hasPermission(p, "appointments.read")).toBe(false);
    expect(hasPermission(p, "documents.read")).toBe(false);
  });

  it("professor sinaliza e vê estados próprios, sem clínico", () => {
    const p = SEED_ROLE_PERMISSIONS.TEACHER;
    expect(hasPermission(p, "referrals.create")).toBe(true);
    expect(hasPermission(p, "cases.read")).toBe(false);
    expect(hasPermission(p, "orientation.read")).toBe(false);
  });

  it("administrador gere a plataforma, sem acesso clínico", () => {
    const p = SEED_ROLE_PERMISSIONS.ADMINISTRATOR;
    expect(hasPermission(p, "users.manage")).toBe(true);
    expect(hasPermission(p, "roles.manage")).toBe(true);
    expect(hasPermission(p, "settings.manage")).toBe(true);
    expect(hasPermission(p, "audit.read")).toBe(true);
    expect(hasPermission(p, "cases.read")).toBe(false);
    expect(hasPermission(p, "students.read")).toBe(false);
    expect(hasPermission(p, "referrals.read.all")).toBe(false);
    expect(hasPermission(p, "appointments.read")).toBe(false);
  });

  it("papel personalizado começa sem permissões", () => {
    expect(hasPermission([], "students.read")).toBe(false);
  });

  it("helpers de perfil", () => {
    expect(isPsychologist(["SPO_PSYCHOLOGIST"])).toBe(true);
    expect(isPsychologist(["ADMINISTRATOR"])).toBe(false);
    expect(isAdministrator(["ADMINISTRATOR"])).toBe(true);
    expect(isAdministrator(["SPO_PSYCHOLOGIST"])).toBe(false);
    expect(isReferrer(["TEACHER"])).toBe(true);
    expect(isReferrer(["GUIDANCE_COUNSELOR"])).toBe(true);
    expect(isReferrer(["ADMINISTRATOR"])).toBe(false);
  });
});

describe("transições de sinalização", () => {
  it("aceita fluxo válido e rejeita inválido", () => {
    expect(canTransitionReferral("RECEBIDA", "EM_ANALISE")).toBe(true);
    expect(canTransitionReferral("EM_ANALISE", "SPO_ACOMPANHAMENTO")).toBe(true);
    expect(canTransitionReferral("RECEBIDA", "SPO_ACOMPANHAMENTO")).toBe(false);
    expect(canTransitionReferral("ENCERRADA", "EM_ANALISE")).toBe(false);
  });

  it("mapeia estados internos para estados seguros do docente", () => {
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
