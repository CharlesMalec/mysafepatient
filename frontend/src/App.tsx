import { useEffect, useMemo, useState } from "react";
import { api } from "./api/client";
import type { Patient, Appointment, Note, NewAppointmentPayload } from "./types";
import SidebarMenu, { type Mode } from "./components/SideBarMenu";
import PatientDetail from "./components/PatientDetail";
import PatientNotes from "./components/PatientNotes";
import PlanningView from "./components/PlanningView";


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

  /** Chargement initial patients + rendez-vous */
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
  }, []);

  /** Si le patient sélectionné n’existe plus, on reset proprement */
  useEffect(() => {
    if (!selectedPatientId) return;
    const exists = patients.some((p) => p.id === selectedPatientId);
    if (!exists) {
      setSelectedPatientId(null);
      setPatientNotes([]);
    }
  }, [patients, selectedPatientId]);

  /** Chargement des notes du patient sélectionné (mode Patients uniquement) */
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

        if (msg.includes("Patient not found")) {
          setSelectedPatientId(null);
          setPatientNotes([]);
          setIsCreatingNewPatient(false);
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

  const handleUpdateNote = async (
    id: string,
    title: string,
    content: string
  ) => {
    try {
      setError(null);
      const updated = await api.updateNote(id, { title, content });

      setPatientNotes((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      );
    } catch (err: any) {
      setError(err?.message || "Unable to update note");
    }
  };

  const handleCreateAppointment = async (
    payload: NewAppointmentPayload
  ) => {
    try {
      setError(null);
      const created = await api.createAppointment(payload);
      setAppointments((prev) => [...prev, created]);
    } catch (err: any) {
      setError(err?.message || "Unable to create appointment");
    }
  };

  const handleUpdateAppointment = async (
    id: string,
    changes: Partial<Appointment>
  ) => {
    try {
      setError(null);
      const updated = await api.updateAppointment(id, changes);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
    } catch (err: any) {
      setError(err?.message || "Unable to update appointment");
    }
  };

  return (
    <div className="app-root">
      {/* Barre supérieure */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-title">MySafePatient</div>
          <div className="topbar-subtitle">Psychologist workspace · MVP</div>
        </div>
        <div className="topbar-right">
          {/* Plus tard : remplacer par le vrai user */}
          <div className="topbar-user">
            <span className="topbar-user-avatar">CM</span>
            <span className="topbar-user-name">Charles Malec</span>
          </div>
          <button className="btn btn-outline" disabled>
            Logout (bientôt)
          </button>
        </div>
      </header>

      <div className="app-shell">
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
            <PlanningView
              loading={loadingMain}
              appointments={appointments}
              patients={patients}
              onCreateAppointment={handleCreateAppointment}
              onUpdateAppointment={handleUpdateAppointment}
            />
          )}


          {mode === "patients" && (
            <section>
              {/* On garde un petit header mais discret */}
              <header className="section-header">
                <h2>Dossier patient</h2>
              </header>

              {loadingMain ? (
                <p>Chargement…</p>
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
                      onUpdateNote={handleUpdateNote}
                    />
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
