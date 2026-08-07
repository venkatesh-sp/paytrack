import { relations } from "drizzle-orm";
import { account, session, user } from "./auth-schema";
import { lendingContact, lendingTransaction } from "./lending";
import { notificationPreference, reminderLog } from "./notifications";
import { monthlyPayable } from "./payables";
import { paymentHistory } from "./payment-history";
import { trackingItem } from "./tracking-items";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  trackingItems: many(trackingItem),
  monthlyPayables: many(monthlyPayable),
  paymentHistory: many(paymentHistory),
  notificationPreference: one(notificationPreference, {
    fields: [user.id],
    references: [notificationPreference.userId],
  }),
  reminderLogs: many(reminderLog),
  lendingContacts: many(lendingContact),
  lendingTransactions: many(lendingTransaction),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const trackingItemRelations = relations(trackingItem, ({ one, many }) => ({
  user: one(user, { fields: [trackingItem.userId], references: [user.id] }),
  monthlyPayables: many(monthlyPayable),
  paymentHistory: many(paymentHistory),
}));

export const monthlyPayableRelations = relations(monthlyPayable, ({ one, many }) => ({
  user: one(user, { fields: [monthlyPayable.userId], references: [user.id] }),
  trackingItem: one(trackingItem, {
    fields: [monthlyPayable.trackingItemId],
    references: [trackingItem.id],
  }),
  payments: many(paymentHistory),
  reminderLogs: many(reminderLog),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  user: one(user, { fields: [paymentHistory.userId], references: [user.id] }),
  monthlyPayable: one(monthlyPayable, {
    fields: [paymentHistory.monthlyPayableId],
    references: [monthlyPayable.id],
  }),
  trackingItem: one(trackingItem, {
    fields: [paymentHistory.trackingItemId],
    references: [trackingItem.id],
  }),
}));

export const notificationPreferenceRelations = relations(
  notificationPreference,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreference.userId],
      references: [user.id],
    }),
  }),
);

export const reminderLogRelations = relations(reminderLog, ({ one }) => ({
  user: one(user, { fields: [reminderLog.userId], references: [user.id] }),
  monthlyPayable: one(monthlyPayable, {
    fields: [reminderLog.monthlyPayableId],
    references: [monthlyPayable.id],
  }),
}));

export const lendingContactRelations = relations(lendingContact, ({ one, many }) => ({
  user: one(user, { fields: [lendingContact.userId], references: [user.id] }),
  transactions: many(lendingTransaction),
}));

export const lendingTransactionRelations = relations(lendingTransaction, ({ one }) => ({
  user: one(user, { fields: [lendingTransaction.userId], references: [user.id] }),
  contact: one(lendingContact, {
    fields: [lendingTransaction.contactId],
    references: [lendingContact.id],
  }),
}));
