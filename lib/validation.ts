import { z } from "zod";

export const referralCategoryEnum = z.enum([
  "bem_estar_emocional",
  "absentismo",
  "comportamento",
  "dificuldades_aprendizagem",
  "orientacao_vocacional",
  "integracao",
  "situacao_familiar",
  "pedido_intervencao_turma",
  "outro",
]);

export const referralUrgencyEnum = z.enum(["normal", "prioritaria", "urgente_operacional"]);

export const referralSchema = z.object({
  studentId: z.string().uuid("Selecione um aluno da sua turma."),
  category: referralCategoryEnum,
  factualDescription: z
    .string()
    .min(20, "Descreva os factos observados (mínimo 20 caracteres).")
    .max(4000, "Descrição demasiado longa (máximo 4000 caracteres)."),
  urgency: referralUrgencyEnum.default("normal"),
  contactForClarification: z.string().max(200).optional().default(""),
});

export type ReferralInput = z.infer<typeof referralSchema>;

export const triageSchema = z.object({
  referralId: z.string().uuid(),
  decision: z.enum(["accept", "request_info", "forward", "close"]),
  note: z.string().max(2000).default(""),
  safeResponseToReferrer: z.string().max(1000).default(""),
  priority: z.enum(["baixa", "normal", "alta"]).default("normal"),
  forwardDestination: z.string().max(300).optional().default(""),
  closeReason: z.string().max(500).optional().default(""),
});

export type TriageInput = z.infer<typeof triageSchema>;

export const studentSchema = z.object({
  studentNumber: z.string().min(1, "Número de aluno obrigatório.").max(50),
  fullName: z.string().min(3, "Nome completo obrigatório.").max(200),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data no formato AAAA-MM-DD."),
  className: z.string().min(1, "Turma obrigatória.").max(20),
});

export type StudentInput = z.infer<typeof studentSchema>;

export const appointmentSchema = z
  .object({
    caseId: z.string().uuid(),
    type: z.enum(["individual", "reuniao_ee", "intervencao_turma"]),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    room: z.string().max(50).default(""),
    summary: z.string().max(2000).default(""),
  })
  .refine((v) => new Date(v.startsAt) < new Date(v.endsAt), {
    message: "O fim deve ser posterior ao início.",
    path: ["endsAt"],
  });

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const taskSchema = z.object({
  title: z.string().min(3, "Título obrigatório.").max(200),
  caseId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  priority: z.enum(["baixa", "normal", "alta"]).default("normal"),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const createUserSchema = z.object({
  name: z.string().min(3, "Nome obrigatório.").max(200),
  email: z.string().email("Email inválido.").max(200),
  password: z.string().min(10, "Use pelo menos 10 caracteres.").max(200),
  roleCode: z.enum(["SPO_PSYCHOLOGIST", "GUIDANCE_COUNSELOR", "TEACHER", "ADMINISTRATOR"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const ALLOWED_UPLOAD_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function isAllowedUpload(mime: string, sizeBytes: number): boolean {
  return (ALLOWED_UPLOAD_MIME as readonly string[]).includes(mime) && sizeBytes <= MAX_UPLOAD_BYTES;
}
