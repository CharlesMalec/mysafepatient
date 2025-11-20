// src/types.ts

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  startTime: string;    // ISO
  endTime: string | null;
  reason: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  patientId: string;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type NewAppointmentPayload = {
  patientId: string;
  startTime: string; // ISO
  endTime?: string;  // ISO
  reason?: string;
};