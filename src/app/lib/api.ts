const BASE_URL = "https://164-92-127-153.nip.io";

export function setBackendIp(_ip: string): void {}
export function getBackendIp(): string { return "164-92-127-153.nip.io"; }
export async function testConnection(ip: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${ip}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// Cambiar esto al device_id del M5GO
export const DEVICE_ID = "m5go_001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

// --- Perfil ---
export interface UserProfile {
  device_id: string;
  name: string;
  age?: number;
  medications?: Medication[];
  family_contacts?: FamilyContact[];
  interests?: Record<string, unknown>;
}

export function getProfile(deviceId = DEVICE_ID) {
  return request<UserProfile>(`/api/profile/${deviceId}`);
}

// --- Actividad ---
export interface ActivitySummary {
  device_id: string;
  user_name: string;
  last_interaction: string | null;
  interactions_today: number;
  medications: Medication[];
  family_contacts: FamilyContact[];
}

export function getActivity(deviceId = DEVICE_ID) {
  return request<ActivitySummary>(`/api/activity/${deviceId}`);
}

// --- Conversaciones ---
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function getConversations(deviceId = DEVICE_ID, limit = 50) {
  return request<{ device_id: string; conversations: ConversationTurn[] }>(
    `/api/conversations/${deviceId}?limit=${limit}`
  );
}

// --- Medicamentos ---
export interface Medication {
  name: string;
  dose: string;
  time: string;
}

export function getMedications(deviceId = DEVICE_ID) {
  return request<{ device_id: string; medications: Medication[] }>(
    `/api/medications/${deviceId}`
  );
}

export function addMedication(med: Medication, deviceId = DEVICE_ID) {
  return request(`/api/medications/${deviceId}`, {
    method: "POST",
    body: JSON.stringify(med),
  });
}

export function removeMedication(medName: string, deviceId = DEVICE_ID) {
  return request(`/api/medications/${deviceId}/${encodeURIComponent(medName)}`, {
    method: "DELETE",
  });
}

// --- Log de medicamentos ---
export interface MedicationLogEntry {
  name: string;
  time: string;
  date: string;
  reminded_at: string;
  taken: boolean | null;
}

export function getMedicationLog(deviceId = DEVICE_ID) {
  return request<{ device_id: string; log: MedicationLogEntry[] }>(
    `/api/medication-log/${deviceId}`
  );
}

// --- Familiares ---
export interface FamilyContact {
  name: string;
  relation: string;
  phone: string;
  telegram_id?: string;
}

// --- Alertas ---
export interface Alert {
  device_id: string;
  reason: string;
  user_name: string;
  timestamp: string;
  seen: boolean;
}

export function getAlerts(deviceId = DEVICE_ID) {
  return request<{ device_id: string; alerts: Alert[]; unseen: number }>(
    `/api/alerts/${deviceId}`
  );
}

export function markAlertsSeen(deviceId = DEVICE_ID) {
  return request(`/api/alerts/${deviceId}/seen`, { method: "POST" });
}

export function deleteAlert(alertTimestamp: string, deviceId = DEVICE_ID) {
  return request(`/api/alerts/${deviceId}/${encodeURIComponent(alertTimestamp)}`, {
    method: "DELETE",
  });
}

export function deleteAllAlerts(deviceId = DEVICE_ID) {
  return request(`/api/alerts/${deviceId}`, { method: "DELETE" });
}

// --- Device pairing ---
export interface DeviceStatus {
  device_id: string;
  status: "waiting_setup" | "onboarding" | "ready";
  onboarding_done: boolean;
  activated: boolean;
  user_name: string;
}

export function getDeviceStatus(deviceId = DEVICE_ID) {
  return request<DeviceStatus>(`/api/device/${deviceId}/status`);
}

export function pairDevice(deviceId = DEVICE_ID) {
  return request(`/api/device/${deviceId}/pair`, { method: "POST" });
}

export function activateDevice(deviceId = DEVICE_ID) {
  return request(`/api/device/${deviceId}/activate`, { method: "POST" });
}

// --- Onboarding ---
export interface OnboardingPayload {
  name: string;
  age?: number;
  medications: Medication[];
  family_contacts: Array<FamilyContact & { telegram_id: string }>;
  health_conditions: string[];
}

export function submitOnboarding(
  payload: OnboardingPayload,
  deviceId = DEVICE_ID
) {
  return request(`/api/onboarding/${deviceId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// --- Familiares ---
export function addFamilyContact(
  contact: FamilyContact,
  deviceId = DEVICE_ID
) {
  return request(`/api/family/${deviceId}`, {
    method: "POST",
    body: JSON.stringify(contact),
  });
}
