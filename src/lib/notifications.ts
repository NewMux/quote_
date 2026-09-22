import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { requireOwnerId } from '../db/ownerId';

const PREFERENCE_KEY = 'overdue_reminders_enabled';

let enabledCache: boolean | null = null;

export async function isRemindersEnabled(): Promise<boolean> {
  if (enabledCache !== null) return enabledCache;
  const stored = await SecureStore.getItemAsync(PREFERENCE_KEY);
  enabledCache = stored === 'true';
  return enabledCache;
}

async function setRemindersEnabledFlag(enabled: boolean): Promise<void> {
  enabledCache = enabled;
  await SecureStore.setItemAsync(PREFERENCE_KEY, enabled ? 'true' : 'false');
}

/** Requests OS notification permission if needed, then schedules a reminder for every currently
 * open, unpaid invoice with a due date. Returns false (leaving reminders off) if permission is
 * denied — the caller should point the user at their device's system Settings in that case. */
export async function enableReminders(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    await setRemindersEnabledFlag(false);
    return false;
  }
  await setRemindersEnabledFlag(true);
  await refreshAllReminders();
  return true;
}

export async function disableReminders(): Promise<void> {
  await setRemindersEnabledFlag(false);
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Reminders fire the morning after the due date, at 9am local time — never "overdue as of
 * midnight," which would land at an unhelpful hour. If that moment has already passed (the
 * invoice is already overdue, e.g. reminders were just turned on), fire shortly instead of
 * silently skipping it. */
function reminderTriggerDate(dueDateIso: string): Date {
  const [year, month, day] = dueDateIso.split('-').map(Number);
  const trigger = new Date(year, month - 1, day + 1, 9, 0, 0);
  const now = new Date();
  return trigger > now ? trigger : new Date(now.getTime() + 5000);
}

/** Schedules (or reschedules) an overdue reminder for one invoice. Cancels any existing reminder
 * for it first, so this is safe to call any time a document's status or due date changes; a no-op
 * when reminders are off or the document has no due date. */
export async function scheduleOverdueReminder(document: {
  id: string;
  doc_number: string;
  due_date: string | null;
}): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(document.id).catch(() => {});
  if (!document.due_date || !(await isRemindersEnabled())) return;

  await Notifications.scheduleNotificationAsync({
    identifier: document.id,
    content: { title: 'Invoice overdue', body: `${document.doc_number} is now overdue.` },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTriggerDate(document.due_date),
    },
  });
}

export async function cancelOverdueReminder(documentId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(documentId).catch(() => {});
}

/** Re-syncs every scheduled reminder from the current database state: cancels everything, then
 * reschedules one per open, unpaid, due-dated invoice. Run when reminders are turned on, and once
 * per app launch while they're already on — a document's status can change from a different
 * device while this one's app was closed, which a purely locally-scheduled notification can't
 * otherwise learn about. */
export async function refreshAllReminders(): Promise<void> {
  if (!(await isRemindersEnabled())) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const ownerId = requireOwnerId();
  const { data, error } = await supabase
    .from('documents')
    .select('id, doc_number, due_date, total_minor, amount_paid_minor')
    .eq('owner_id', ownerId)
    .eq('doc_type', 'invoice')
    .in('status', ['issued', 'partially_paid'])
    .not('due_date', 'is', null);
  if (error) throw error;

  for (const doc of data ?? []) {
    if (doc.amount_paid_minor >= doc.total_minor) continue;
    await scheduleOverdueReminder(doc);
  }
}
