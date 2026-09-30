import { auth, getMessagingInstance, FCM_VAPID_KEY, FCM_SW_SCOPE } from "./firebase";

/**
 * Browser push, from the side that asks questions about it.
 *
 * Registrations were not reaching the admin's browser and there was no way to
 * find out why: the send is fired by the person registering, its failure is
 * swallowed, and nothing about it is written down. These are the facts the
 * admin can be shown instead.
 */

export type PushPermission = NotificationPermission | "unsupported";

export function pushPermission(): PushPermission {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  return Notification.permission;
}

/**
 * This browser's own token, or null with the reason it has none.
 *
 * Asking for it again is safe: the same browser gets the same token back.
 */
export async function currentPushToken(): Promise<{ token: string | null; reason?: string }> {
  if (pushPermission() === "unsupported") return { token: null, reason: "المتصفح لا يدعم إشعارات الويب" };
  if (Notification.permission === "denied") return { token: null, reason: "الإشعارات محظورة في إعدادات المتصفح لهذا الموقع" };
  if (Notification.permission === "default") return { token: null, reason: "لم تُمنح صلاحية الإشعارات بعد" };
  if (!FCM_VAPID_KEY) return { token: null, reason: "مفتاح VAPID غير مضبوط في إعدادات النشر" };

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return { token: null, reason: "خدمة المراسلة غير متاحة في هذا المتصفح" };

    const sw = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE);
    if (!sw) return { token: null, reason: "عامل الخدمة غير مسجَّل — أعد تحميل الصفحة" };

    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: sw });
    return token ? { token } : { token: null, reason: "لم يُصدر المتصفح رمزاً" };
  } catch (e) {
    return { token: null, reason: (e as Error)?.message ?? "تعذّر الحصول على رمز الجهاز" };
  }
}

export interface PushAttempt {
  ok: boolean;
  /** How many devices actually received it. */
  delivered?: number;
  /** How many the server tried. */
  targeted?: number;
  /** Dead tokens the server removed on the way. */
  pruned?: number;
  reason?: string;
  failures?: string[];
}

/**
 * Sends the admin a push and reports what happened — without storing an
 * in-site notification, so testing does not litter the list.
 */
export async function sendTestPush(): Promise<PushAttempt> {
  const user = auth.currentUser;
  if (!user) return { ok: false, reason: "لست مسجّل الدخول" };

  try {
    const res = await fetch("/api/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({
        title: "إشعار تجريبي 🔔",
        body: "إن وصلك هذا، فإشعارات المتصفح تعمل.",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: data.reason || data.error || `HTTP ${res.status}` };
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, reason: (e as Error)?.message ?? "تعذّر الاتصال بالخادم" };
  }
}
