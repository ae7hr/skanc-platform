import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const workspace = sqliteTable("workspace", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull().default(0),
  mutation: text("mutation").notNull().default(""),
});
export const members = sqliteTable("members", {
  email: text("email").primaryKey(),
  role: text("role").notNull(),
  department: text("department").notNull().default(""),
  employeeId: text("employee_id").notNull().default(""),
  active: integer("active").notNull().default(1),
});
export const audit = sqliteTable("audit", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull(),
});
