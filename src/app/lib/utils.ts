/** Formats ISO timestamp to a human-readable relative or short time string. */
export function timeAgo(iso: string | null): string {
  if (!iso) return "sin actividad";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "justo ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} días`;
}

/** Formats HH:MM to a more readable time string. */
export function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Short date from ISO. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}
