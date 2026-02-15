export type AdminAnalyticsEvent =
  | 'admin_page_viewed'
  | 'admin_login_attempted'
  | 'admin_login_success'
  | 'admin_login_failed'
  | 'admin_lesson_created'
  | 'admin_lesson_deleted'
  | 'admin_batch_lessons_deleted'
  | 'admin_quiz_status_toggled';

export type AdminAnalyticsPayload = Record<string, unknown>;

type DataLayerEvent = {
  event: AdminAnalyticsEvent;
  platform: 'admin';
  app_surface: 'admin_dashboard';
  schema_version: 'v1';
  event_time: string;
} & AdminAnalyticsPayload;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

const getSessionId = () => {
  const key = 'admin_analytics_session_id';
  const existing = sessionStorage.getItem(key);

  if (existing) return existing;

  const generated = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, generated);
  return generated;
};

export const adminAnalytics = {
  track(event: AdminAnalyticsEvent, payload: AdminAnalyticsPayload = {}) {
    const eventData: DataLayerEvent = {
      event,
      platform: 'admin',
      app_surface: 'admin_dashboard',
      schema_version: 'v1',
      event_time: new Date().toISOString(),
      session_id: getSessionId(),
      ...payload,
    };

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(eventData);
    }

    window.dispatchEvent(new CustomEvent('admin-analytics', { detail: eventData }));

    const isLocalDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

    if (isLocalDev) {
      console.debug('[admin-analytics]', eventData);
    }
  },
};
