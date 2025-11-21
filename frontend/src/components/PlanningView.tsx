import { useMemo, useState } from "react";
import type {
  Appointment,
  Patient,
  NewAppointmentPayload,
} from "../types";
import { formatDateLabel, formatTime } from "../utils/dateUtils";

type ViewMode = "day" | "week" | "month" | "year";

type PlanningViewProps = {
  loading: boolean;
  appointments: Appointment[];
  patients: Patient[];
  onCreateAppointment: (data: NewAppointmentPayload) => Promise<void> | void;
  onUpdateAppointment: (
    id: string,
    changes: Partial<Appointment>
  ) => Promise<void> | void;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function addMonths(date: Date, delta: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

function addYears(date: Date, delta: number) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + delta);
  return d;
}

function getRangeForView(view: ViewMode, anchor: Date): { start: Date; end: Date } {
  const dayStart = startOfDay(anchor);

  if (view === "day") {
    const start = dayStart;
    const end = addDays(start, 1);
    return { start, end };
  }

  if (view === "week") {
    // Semaine Lundi-Dimanche
    const weekday = dayStart.getDay(); // 0=dimanche, 1=lundi, ...
    const offsetToMonday = (weekday + 6) % 7; // transforme lundi en 0
    const start = addDays(dayStart, -offsetToMonday);
    const end = addDays(start, 7);
    return { start, end };
  }

  if (view === "month") {
    const start = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1);
    const end = new Date(dayStart.getFullYear(), dayStart.getMonth() + 1, 1);
    return { start, end };
  }

  // view === "year"
  const start = new Date(dayStart.getFullYear(), 0, 1);
  const end = new Date(dayStart.getFullYear() + 1, 0, 1);
  return { start, end };
}

function formatCurrentRange(view: ViewMode, anchor: Date): string {
  const fmtDay = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fmtMonth = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const fmtShort = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  });

  const fmtYear = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
  });

  const { start, end } = getRangeForView(view, anchor);

  if (view === "day") {
    return fmtDay.format(anchor);
  }

  if (view === "week") {
    const endMinusOne = addDays(end, -1);
    return `Semaine du ${fmtShort.format(start)} au ${fmtShort.format(
      endMinusOne
    )} ${fmtYear.format(anchor)}`;
  }

  if (view === "month") {
    return fmtMonth.format(anchor);
  }

  return `Année ${fmtYear.format(anchor)}`;
}

function combineDateAndTime(date: Date, time: string): string {
  // time format "HH:MM"
  const [hours, minutes] = time.split(":").map((v) => parseInt(v, 10));
  const d = new Date(date);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d.toISOString();
}

