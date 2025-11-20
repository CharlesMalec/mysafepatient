import { useState } from "react";
import type { Note } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import RichTextEditor from "./RichTextEditor";

type PatientNotesProps = {
  notes: Note[];
  loading: boolean;
  onCreateNote: (title: string, content: string) => void;
  onUpdateNote: (id: string, title: string, content: string) => void; // ⬅️ NEW
};

export default function PatientNotes({
  notes,
  loading,
  onCreateNote,
  onUpdateNote,
}: PatientNotesProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(
    () => new Set()

  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

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

  const startEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title || "");
    setEditingContent(note.content);
    // on force la note ouverte
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      next.add(note.id);
      return next;
    });
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingTitle("");
    setEditingContent("");
  };

  const handleUpdate = (note: Note) => {
    if (!editingContent.trim()) return;
    onUpdateNote(note.id, editingTitle || "", editingContent);
    cancelEdit();
  };

  return (
    <div className="card notes-card">
      <div className="notes-header">
        <h4 className="notes-title">Notes</h4>
        <button
          className="button notes-add-button"
          type="button"
          onClick={() => setShowEditor((prev) => !prev)}
        >
          {showEditor ? "Annuler" : "+ Ajouter une note"}
        </button>
      </div>

      {showEditor && (
        <div className="notes-editor">
          <input
            type="text"
            placeholder="Titre de la note (optionnel)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input notes-title-input"
          />
          <div className="notes-editor-body">
            <RichTextEditor
              value={newContent}
              onChange={setNewContent}
              placeholder="Écrire la note…"
            />
          </div>
          <div className="notes-editor-actions">
            <button
              className="button"
              type="button"
              onClick={() => {
                setShowEditor(false);
                setNewTitle("");
                setNewContent("");
              }}
            >
              Annuler
            </button>
            <button
              className="btn-primary"
              type="button"
              disabled={!newContent.trim()}
              onClick={handleSave}
            >
              Sauvegarder la note
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="notes-empty muted">Chargement des notes…</p>
      ) : notes.length === 0 ? (
        <p className="notes-empty empty">Aucune note pour ce patient.</p>
      ) : (
        <ul className="notes-list">
          {notes.map((n) => {
            const isExpanded = expandedNoteIds.has(n.id);
            return (
              <li
                key={n.id}
                className={`note-item ${isExpanded ? "expanded" : "collapsed"}`}
              >
                <button
                  type="button"
                  className="note-toggle"
                  onClick={() => toggleNoteExpanded(n.id)}
                >
                  <div className="note-header">
                    <div className="note-header-main">
                      <div className="note-title">
                        <strong>{n.title || "Note sans titre"}</strong>
                      </div>
                      <div className="note-date">
                        {formatDateTime(n.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`note-chevron ${isExpanded ? "note-chevron-open" : ""
                        }`}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="note-content">
                    {editingNoteId === n.id ? (
                      <>
                        <input
                          type="text"
                          className="input notes-title-input"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Titre de la note"
                        />
                        <div className="notes-editor-body">
                          <RichTextEditor
                            value={editingContent}
                            onChange={setEditingContent}
                            placeholder="Éditer la note…"
                          />
                        </div>
                        <div className="notes-editor-actions">
                          <button
                            className="button"
                            type="button"
                            onClick={cancelEdit}
                          >
                            Annuler
                          </button>
                          <button
                            className="btn-primary"
                            type="button"
                            disabled={!editingContent.trim()}
                            onClick={() => handleUpdate(n)}
                          >
                            Enregistrer
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          dangerouslySetInnerHTML={{ __html: n.content }}
                        />
                        <div className="note-actions">
                          <button
                            className="button note-edit-button"
                            type="button"
                            onClick={() => startEdit(n)}
                          >
                            Modifier
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
