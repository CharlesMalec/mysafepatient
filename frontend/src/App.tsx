import { useEffect, useMemo, useState } from "react";
import RichTextEditor from "./components/RichTextEditor";
import { api } from "./api/client";
import type { Patient, Appointment, Note } from "./types";

type Tab = "patients" | "appointments" | "notes";

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatDateLabel(isoDate: string) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Group appointments by YYYY-MM-DD
function groupAppointmentsByDay(appointments: Appointment[]) {
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

function App() {
  const [tab, setTab] = useState<Tab>("patients");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPatientFirstName, setNewPatientFirstName] = useState("");
  const [newPatientLastName, setNewPatientLastName] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");

  // States pour création de note
  const [newNotePatientId, setNewNotePatientId] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  


  useEffect(() => {
    const load = async () => {
      setError(null);
      setLoading(true);
      try {
        if (tab === "patients") {
          const p = await api.getPatients();
          setPatients(p || []);
        } else if (tab === "appointments") {
          const [p, a] = await Promise.all([
            api.getPatients(),
            api.getAppointments(),
          ]);
          setPatients(p || []);
          setAppointments(a || []);
        } else if (tab === "notes") {
          const p = await api.getPatients();
          const safePatients = p || [];
          setPatients(safePatients);
          // Charge les notes pour chaque patient (en utilisant getNotesByPatient)
          const allNotesArrays = await Promise.all(
            safePatients.map((pt) => api.getNotesByPatient(pt.id))
          );
          const flatNotes: Note[] = allNotesArrays.flat();
          setNotes(flatNotes);
        }
      } catch (err: any) {
        setError(err?.message || "Error while loading data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tab]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientFirstName.trim() || !newPatientLastName.trim()) return;

    try {
      setError(null);
      const created = await api.createPatient({
        firstName: newPatientFirstName.trim(),
        lastName: newPatientLastName.trim(),
        email: newPatientEmail.trim() || undefined,
      });
      setPatients((prev) => [...prev, created]);
      setNewPatientFirstName("");
      setNewPatientLastName("");
      setNewPatientEmail("");
    } catch (err: any) {
      setError(err?.message || "Unable to create patient");
    }
  };

  const handleCreateNote = async () => {
    if (!newNotePatientId || !newNoteContent.trim()) return;

    try {
      setError(null);
      const created = await api.createNoteForPatient(newNotePatientId, {
        title: newNoteTitle || null,
        content: newNoteContent,
      });

      setNotes((prev) => [created, ...prev]);

      setNewNotePatientId("");
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (err: any) {
      setError(err?.message || "Unable to create note");
    }
  };


  const patientById = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const p of patients) map.set(p.id, p);
    return map;
  }, [patients]);

  const groupedAppointments = useMemo(
    () => groupAppointmentsByDay(appointments),
    [appointments]
  );

  return (
    <div className="app-root">
      <aside className="sidebar">
        <h1 className="app-title">MySafePatient</h1>
        <p className="app-subtitle">Psychologist workspace (MVP)</p>

        <nav className="nav">
          <button
            className={`nav-button ${tab === "patients" ? "active" : ""}`}
            onClick={() => setTab("patients")}
          >
            Patients
          </button>
          <button
            className={`nav-button ${tab === "appointments" ? "active" : ""}`}
            onClick={() => setTab("appointments")}
          >
            Appointments
          </button>
          <button
            className={`nav-button ${tab === "notes" ? "active" : ""}`}
            onClick={() => setTab("notes")}
          >
            Notes
          </button>
        </nav>
      </aside>

      <main className="main">
        {error && <div className="alert alert-error">{error}</div>}

        {/* PATIENTS TAB */}
        {tab === "patients" && (
          <section>
            <header className="section-header">
              <h2>Patients</h2>
              <span className="badge">{patients.length}</span>
            </header>

            <form className="form-inline" onSubmit={handleAddPatient}>
              <input
                type="text"
                placeholder="First name"
                value={newPatientFirstName}
                onChange={(e) => setNewPatientFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last name"
                value={newPatientLastName}
                onChange={(e) => setNewPatientLastName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newPatientEmail}
                onChange={(e) => setNewPatientEmail(e.target.value)}
              />
              <button type="submit">Add</button>
            </form>

            {loading ? (
              <p>Loading patients…</p>
            ) : patients.length === 0 ? (
              <p className="empty">No patients yet.</p>
            ) : (
              <ul className="list">
                {patients.map((p) => (
                  <li key={p.id}>
                    <strong>
                      {p.firstName} {p.lastName}
                    </strong>
                    <div className="muted-row">
                      {p.email && <span className="muted">{p.email}</span>}
                      {p.phone && <span className="muted">{p.phone}</span>}
                    </div>
                    {p.notes && <p className="muted">{p.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* APPOINTMENTS TAB */}
        {tab === "appointments" && (
          <section>
            <header className="section-header">
              <h2>Appointments (Agenda)</h2>
              <span className="badge">{appointments.length}</span>
            </header>

            {loading ? (
              <p>Loading appointments…</p>
            ) : appointments.length === 0 ? (
              <p className="empty">No appointments yet.</p>
            ) : (
              <div className="agenda">
                {groupedAppointments.map(([day, appts]) => (
                  <div key={day} className="agenda-day">
                    <h3 className="agenda-day-title">
                      {day === "Invalid date"
                        ? "Invalid date"
                        : formatDateLabel(day)}
                    </h3>
                    <ul className="list">
                      {appts
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(a.startTime).getTime() -
                            new Date(b.startTime).getTime()
                        )
                        .map((a) => {
                          const patient = patientById.get(a.patientId);
                          return (
                            <li key={a.id}>
                              <div className="agenda-line">
                                <span className="agenda-time">
                                  {formatTime(a.startTime)}
                                  {a.endTime
                                    ? ` – ${formatTime(a.endTime)}`
                                    : ""}
                                </span>
                                <span className="agenda-main">
                                  {patient
                                    ? `${patient.lastName.toUpperCase()} ${patient.firstName
                                    }`
                                    : "Unknown patient"}
                                </span>
                                <span className="agenda-status">
                                  {a.status}
                                </span>
                              </div>
                              {a.reason && (
                                <div className="muted text-sm">
                                  {a.reason}
                                </div>
                              )}
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* NOTES TAB */}
        {tab === "notes" && (
          <section>
            <header className="section-header">
              <h2>Notes</h2>
              <span className="badge">{notes.length}</span>
            </header>

            {/* --- Create new note --- */}
            <div className="card" style={{ padding: "1rem", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>New note</h3>

              <select
                value={newNotePatientId}
                onChange={(e) => setNewNotePatientId(e.target.value)}
                className="select"
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Note title (optional)"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="input"
                style={{ marginTop: "1rem" }}
              />

              <div style={{ marginTop: "1rem" }}>
                <RichTextEditor
                  value={newNoteContent}
                  onChange={setNewNoteContent}
                  placeholder="Write your note..."
                />
              </div>

              <button
                className="button"
                disabled={!newNotePatientId || !newNoteContent.trim()}
                onClick={handleCreateNote}
                style={{ marginTop: "1rem" }}
              >
                Save note
              </button>
            </div>

            {/* --- Existing notes --- */}
            {loading ? (
              <p>Loading notes…</p>
            ) : notes.length === 0 ? (
              <p className="empty">No notes yet.</p>
            ) : (
              <ul className="list">
                {notes.map((n) => {
                  const patient = patientById.get(n.patientId);
                  return (
                    <li key={n.id}>
                      <div className="note-header">
                        {patient && (
                          <span className="note-patient">
                            {patient.lastName.toUpperCase()} {patient.firstName}
                          </span>
                        )}
                        <span className="note-date">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>

                      {n.title && (
                        <div className="note-title">
                          <strong>{n.title}</strong>
                        </div>
                      )}

                      {/* HTML rendu depuis Quill */}
                      <div
                        className="note-content"
                        dangerouslySetInnerHTML={{ __html: n.content }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}


      </main>
    </div>
  );
}

export default App;
