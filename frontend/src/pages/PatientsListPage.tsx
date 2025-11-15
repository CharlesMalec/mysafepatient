// src/pages/PatientsListPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Patient } from "../types";

export function PatientsListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement des patients...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Patients</h1>

      {patients.length === 0 ? (
        <p>Aucun patient pour le moment.</p>
      ) : (
        <table className="min-w-full border border-gray-200 rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Téléphone</th>
              <th className="px-3 py-2 text-left">Email</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    to={`/patients/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.lastName.toUpperCase()} {p.firstName}
                  </Link>
                </td>
                <td className="px-3 py-2">{p.phone || "—"}</td>
                <td className="px-3 py-2">{p.email || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
