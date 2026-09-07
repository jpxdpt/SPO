/**
 * Códigos de permissão. Novos papéis personalizados começam SEM permissões;
 * o acesso a dados de alunos exige configuração explícita + auditoria.
 */
export const PERMISSIONS = {
  STUDENTS_READ: "students.read",
  STUDENTS_WRITE: "students.write",
  REFERRALS_CREATE: "referrals.create",
  REFERRALS_READ_OWN: "referrals.read.own",
  REFERRALS_READ_ALL: "referrals.read.all",
  REFERRALS_TRIAGE: "referrals.triage",
  CASES_READ: "cases.read",
  CASES_WRITE: "cases.write",
  CASES_ASSIGN: "cases.assign",
  APPOINTMENTS_READ: "appointments.read",
  APPOINTMENTS_WRITE: "appointments.write",
  TASKS_READ: "tasks.read",
  TASKS_WRITE: "tasks.write",
  DOCUMENTS_READ: "documents.read",
  DOCUMENTS_WRITE: "documents.write",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  AUDIT_READ: "audit.read",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: { code: PermissionCode; description: string }[] = [
  { code: PERMISSIONS.STUDENTS_READ, description: "Consultar alunos (âmbito do papel)" },
  { code: PERMISSIONS.STUDENTS_WRITE, description: "Criar/editar alunos" },
  { code: PERMISSIONS.REFERRALS_CREATE, description: "Submeter sinalizações" },
  { code: PERMISSIONS.REFERRALS_READ_OWN, description: "Ver as próprias sinalizações" },
  { code: PERMISSIONS.REFERRALS_READ_ALL, description: "Ver todas as sinalizações (SPO)" },
  { code: PERMISSIONS.REFERRALS_TRIAGE, description: "Triar sinalizações (SPO)" },
  { code: PERMISSIONS.CASES_READ, description: "Consultar casos e cronologia" },
  { code: PERMISSIONS.CASES_WRITE, description: "Criar/editar/encerrar casos" },
  { code: PERMISSIONS.CASES_ASSIGN, description: "Atribuir equipa ao caso" },
  { code: PERMISSIONS.APPOINTMENTS_READ, description: "Consultar agenda" },
  { code: PERMISSIONS.APPOINTMENTS_WRITE, description: "Criar/editar atendimentos" },
  { code: PERMISSIONS.TASKS_READ, description: "Consultar tarefas" },
  { code: PERMISSIONS.TASKS_WRITE, description: "Criar/editar tarefas" },
  { code: PERMISSIONS.DOCUMENTS_READ, description: "Consultar documentos" },
  { code: PERMISSIONS.DOCUMENTS_WRITE, description: "Carregar documentos" },
  { code: PERMISSIONS.USERS_MANAGE, description: "Gerir utilizadores" },
  { code: PERMISSIONS.ROLES_MANAGE, description: "Gerir papéis e permissões" },
  { code: PERMISSIONS.AUDIT_READ, description: "Consultar auditoria" },
  { code: PERMISSIONS.SETTINGS_MANAGE, description: "Gerir definições SPO" },
];

export const SYSTEM_ROLES = {
  PSYCHOLOGIST_ADMIN: "PSYCHOLOGIST_ADMIN",
  CLASS_DIRECTOR: "CLASS_DIRECTOR",
} as const;

/** Mapa de permissões pré-carregado (seed). Papel personalizado = conjunto vazio. */
export const SEED_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  [SYSTEM_ROLES.PSYCHOLOGIST_ADMIN]: Object.values(PERMISSIONS),
  [SYSTEM_ROLES.CLASS_DIRECTOR]: [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.REFERRALS_CREATE,
    PERMISSIONS.REFERRALS_READ_OWN,
    PERMISSIONS.TASKS_READ,
  ],
};

export function hasPermission(userPermissions: string[], code: PermissionCode): boolean {
  return userPermissions.includes(code);
}

export function isPsychAdmin(roleCodes: string[]): boolean {
  return roleCodes.includes(SYSTEM_ROLES.PSYCHOLOGIST_ADMIN);
}

/**
 * Estados de sinalização visíveis ao diretor de turma.
 * Internamente existem PENDENTE_INFO / ENCAMINHADA, mas o diretor vê
 * apenas o subconjunto seguro.
 */
export const DIRECTOR_SAFE_REFERRAL_STATUS = [
  "RECEBIDA",
  "EM_ANALISE",
  "SPO_ACOMPANHAMENTO",
  "ENCERRADA",
] as const;

export type DirectorSafeStatus = (typeof DIRECTOR_SAFE_REFERRAL_STATUS)[number];

/** Mapeia estado interno -> estado seguro para o diretor. */
export function toDirectorSafeStatus(internal: string): DirectorSafeStatus {
  switch (internal) {
    case "RECEBIDA":
      return "RECEBIDA";
    case "EM_ANALISE":
    case "PENDENTE_INFO":
      return "EM_ANALISE";
    case "SPO_ACOMPANHAMENTO":
    case "ENCAMINHADA":
      return "SPO_ACOMPANHAMENTO";
    case "ENCERRADA":
    case "NAO_PROSSEGUIR":
      return "ENCERRADA";
    default:
      return "EM_ANALISE";
  }
}

/** Transições válidas de sinalização (triagem SPO). Testado em tests/unit. */
const REFERRAL_TRANSITIONS: Record<string, string[]> = {
  RECEBIDA: ["EM_ANALISE", "ENCERRADA"],
  EM_ANALISE: ["SPO_ACOMPANHAMENTO", "PENDENTE_INFO", "ENCAMINHADA", "ENCERRADA"],
  PENDENTE_INFO: ["EM_ANALISE", "SPO_ACOMPANHAMENTO", "ENCERRADA"],
  SPO_ACOMPANHAMENTO: ["ENCERRADA"],
  ENCAMINHADA: ["ENCERRADA"],
  ENCERRADA: [],
  NAO_PROSSEGUIR: [],
};

export function canTransitionReferral(from: string, to: string): boolean {
  return REFERRAL_TRANSITIONS[from]?.includes(to) ?? false;
}

const APPOINTMENT_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ["COMPLETED", "NO_SHOW", "CANCELLED", "RESCHEDULED"],
  RESCHEDULED: ["SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: ["SCHEDULED"],
  CANCELLED: [],
};

export function canTransitionAppointment(from: string, to: string): boolean {
  return APPOINTMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Supressão de grupos pequenos: valores < 5 não são partilhados
 * fora da equipa SPO (reduz reidentificação).
 */
export function suppressSmallCount(n: number): number | null {
  return n < 5 ? null : n;
}
