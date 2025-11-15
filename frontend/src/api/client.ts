// src/api/client.ts
import type { Patient, Appointment, Note } from "../types";

// ⚠️ Mets bien l'URL de ta fonction Scaleway ici (sans / final)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://mysafepatientns2zvutvls-mysafepatient-fs.functions.fnc.fr-par.scw.cloud";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("API error", res.status, text);
    throw new Error(
      `API error ${res.status} ${res.statusText}: ${text || "(no body)"}`
    );
  }

  return (await res.json()) as T;
}

export const api = {
  // --- PATIENTS ---
  getPatients(): Promise<Patient[]> {
    return apiFetch<Patient[]>("/patients");
  },

  getPatient(id: string): Promise<Patient> {
    return apiFetch<Patient>(`/patients/${id}`);
  },

  createPatient(payload: Partial<Patient>): Promise<Patient> {
    return apiFetch<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // --- APPOINTMENTS ---
  getAppointments(): Promise<Appointment[]> {
    return apiFetch<Appointment[]>("/appointments");
  },

  getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return apiFetch<Appointment[]>(`/patients/${patientId}/appointments`);
  },

  // --- NOTES ---
  getNotesByPatient(patientId: string): Promise<Note[]> {
    return apiFetch<Note[]>(`/patients/${patientId}/notes`);
  },
};
