// src/api.ts

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export type Patient = {
  id?: number | string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
};


export type Appointment = {
  id?: number | string;
  patientId?: number | string;
  date?: string;
  notes?: string;
};

export type Note = {
  id?: number | string;
  patientId?: number | string;
  content: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Request failed: ${res.status} ${res.statusText} – ${text}`
    );
  }

  return res.json() as Promise<T>;
}

// Health
export async function ping() {
  return request<{ pong: boolean; service: string }>("/ping");
}

// Patients
export async function getPatients() {
  return request<{ patients: Patient[] }>("/patients");
}

export async function createPatient(patient: Patient) {
  return request<{ created: boolean; patient: Patient }>("/patients", {
    method: "POST",
    body: JSON.stringify(patient),
  });
}

// Appointments
export async function getAppointments() {
  return request<{ appointments: Appointment[] }>("/appointments");
}

export async function createAppointment(app: Appointment) {
  return request<{ created: boolean; appointment: Appointment }>(
    "/appointments",
    {
      method: "POST",
      body: JSON.stringify(app),
    }
  );
}

// Notes
export async function getNotes() {
  return request<{ notes: Note[] }>("/notes");
}

export async function createNote(note: Note) {
  return request<{ created: boolean; note: Note }>("/notes", {
    method: "POST",
    body: JSON.stringify(note),
  });
}
