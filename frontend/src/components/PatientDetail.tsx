import { useEffect, useState } from "react";
import type { Patient, Appointment } from "../types";
import { formatDateTime } from "../utils/dateUtils";

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
  onUpdatePatient: (
    id: string,
    changes: Partial<Patient>
  ) => Promise<void> | void;
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
  onUpdatePatient,
}: PatientDetailProps) {
  const [editMode, setEditMode] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    if (patient) {
      setEditEmail(patient.email || "");
      setEditPhone(patient.phone || "");
    }
  }, [patient]);
  if (isCreatingNew) {
    const canSave =
      newFirstName.trim().length > 0 && newLastName.trim().length > 0;

    return (
      <section className="card patient-card">
        <header className="card-header">
          <div>
            <h3 className="card-title">Créer un nouveau patient</h3>
            <p className="card-subtitle">
              Renseigne au minimum le prénom et le nom pour enregistrer la
              fiche.
            </p>
          </div>
        </header>

        <div className="card-body">
          <div
            className="grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem 1.5rem",
            }}
          >
            <div className="form-field">
              <label className="form-label">
                Prénom<span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ex. Marie"
                value={newFirstName}
                onChange={(e) => onChangeFirstName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">
                Nom<span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="ex. DURAND"
                value={newLastName}
                onChange={(e) => onChangeLastName(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="ex. marie.durand@example.com"
                value={newEmail}
                onChange={(e) => onChangeEmail(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label className="form-label">Téléphone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="ex. +32 4 12 34 56 78"
                value={newPhone}
                onChange={(e) => onChangePhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        <footer className="card-footer">
          <button
            className="btn btn-primary"
            onClick={onSaveNewPatient}
            disabled={!canSave}
          >
            Enregistrer le patient
          </button>
          <span className="hint-text">
            <span className="required">*</span> champs obligatoires
          </span>
        </footer>
      </section>
    );
  }

  // Pas de patient sélectionné
  if (!patient) {
    return (
      <section className="card patient-card">
        <div className="card-body">
          <p className="empty">
            Aucun patient sélectionné. Choisis un patient dans la colonne de
            gauche ou clique sur “Ajouter un patient”.
          </p>
        </div>
      </section>
    );
  }

  // Vue fiche patient existant
  return (
    <section className="card patient-card">
      <header className="card-header">
        <div>
          <h3 className="card-title">
            {patient.lastName.toUpperCase()} {patient.firstName}
          </h3>
          <p className="card-subtitle">
            Fiche patient · ID: <span className="mono">{patient.id}</span>
          </p>
        </div>

        <button className="btn btn-outline" disabled>
          Ajouter un RDV (bientôt)
        </button>
      </header>

      <div className="card-body">
        <div
          className="grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
            gap: "1.5rem",
          }}
        >
          {/* Bloc coordonnées */}
          <div>
            <h4 className="section-title">Coordonnées</h4>

            <dl className="info-list">
              <div className="info-row">
                <dt>Nom</dt>
                <dd>
                  {patient.lastName.toUpperCase()} {patient.firstName}
                </dd>
              </div>

              {!editMode ? (
                <>
                  <div className="info-row">
                    <dt>Email</dt>
                    <dd>
                      {patient.email || <span className="muted">Non renseigné</span>}
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>Téléphone</dt>
                    <dd>
                      {patient.phone || <span className="muted">Non renseigné</span>}
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-row">
                    <dt>Email</dt>
                    <dd>
                      <input
                        type="email"
                        className="form-input"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="ex. marie.durand@example.com"
                      />
                    </dd>
                  </div>
                  <div className="info-row">
                    <dt>Téléphone</dt>
                    <dd>
                      <input
                        type="tel"
                        className="form-input"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="ex. +32 4 12 34 56 78"
                      />
                    </dd>
                  </div>
                </>
              )}
            </dl>

            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
              {!editMode ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditMode(true)}
                >
                  Modifier
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditEmail(patient.email || "");
                      setEditPhone(patient.phone || "");
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={async () => {
                      await onUpdatePatient(patient.id, {
                        email: editEmail.trim() || undefined,
                        phone: editPhone.trim() || undefined,
                      });
                      setEditMode(false);
                    }}
                  >
                    Enregistrer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bloc prochains rendez-vous */}
          <div>
            <h4 className="section-title">Prochains rendez-vous</h4>
            {upcomingAppointments.length === 0 ? (
              <p className="muted text-sm">
                Aucun rendez-vous à venir pour ce patient.
              </p>
            ) : (
              <ul className="list">
                {upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="list-item">
                    <div className="appt-line">
                      <span className="appt-date">
                        {formatDateTime(appt.startTime)}
                      </span>
                      <span className="appt-status">{appt.status}</span>
                    </div>
                    {appt.reason && (
                      <div className="muted text-sm">{appt.reason}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
