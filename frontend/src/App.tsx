import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import type { Patient, Appointment, Note } from "./types";
import SidebarMenu, { type Mode } from "./components/SideBarMenu";
import PatientDetail from "./components/PatientDetail";
import PatientNotes from "./components/PatientNotes";
import { groupAppointmentsByDay } from "./utils/groupAppointments";
import { formatDateLabel, formatTime } from "./utils/dateUtils";

function App() {
  const [mode, setMode] = useState<Mode>("planning");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);

  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de nouveau patient
  const [newPatientFirstName, setNewPatientFirstName] = useState("");
  const [newPatientLastName, setNewPatientLastName] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");

  const patientById = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const p of patients) map.set(p.id, p);
    return map;
  }, [patients]);

  const grouped = useMemo(
    () => groupAppointmentsByDay(appointments),
    [appointments]
  );

  /**
   * Chargement initial des patients + rendez-vous
   * -> on ne le fait qu'au mount, pas à chaque changement de mode.
   */
  useEffect(() => {
    const load = async () => {
      setError(null);
      setLoadingMain(true);
      try {
        const [p, a] = await Promise.all([
          api.getPatients(),
          api.getAppointments(),
        ]);
        const safePatients = p || [];
        setPatients(safePatients);
        setAppointments(a || []);

        // Si aucun patient sélectionné, on sélectionne le premier
        if (!selectedPatientId && safePatients.length > 0) {
          setSelectedPatientId(safePatients[0].id);
        }
      } catch (err: any) {
        setError(err?.message || "Error while loading data");
      } finally {
        setLoadingMain(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- CHANGEMENT : [] au lieu de [mode]

  /**
   * Effet de "sanity check" : si le patient sélectionné
   * n'existe plus dans la liste des patients, on réinitialise.
   */
  useEffect(() => {
    if (!selectedPatientId) return;
    const exists = patients.some((p) => p.id === selectedPatientId);
    if (!exists) {
      setSelectedPatientId(null);
      setPatientNotes([]);
    }
  }, [patients, selectedPatientId]);

  /**
   * Chargement des notes du patient sélectionné (mode Patients uniquement).
   * Gestion "soft" du cas 404 Patient not found.
   */
  useEffect(() => {
    const loadNotes = async () => {
      if (mode !== "patients" || !selectedPatientId || isCreatingNewPatient) {
        setPatientNotes([]);
        return;
      }

      setLoadingNotes(true);
      setError(null);
      try {
        const notes = await api.getNotesByPatient(selectedPatientId);
        setPatientNotes(
          (notes || []).slice().sort((a, b) => {
            const ta = new Date(a.createdAt || "").getTime();
            const tb = new Date(b.createdAt || "").getTime();
            return tb - ta;
          })
        );
      } catch (err: any) {
        const msg = err?.message || "";

        // Cas spécifique : l'API renvoie "Patient not found"
        if (msg.includes("Patient not found")) {
          // On ne montre pas un gros message d'erreur global,
          // on réinitialise simplement la sélection.
          setSelectedPatientId(null);
          setPatientNotes([]);
          setIsCreatingNewPatient(false);
          // Message plus explicite mais non bloquant
          setError(
            "Le patient sélectionné n'existe plus côté serveur. La sélection a été réinitialisée."
          );
        } else {
          setError(msg || "Error while loading notes");
        }
      } finally {
        setLoadingNotes(false);
      }
    };

    loadNotes();
  }, [mode, selectedPatientId, isCreatingNewPatient, patients]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setIsCreatingNewPatient(false);
  };

  const handleAddPatientClick = () => {
    setIsCreatingNewPatient(true);
    setSelectedPatientId(null);
    setNewPatientFirstName("");
    setNewPatientLastName("");
    setNewPatientEmail("");
    setNewPatientPhone("");
  };

  const handleSaveNewPatient = async () => {
    if (!newPatientFirstName.trim() || !newPatientLastName.trim()) return;

    try {
      setError(null);
      const created = await api.createPatient({
        firstName: newPatientFirstName.trim(),
        lastName: newPatientLastName.trim(),
        email: newPatientEmail.trim() || undefined,
        phone: newPatientPhone.trim() || undefined,
      });

      setPatients((prev) => [...prev, created]);
      setSelectedPatientId(created.id);
      setIsCreatingNewPatient(false);

      setNewPatientFirstName("");
      setNewPatientLastName("");
      setNewPatientEmail("");
      setNewPatientPhone("");
    } catch (err: any) {
      setError(err?.message || "Unable to create patient");
    }
  };

  const now = new Date().getTime();
  const upcomingAppointmentsForSelected = useMemo(() => {
    if (!selectedPatientId) return [];
    return appointments
      .filter(
        (a) =>
          a.patientId === selectedPatientId &&
          !Number.isNaN(new Date(a.startTime).getTime()) &&
          new Date(a.startTime).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  }, [appointments, selectedPatientId, now]);

  const selectedPatient = selectedPatientId
    ? patientById.get(selectedPatientId) || null
    : null;

  const handleCreateNote = async (title: string, content: string) => {
    if (!selectedPatientId || !content.trim()) return;

    try {
      setError(null);
      const created = await api.createNoteForPatient(selectedPatientId, {
        title: title || null,
        content,
      });
      setPatientNotes((prev) => [created, ...prev]);
    } catch (err: any) {
      setError(err?.message || "Unable to create note");
    }
  };

  return (
    <div className="app-root">
      <SidebarMenu
        mode={mode}
        setMode={setMode}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        onAddPatientClick={handleAddPatientClick}
      />

      <main className="main">
        {error && <div className="alert alert-error">{error}</div>}

        {mode === "planning" && (
          <section>
            <header className="section-header">
              <h2>Planning (Agenda)</h2>
              <span className="badge">{appointments.length}</span>
            </header>

            {loadingMain ? (
              <p>Loading appointments…</p>
            ) : appointments.length === 0 ? (
              <p className="empty">No appointments yet.</p>
            ) : (
              <div className="agenda">
                {grouped.map(([day, appts]) => (
                  <AgendaDay
                    key={day}
                    day={day}
                    appointments={appts}
                    patientById={patientById}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {mode === "patients" && (
          <section>
            <header className="section-header">
              <h2>Patient</h2>
            </header>

            {loadingMain ? (
              <p>Loading data…</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <PatientDetail
                  patient={selectedPatient}
                  upcomingAppointments={upcomingAppointmentsForSelected}
                  isCreatingNew={isCreatingNewPatient}
                  newFirstName={newPatientFirstName}
                  newLastName={newPatientLastName}
                  newEmail={newPatientEmail}
                  newPhone={newPatientPhone}
                  onChangeFirstName={setNewPatientFirstName}
                  onChangeLastName={setNewPatientLastName}
                  onChangeEmail={setNewPatientEmail}
                  onChangePhone={setNewPatientPhone}
                  onSaveNewPatient={handleSaveNewPatient}
                />

                {!isCreatingNewPatient && selectedPatient && (
                  <PatientNotes
                    notes={patientNotes}
                    loading={loadingNotes}
                    onCreateNote={handleCreateNote}
                  />
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

// petit composant interne pour une journée d'agenda

type AgendaDayProps = {
  day: string;
  appointments: Appointment[];
  patientById: Map<string, Patient>;
};

function AgendaDay({ day, appointments, patientById }: AgendaDayProps) {
  return (
    <div className="agenda-day">
      <h3 className="agenda-day-title">
        {day === "Invalid date" ? "Invalid date" : formatDateLabel(day)}
      </h3>
      <ul className="list">
        {appointments
          .slice()
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          .map((a) => {
            const patient = patientById.get(a.patientId);
            return (
              <li key={a.id}>
                <div className="agenda-line">
                  <span className="agenda-time">
                    {formatTime(a.startTime)}
                    {a.endTime ? ` – ${formatTime(a.endTime)}` : ""}
                  </span>
                  <span className="agenda-main">
                    {patient
                      ? `${patient.lastName.toUpperCase()} ${
                          patient.firstName
                        }`
                      : "Unknown patient"}
                  </span>
                  <span className="agenda-status">{a.status}</span>
                </div>
                {a.reason && (
                  <div className="muted text-sm">{a.reason}</div>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
