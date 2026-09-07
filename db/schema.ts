import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Schema Drizzle — Fase 1 + Fase 2.
 * A DDL oficial com RLS está em db/migrations/0001_init.sql.
 * Este schema espelha as tabelas para a app; RLS é aplicado na BD.
 */

const base = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const schools = pgTable("schools", {
  ...base,
  name: text("name").notNull(),
  timezone: text("timezone").default("Europe/Lisbon").notNull(),
  activeSchoolYearId: uuid("active_school_year_id"),
});

export const schoolYears = pgTable("school_years", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  isSystemRole: boolean("is_system_role").default(false).notNull(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull(),
    permissionId: uuid("permission_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const userRoles = pgTable(
  "user_roles",
  {
    profileId: uuid("profile_id").notNull(),
    roleId: uuid("role_id").notNull(),
    grantedBy: uuid("granted_by"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.roleId] })]
);

export const students = pgTable("students", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  studentNumber: text("student_number").notNull(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  className: text("class_name").notNull(),
  schoolYearId: uuid("school_year_id"),
  active: boolean("active").default(true).notNull(),
  createdBy: uuid("created_by"),
});

export const classDirectorAssignments = pgTable("class_director_assignments", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  profileId: uuid("profile_id").notNull(),
  className: text("class_name").notNull(),
  schoolYearId: uuid("school_year_id"),
  startsOn: text("starts_on"),
  endsOn: text("ends_on"),
});

export const guardians = pgTable("guardians", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferredChannel: text("preferred_channel"),
});

export const studentGuardians = pgTable(
  "student_guardians",
  {
    studentId: uuid("student_id").notNull(),
    guardianId: uuid("guardian_id").notNull(),
    relationship: text("relationship").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (t) => [primaryKey({ columns: [t.studentId, t.guardianId] })]
);

export const referrals = pgTable("referrals", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  submittedBy: uuid("submitted_by").notNull(),
  category: text("category").notNull(),
  factualDescription: text("factual_description").notNull(),
  urgency: text("urgency").default("normal").notNull(),
  status: text("status").default("RECEBIDA").notNull(),
  triagedBy: uuid("triaged_by"),
  triagedAt: timestamp("triaged_at", { withTimezone: true }),
  outcome: text("outcome"),
  safeResponseToReferrer: text("safe_response_to_referrer"),
  contactForClarification: text("contact_for_clarification"),
});

export const cases = pgTable("cases", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  studentId: uuid("student_id").notNull(),
  sourceReferralId: uuid("source_referral_id"),
  status: text("status").default("ATIVO").notNull(),
  mainReason: text("main_reason").notNull(),
  priority: text("priority").default("normal").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closeReason: text("close_reason"),
  closeSummary: text("close_summary"),
  forwardDestination: text("forward_destination"),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
});

export const caseAssignments = pgTable(
  "case_assignments",
  {
    caseId: uuid("case_id").notNull(),
    profileId: uuid("profile_id").notNull(),
    roleInCase: text("role_in_case").default("responsavel").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.caseId, t.profileId] })]
);

export const appointments = pgTable("appointments", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  caseId: uuid("case_id").notNull(),
  type: text("type").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  room: text("room"),
  status: text("status").default("SCHEDULED").notNull(),
  ownerId: uuid("owner_id").notNull(),
  summary: text("summary"),
});

export const caseEvents = pgTable("case_events", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  caseId: uuid("case_id").notNull(),
  eventType: text("event_type").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  summary: text("summary").notNull(),
  visibility: text("visibility").default("TEAM").notNull(),
  createdBy: uuid("created_by"),
});

export const clinicalNotes = pgTable("clinical_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseEventId: uuid("case_event_id").notNull().unique(),
  encryptedContent: text("encrypted_content").notNull(),
  accessLevel: text("access_level").default("PSYCHOLOGIST_ONLY").notNull(),
  authorId: uuid("author_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  caseId: uuid("case_id"),
  title: text("title").notNull(),
  assigneeId: uuid("assignee_id"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  priority: text("priority").default("normal").notNull(),
  status: text("status").default("PENDENTE").notNull(),
});

export const documents = pgTable("documents", {
  ...base,
  schoolId: uuid("school_id").notNull(),
  caseId: uuid("case_id"),
  storagePath: text("storage_path").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  visibility: text("visibility").default("TEAM").notNull(),
  uploadedBy: uuid("uploaded_by"),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull(),
  type: text("type").notNull(),
  /** Texto seguro: nunca inclui conteúdo clínico, nomes de salas ou motivos. */
  safeText: text("safe_text").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id"),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadataJson: jsonb("metadata_json"),
  ipHash: text("ip_hash"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});
