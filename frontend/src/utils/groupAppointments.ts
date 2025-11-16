import type { Appointment } from "../types";

export function groupAppointmentsByDay(appointments: Appointment[]) {
  const map = new Map<string, Appointment[]>();

  for (const a of appointments) {
    const d = new Date(a.startTime);
    if (Number.isNaN(d.getTime())) {
      const key = "Invalid date";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
      continue;
    }
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }

  return Array.from(map.entries()).sort(([d1], [d2]) => d1.localeCompare(d2));
}
