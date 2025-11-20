import { useState } from "react";
import type { Patient } from "../types";

export type Mode = "planning" | "patients";

type SidebarMenuProps = {
  mode: Mode;
  setMode: (m: Mode) => void;
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  onAddPatientClick: () => void;
};

export default function SidebarMenu({
  mode,
  setMode,
  patients,
  selectedPatientId,
  onSelectPatient,
  onAddPatientClick,
}: SidebarMenuProps) {
  const [patientsOpen, setPatientsOpen] = useState(true);

  return (
    <aside className="sidebar">
      <nav className="nav">
        <button
          className={`nav-button ${mode === "planning" ? "active" : ""}`}
          onClick={() => setMode("planning")}
          style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "6px" }}
        >
          <span /> {/* colonne vide pour alignement parfait */}
          <span>Planning</span>
        </button>

        <div className="nav-divider" />

        <div className="nav-group">
          <button
            className={`nav-button ${mode === "patients" ? "active" : ""}`}
            onClick={() => {
              setMode("patients");
              setPatientsOpen((prev) => !prev);
            }}
            style={{ display: "grid", gridTemplateColumns: "12px 1fr", gap: "6px" }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                opacity: 0.8,
                textAlign: "center",
              }}
            >
              {patientsOpen ? "▾" : "▸"}
            </span>
            <span>Patients</span>
          </button>

          {patientsOpen && (
            <ul className="nav-tree">
              {patients.map((p) => {
                const selected = selectedPatientId === p.id;
                return (
                  <li
                    key={p.id}
                    className={`nav-tree-item ${selected ? "selected" : ""}`}
                    onClick={() => {
                      setMode("patients");
                      onSelectPatient(p.id);
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "0.15rem 0.75rem 0.15rem 1.5rem",
                      fontSize: "0.9rem",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: selected
                        ? "rgba(255, 255, 255, 0.08)"
                        : "transparent",
                      borderLeft: selected
                        ? "2px solid rgba(255, 255, 255, 0.7)"
                        : "2px solid transparent",
                    }}
                  >
                    <span
                      style={{
                        width: "0.35rem",
                        height: "0.35rem",
                        borderRadius: "999px",
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                        opacity: selected ? 1 : 0.5,
                      }}
                    />
                    <span>
                      {p.lastName.toUpperCase()} {p.firstName}
                    </span>
                  </li>
                );
              })}

              <li
                onClick={() => {
                  setMode("patients");
                  onAddPatientClick();
                }}
                style={{
                  cursor: "pointer",
                  padding: "0.25rem 0.75rem 0.25rem 1.5rem",
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  opacity: 0.85,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span
                  style={{
                    width: "0.35rem",
                    height: "0.35rem",
                    borderRadius: "999px",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.55rem",
                  }}
                >
                  +
                </span>
                <span>Ajouter un patient</span>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
}
