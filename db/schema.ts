import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["advisor", "student"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cohorts = sqliteTable("cohorts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  course: text("course").notNull(),
  term: text("term").notNull(),
  advisorEmail: text("advisor_email").notNull(),
  joinCode: text("join_code").notNull().unique(),
  chapterDays: integer("chapter_days").notNull().default(15),
  weeklyLimit: integer("weekly_limit").notNull().default(6),
  absentDays: integer("absent_days").notNull().default(15),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cohortId: text("cohort_id").notNull(),
  studentEmail: text("student_email").notNull(),
  studentNumber: text("student_number"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("enrollment_cohort_student_uq").on(table.cohortId, table.studentEmail)]);

export const tccs = sqliteTable("tccs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cohortId: text("cohort_id").notNull(),
  studentEmail: text("student_email").notNull(),
  theme: text("theme").notNull().default("Tema em definição"),
  area: text("area").notNull().default("Direito Constitucional"),
  currentStage: text("current_stage").notNull().default("Marco 1"),
  progress: integer("progress").notNull().default(10),
  lastContactAt: text("last_contact_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("tcc_cohort_student_uq").on(table.cohortId, table.studentEmail)]);

export const deliveries = sqliteTable("deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tccId: integer("tcc_id").notNull(),
  kind: text("kind").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("Pendente"),
  dueAt: text("due_at"),
  fileKey: text("file_key"),
  fileName: text("file_name"),
  studentNote: text("student_note"),
  advisorNote: text("advisor_note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
}, (table) => [uniqueIndex("delivery_tcc_kind_version_uq").on(table.tccId, table.kind, table.version)]);

export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cohortId: text("cohort_id").notNull(),
  studentEmail: text("student_email").notNull(),
  weekKey: text("week_key").notNull(),
  weeklyPosition: integer("weekly_position").notNull(),
  startsAt: text("starts_at").notNull(),
  mode: text("mode").notNull().default("presencial"),
  subject: text("subject").notNull().default("Orientação de TCC"),
  status: text("status").notNull().default("confirmado"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("appointment_student_week_uq").on(table.studentEmail, table.weekKey),
  uniqueIndex("appointment_week_position_uq").on(table.cohortId, table.weekKey, table.weeklyPosition),
]);

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tccId: integer("tcc_id").notNull(),
  authorEmail: text("author_email").notNull(),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  topic: text("topic").notNull().default("Orientações gerais"),
  body: text("body").notNull(),
  fileKey: text("file_key"),
  fileName: text("file_name"),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const references = sqliteTable("references", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tccId: integer("tcc_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  note: text("note"),
  topic: text("topic").notNull().default("Orientações gerais"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
