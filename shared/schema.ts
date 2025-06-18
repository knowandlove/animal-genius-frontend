import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for teachers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  schoolOrganization: text("school_organization").notNull(),
  roleTitle: text("role_title"),
  howHeardAbout: text("how_heard_about"),
  personalityAnimal: varchar("personality_animal", { length: 50 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  teacherId: integer("teacher_id").notNull(),
  iconEmoji: text("icon_emoji").default("📚"),
  iconColor: text("icon_color").default("#c5d49f"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quiz submissions table (extended for currency system)
export const quizSubmissions = pgTable("quiz_submissions", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull(),
  studentName: text("student_name").notNull(),
  gradeLevel: text("grade_level"),
  answers: jsonb("answers").notNull(), // Array of answer objects
  personalityType: varchar("personality_type", { length: 4 }).notNull(),
  animalType: text("animal_type").notNull(),
  animalGenius: text("animal_genius").default("Feeler").notNull(),
  scores: jsonb("scores").notNull(), // E/I, S/N, T/F, J/P scores
  learningStyle: text("learning_style").notNull(),
  learningScores: jsonb("learning_scores").notNull(), // Visual, Auditory, Kinesthetic, Reading/Writing scores
  completedAt: timestamp("completed_at").defaultNow(),
  // Currency system extensions
  passportCode: varchar("passport_code", { length: 8 }).unique(),
  currencyBalance: integer("currency_balance").default(0).notNull(),
  avatarData: jsonb("avatar_data").default('{}').notNull(),
  roomData: jsonb("room_data").default('{}').notNull(),
});

// Lesson progress tracking
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  lessonId: integer("lesson_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Admin logs table
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  targetUserId: integer("target_user_id").references(() => users.id),
  targetClassId: integer("target_class_id").references(() => classes.id),
  targetSubmissionId: integer("target_submission_id").references(() => quizSubmissions.id),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Currency system tables
export const currencyTransactions = pgTable("currency_transactions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => quizSubmissions.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  reason: varchar("reason", { length: 255 }),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // 'teacher_gift', 'quiz_complete', 'achievement', 'purchase'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  isOpen: boolean("is_open").default(false).notNull(),
  openedAt: timestamp("opened_at"),
  closesAt: timestamp("closes_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchaseRequests = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => quizSubmissions.id).notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'avatar_hat', 'room_furniture', etc.
  itemId: varchar("item_id", { length: 50 }).notNull(), // 'wizard_hat', 'bookshelf', etc.
  cost: integer("cost").notNull(),
  status: varchar("status", { length: 20 }).default('pending').notNull(), // 'pending', 'approved', 'denied'
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes),
  lessonProgress: many(lessonProgress),
  currencyTransactions: many(currencyTransactions),
  processedPurchases: many(purchaseRequests),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  submissions: many(quizSubmissions),
  lessonProgress: many(lessonProgress),
  storeSettings: many(storeSettings),
}));

export const quizSubmissionsRelations = relations(quizSubmissions, ({ one, many }) => ({
  class: one(classes, {
    fields: [quizSubmissions.classId],
    references: [classes.id],
  }),
  currencyTransactions: many(currencyTransactions),
  purchaseRequests: many(purchaseRequests),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  teacher: one(users, {
    fields: [lessonProgress.teacherId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [lessonProgress.classId],
    references: [classes.id],
  }),
}));

// Currency system relations
export const currencyTransactionsRelations = relations(currencyTransactions, ({ one }) => ({
  student: one(quizSubmissions, {
    fields: [currencyTransactions.studentId],
    references: [quizSubmissions.id],
  }),
  teacher: one(users, {
    fields: [currencyTransactions.teacherId],
    references: [users.id],
  }),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  class: one(classes, {
    fields: [storeSettings.classId],
    references: [classes.id],
  }),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one }) => ({
  student: one(quizSubmissions, {
    fields: [purchaseRequests.studentId],
    references: [quizSubmissions.id],
  }),
  processedByUser: one(users, {
    fields: [purchaseRequests.processedBy],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const updateUserProfileSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  createdAt: true,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  code: true,
  createdAt: true,
});

export const insertQuizSubmissionSchema = createInsertSchema(quizSubmissions).omit({
  id: true,
  completedAt: true,
}).extend({
  learningScores: z.object({
    visual: z.number(),
    auditory: z.number(),
    kinesthetic: z.number(),
    readingWriting: z.number(),
  }),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({
  id: true,
  completedAt: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  timestamp: true,
});

// Currency system schemas
export const insertCurrencyTransactionSchema = createInsertSchema(currencyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSettingsSchema = createInsertSchema(storeSettings).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({
  id: true,
  requestedAt: true,
});

// Currency system validation schemas
export const giveCurrencySchema = z.object({
  studentId: z.number().positive(),
  amount: z.number().positive().max(1000), // Max 1000 coins per transaction
  reason: z.string().min(1).max(255),
});

export const purchaseRequestSchema = z.object({
  itemType: z.enum(['avatar_hat', 'avatar_accessory', 'room_furniture', 'room_decoration']),
  itemId: z.string().min(1).max(50),
  cost: z.number().positive().max(10000), // Max cost validation
});

// Avatar and room data schemas
export const avatarDataSchema = z.object({
  hat: z.string().optional(),
  accessory: z.string().optional(),
  color: z.string().optional(),
}).default({});

export const furnitureItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  x: z.number().min(0).max(3), // 4x4 grid
  y: z.number().min(0).max(3),
});

export const roomDataSchema = z.object({
  furniture: z.array(furnitureItemSchema).default([]),
  wallpaper: z.string().optional(),
  flooring: z.string().optional(),
}).default({ furniture: [] });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type InsertQuizSubmission = z.infer<typeof insertQuizSubmissionSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;

// Currency system types
export type CurrencyTransaction = typeof currencyTransactions.$inferSelect;
export type InsertCurrencyTransaction = z.infer<typeof insertCurrencyTransactionSchema>;
export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;

// Utility types
export type GiveCurrencyData = z.infer<typeof giveCurrencySchema>;
export type PurchaseRequestData = z.infer<typeof purchaseRequestSchema>;
export type AvatarData = z.infer<typeof avatarDataSchema>;
export type RoomData = z.infer<typeof roomDataSchema>;
