import { useState } from "react";
import type { Note } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import RichTextEditor from "./RichTextEditor";

type PatientNotesProps = {
  notes: Note[];
  loading: boolean;
  onCreateNote: (title: string, content: string) => void;
};

export default function PatientNotes({
  notes,
  loading,
  onCreateNote,
}: PatientNotesProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(
    () => new Set()
  );

  const toggleNoteExpanded = (id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!newContent.trim()) return;
    onCreateNote(newTitle || "", newContent);
    setNewTitle("");
    setNewContent("");
    setShowEditor(false);
  };

  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h4 style={{ margin: 0 }}>Notes</h4>
        <button
          className="button"
          type="button"
          onClick={() => setShowEditor((prev) => !prev)}
        >
          {showEditor ? "Annuler" : "+ Ajouter une note"}
        </button>
      </div>

      {showEditor && (
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: "8px",
            padding: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <input
            type="text"
            placeholder="Titre de la note (optionnel)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input"
            style={{ marginBottom: "0.75rem" }}
          />
          <RichTextEditor
            value={newContent}
            onChange={setNewContent}
            placeholder="Écrire la note…"
          />
          <button
            className="button"
            type="button"
            disabled={!newContent.trim()}
            onClick={handleSave}
            style={{ marginTop: "0.75rem" }}
          >
            Sauvegarder la note
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="empty">Aucune note pour ce patient.</p>
      ) : (
        <ul className="list">
          {notes.map((n) => {
            const isExpanded = expandedNoteIds.has(n.id);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => toggleNoteExpanded(n.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div className="note-title">
                        <strong>{n.title || "Note sans titre"}</strong>
                      </div>
                      <div className="note-date muted">
                        {formatDateTime(n.createdAt)}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        opacity: 0.7,
                      }}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div
                    className="note-content"
                    style={{ marginTop: "0.5rem" }}
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
