// src/pages/PatientDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import type { Patient, Appointment, Note } from "../types";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) return;

    setLoading(true);
    Promise.all([
      api.getPatient(patientId),
      api.getAppointmentsByPatient(patientId),
      api.getNotesByPatient(patientId),
    ])
      .then(([p, a, n]) => {
        setPatient(p);
        setAppointments(a);
        setNotes(n);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (!patientId) return <div>PatientId manquant.</div>;
  if (loading) return <div>Chargement du patient...</div>;
  if (error) return <div>Erreur : {error}</div>;
  if (!patient) return <div>Patient introuvable.</div>;

  return (
    <div className="p-4 space-y-6">
      <div>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Retour à la liste des patients
        </Link>
      </div>

      <section>
        <h1 className="text-2xl font-semibold mb-2">
          {patient.lastName.toUpperCase()} {patient.firstName}
        </h1>
        <p>Date de naissance : {patient.dateOfBirth || "—"}</p>
        <p>Téléphone : {patient.phone || "—"}</p>
        <p>Email : {patient.email || "—"}</p>
        {patient.notes && (
          <p className="mt-2 text-sm text-gray-700">{patient.notes}</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Rendez-vous</h2>
        {appointments.length === 0 ? (
          <p>Aucun rendez-vous enregistré.</p>
        ) : (
          <ul className="space-y-1">
            {appointments.map((a) => (
              <li key={a.id} className="border rounded px-3 py-2">
                <div>
                  <span className="font-medium">
                    {formatDateTime(a.startTime)}
                  </span>
                  {a.endTime && ` → ${formatDateTime(a.endTime)}`}
                </div>
                <div className="text-sm text-gray-700">
                  Statut : {a.status} {a.reason ? `– ${a.reason}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Notes</h2>
        {notes.length === 0 ? (
          <p>Aucune note pour ce patient.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="border rounded px-3 py-2">
                {n.title && (
                  <div className="font-medium mb-1">{n.title}</div>
                )}
                <div className="text-sm whitespace-pre-line">{n.content}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Créée le {formatDateTime(n.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
