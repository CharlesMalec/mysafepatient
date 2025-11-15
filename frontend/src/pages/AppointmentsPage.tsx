// src/pages/AppointmentsPage.tsx
import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import type { Appointment } from "../types";

function groupByDate(appointments: Appointment[]) {
  const map = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const day = new Date(a.startTime).toISOString().slice(0, 10); // YYYY-MM-DD
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(a);
  }
  // tri par date
  return Array.from(map.entries()).sort(([d1], [d2]) => d1.localeCompare(d2));
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAppointments()
      .then(setAppointments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => groupByDate(appointments), [appointments]);

  if (loading) return <div>Chargement des rendez-vous...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Agenda</h1>

      {grouped.length === 0 ? (
        <p>Aucun rendez-vous.</p>
      ) : (
        grouped.map(([day, appts]) => {
          const d = new Date(day);
          const label = d.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return (
            <section key={day} className="border rounded p-3">
              <h2 className="font-semibold mb-2">{label}</h2>
              <ul className="space-y-1">
                {appts
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime()
                  )
                  .map((a) => (
                    <li key={a.id} className="text-sm flex gap-2">
                      <span className="font-mono">
                        {new Date(a.startTime).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span>
                        {a.reason || "Consultation"}{" "}
                        <span className="text-xs text-gray-500">
                          ({a.status})
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