export default function PlanningView({
  loading,
  appointments,
  patients,
  onCreateAppointment,
  onUpdateAppointment,
}: PlanningViewProps) {
  const [view, setView] = useState<ViewMode>("day");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formPatientId, setFormPatientId] = useState("");
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formReason, setFormReason] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPatientId, setEditPatientId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function goPrev() {
    if (view === "day") setAnchorDate((d) => addDays(d, -1));
    else if (view === "week") setAnchorDate((d) => addDays(d, -7));
    else if (view === "month") setAnchorDate((d) => addMonths(d, -1));
    else setAnchorDate((d) => addYears(d, -1));
  }

  function goNext() {
    if (view === "day") setAnchorDate((d) => addDays(d, 1));
    else if (view === "week") setAnchorDate((d) => addDays(d, 7));
    else if (view === "month") setAnchorDate((d) => addMonths(d, 1));
    else setAnchorDate((d) => addYears(d, 1));
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  const patientById = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const p of patients) map.set(p.id, p);
    return map;
  }, [patients]);

  const filteredAppointments = useMemo(() => {
    if (!appointments || appointments.length === 0) return [];

    const { start, end } = getRangeForView(view, anchorDate);

    return appointments.filter((appt) => {
      const d = new Date(appt.startTime);
      if (Number.isNaN(d.getTime())) return false;
      return d >= start && d < end;
    });
  }, [appointments, view, anchorDate]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const appt of filteredAppointments) {
      const d = new Date(appt.startTime);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(appt);
    }
    return Array.from(groups.entries()).sort(
      ([d1], [d2]) => new Date(d1).getTime() - new Date(d2).getTime()
    );
  }, [filteredAppointments]);

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) =>
      a.lastName.localeCompare(b.lastName, "fr")
    );
  }, [patients]);

  async function handleSubmitNewAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!formPatientId || !formDate || !formStartTime) {
      alert("Patient, date et heure de début sont obligatoires.");
      return;
    }

    try {
      setCreating(true);
      const dateObj = new Date(formDate + "T00:00:00");

      const payload: NewAppointmentPayload = {
        patientId: formPatientId,
        startTime: combineDateAndTime(dateObj, formStartTime),
        reason: formReason || undefined,
      };

      if (formEndTime) {
        payload.endTime = combineDateAndTime(dateObj, formEndTime);
      }

      await onCreateAppointment(payload);

      // reset simplifié
      setShowForm(false);
      setFormReason("");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du rendez-vous.");
    } finally {
      setCreating(false);
    }
  }

  const openEdit = (appt: Appointment) => {
    setEditingId(appt.id);
    setEditPatientId(appt.patientId || "");

    const start = new Date(appt.startTime);
    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, "0");
    const dd = String(start.getDate()).padStart(2, "0");
    setEditDate(`${yyyy}-${mm}-${dd}`);

    const hh = String(start.getHours()).padStart(2, "0");
    const min = String(start.getMinutes()).padStart(2, "0");
    setEditStartTime(`${hh}:${min}`);

    if (appt.endTime) {
      const end = new Date(appt.endTime);
      const eh = String(end.getHours()).padStart(2, "0");
      const em = String(end.getMinutes()).padStart(2, "0");
      setEditEndTime(`${eh}:${em}`);
    } else {
      setEditEndTime("");
    }

    setEditReason(appt.reason || "");
    setShowForm(false); // on ferme le form de création si ouvert
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPatientId("");
    setEditDate("");
    setEditStartTime("");
    setEditEndTime("");
    setEditReason("");
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editDate || !editStartTime || !editPatientId) return;

    try {
      setSavingEdit(true);
      const dateObj = new Date(editDate + "T00:00:00");

      const payload: Partial<Appointment> = {
        patientId: editPatientId,
        startTime: combineDateAndTime(dateObj, editStartTime),
        reason: editReason || undefined,
      };

      if (editEndTime) {
        payload.endTime = combineDateAndTime(dateObj, editEndTime);
      } else {
        payload.endTime = undefined;
      }

      await onUpdateAppointment(editingId, payload);
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du rendez-vous.");
    } finally {
      setSavingEdit(false);
    }
  };


  return (
    <section>
      <header className="section-header">
        <div className="section-header-main">
          <h2>Planning</h2>
          <span className="badge">
            {appointments.length} rendez-vous au total
          </span>
        </div>

        <div className="planning-toolbar">
          <div className="planning-toolbar-left">
            <button
              type="button"
              className="btn-ghost"
              onClick={goPrev}
              aria-label="Période précédente"
            >
              ◀
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={goToday}
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={goNext}
              aria-label="Période suivante"
            >
              ▶
            </button>
          </div>

          <div className="planning-toolbar-center">
            <span className="planning-current-range">
              {formatCurrentRange(view, anchorDate)}
            </span>
          </div>

          <div className="planning-toolbar-right">
            <button
              type="button"
              className={`nav-button-small ${view === "day" ? "active" : ""
                }`}
              onClick={() => setView("day")}
            >
              Jour
            </button>
            <button
              type="button"
              className={`nav-button-small ${view === "week" ? "active" : ""
                }`}
              onClick={() => setView("week")}
            >
              Semaine
            </button>
            <button
              type="button"
              className={`nav-button-small ${view === "month" ? "active" : ""
                }`}
              onClick={() => setView("month")}
            >
              Mois
            </button>
            <button
              type="button"
              className={`nav-button-small ${view === "year" ? "active" : ""
                }`}
              onClick={() => setView("year")}
            >
              Année
            </button>
          </div>

          <div className="planning-toolbar-extra">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              + Nouveau rendez-vous
            </button>
          </div>
        </div>
      </header>

      {showForm && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <form className="form-grid" onSubmit={handleSubmitNewAppointment}>
            <div className="form-row">
              <label>
                Patient
                <select
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un patient…</option>
                  {sortedPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.lastName.toUpperCase()} {p.firstName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </label>

              <label>
                Début
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  required
                />
              </label>

              <label>
                Fin
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                />
              </label>
            </div>

            <div className="form-row">
              <label className="full-width">
                Motif (optionnel)
                <textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={2}
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowForm(false)}
                disabled={creating}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={creating}
              >
                {creating ? "Création…" : "Créer le rendez-vous"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Chargement du planning…</p>
      ) : appointments.length === 0 ? (
        <p className="empty">
          Aucun rendez-vous pour le moment. Tu pourras bientôt en créer
          directement depuis cette vue.
        </p>
      ) : filteredAppointments.length === 0 ? (
        <p className="empty">
          Aucun rendez-vous sur la période sélectionnée.
        </p>
      ) : (
        <div className="agenda">
          {groupedByDay.map(([day, appts]) => (
            <div key={day} className="agenda-day">
              <h3 className="agenda-day-title">{formatDateLabel(day)}</h3>
              <ul className="list">
                {appts
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime()
                  )
                  .map((appt) => {
                    const patient = appt.patientId
                      ? patientById.get(appt.patientId)
                      : undefined;
                    return (
                      <li key={appt.id} className="list-item">
                        <div className="agenda-line">
                          <span className="agenda-time">
                            {formatTime(appt.startTime)}
                            {appt.endTime ? ` – ${formatTime(appt.endTime)}` : ""}
                          </span>

                          <span className="agenda-main">
                            {patient
                              ? `${patient.lastName.toUpperCase()} ${patient.firstName}`
                              : "Patient inconnu"}
                          </span>

                          <span className="agenda-status">{appt.status}</span>

                          {editingId !== appt.id && (
                            <button
                              type="button"
                              className="button small agenda-edit-button"
                              onClick={() => openEdit(appt)}
                            >
                              Modifier
                            </button>
                          )}
                        </div>

                        {editingId === appt.id ? (
                          <form className="form-grid agenda-edit-form" onSubmit={handleSubmitEdit}>
                            <div className="form-row">
                              <label>
                                Patient
                                <select
                                  value={editPatientId}
                                  onChange={(e) => setEditPatientId(e.target.value)}
                                  required
                                >
                                  <option value="">Sélectionner un patient…</option>
                                  {sortedPatients.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.lastName.toUpperCase()} {p.firstName}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label>
                                Date
                                <input
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  required
                                />
                              </label>

                              <label>
                                Début
                                <input
                                  type="time"
                                  value={editStartTime}
                                  onChange={(e) => setEditStartTime(e.target.value)}
                                  required
                                />
                              </label>

                              <label>
                                Fin
                                <input
                                  type="time"
                                  value={editEndTime}
                                  onChange={(e) => setEditEndTime(e.target.value)}
                                />
                              </label>
                            </div>

                            <div className="form-row">
                              <label className="full-width">
                                Motif (optionnel)
                                <textarea
                                  value={editReason}
                                  onChange={(e) => setEditReason(e.target.value)}
                                  rows={2}
                                />
                              </label>
                            </div>

                            <div className="form-actions">
                              <button
                                type="button"
                                className="btn-ghost"
                                onClick={cancelEdit}
                                disabled={savingEdit}
                              >
                                Annuler
                              </button>
                              <button
                                type="submit"
                                className="btn-primary"
                                disabled={savingEdit}
                              >
                                {savingEdit ? "Enregistrement…" : "Enregistrer"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            {appt.reason && (
                              <div className="muted text-sm">{appt.reason}</div>
                            )}
                          </>
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
  );
}
