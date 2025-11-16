import type { Patient, Appointment } from "../types";
import { formatDateLabel, formatTime } from "../utils/dateUtils";

type PatientDetailProps = {
  patient: Patient | null;
  upcomingAppointments: Appointment[];
  isCreatingNew: boolean;
  newFirstName: string;
  newLastName: string;
  newEmail: string;
  newPhone: string;
  onChangeFirstName: (v: string) => void;
  onChangeLastName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhone: (v: string) => void;
  onSaveNewPatient: () => void;
};

export default function PatientDetail({
  patient,
  upcomingAppointments,
  isCreatingNew,
  newFirstName,
  newLastName,
  newEmail,
  newPhone,
  onChangeFirstName,
  onChangeLastName,
  onChangeEmail,
  onChangePhone,
  onSaveNewPatient,
}: PatientDetailProps) {
  if (isCreatingNew) {
    return (
      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Nouveau patient</h3>
        <p className="muted">
          Les champs <strong>Nom</strong> et <strong>Prénom</strong> sont
          obligatoires.
        </p>
        <div className="form-grid">
          <div>
            <label>Prénom *</label>
            <input
              type="text"
              value={newFirstName}
              onChange={(e) => onChangeFirstName(e.target.value)}
            />
          </div>
          <div>
            <label>Nom *</label>
            <input
              type="text"
              value={newLastName}
              onChange={(e) => onChangeLastName(e.target.value)}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => onChangeEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Téléphone</label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => onChangePhone(e.target.value)}
            />
          </div>
        </div>

        <button
          className="button"
          type="button"
          disabled={!newFirstName.trim() || !newLastName.trim()}
          onClick={onSaveNewPatient}
          style={{ marginTop: "1rem" }}
        >
          Sauvegarder le patient
        </button>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <p className="empty">Sélectionnez un patient dans le menu de gauche.</p>
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              {patient.lastName.toUpperCase()} {patient.firstName}
            </h3>
            {patient.email && <div className="muted">{patient.email}</div>}
            {patient.phone && <div className="muted">{patient.phone}</div>}
          </div>

          <button
            className="button"
            type="button"
            disabled
            title="Coming soon"
          >
            Ajouter un RDV
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h4 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
          Prochains rendez-vous
        </h4>
        {upcomingAppointments.length === 0 ? (
          <p className="empty">Aucun rendez-vous à venir.</p>
        ) : (
          <ul className="list">
            {upcomingAppointments.map((a) => (
              <li key={a.id}>
                <div className="agenda-line">
                  <span className="agenda-time">
                    {formatDateLabel(
                      new Date(a.startTime).toISOString().slice(0, 10)
                    )}{" "}
                    – {formatTime(a.startTime)}
                  </span>
                  <span className="agenda-status">{a.status}</span>
                </div>
                {a.reason && (
                  <div className="muted text-sm">{a.reason}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
