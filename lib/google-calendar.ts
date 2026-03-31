import { google } from "googleapis";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  calendar: string;
}

function getAuthClient() {
  // Load credentials from env vars (stringified JSON)
  const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
  const tokenJson = process.env.GOOGLE_TOKEN_JSON;

  if (!credentialsJson || !tokenJson) {
    throw new Error("Google Calendar not configured. Set GOOGLE_CREDENTIALS_JSON and GOOGLE_TOKEN_JSON env vars.");
  }

  const credentials = JSON.parse(credentialsJson);
  const token = JSON.parse(tokenJson);

  const { client_id, client_secret, redirect_uris } =
    credentials.installed || credentials.web;
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0]);
  auth.setCredentials(token);

  return auth;
}

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items || []).map((event) => ({
    id: event.id || "",
    summary: event.summary || "(No title)",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    calendar: "primary",
  }));
}
