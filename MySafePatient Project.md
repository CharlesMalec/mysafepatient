# MySafePatient -- Privacy-First Workspace Project

## 1. Vision

Create a privacy-first digital workspace for psychologists (and
potentially other healthcare professionals) to manage their patients,
appointments, and notes. The key principles are: - **Zero-knowledge
architecture**: all confidential data encrypted client-side. -
**Simplicity & ethics**: encourage manual note-taking; discourage file
uploads. - **GDPR compliance by design** for BE/FR markets. - **Smooth
UX**: minimal friction, local-first, cloud optional.

MVP focuses on **Planner + Encrypted Notes**, later extended to
**Budgeting, Reports**, and **AI-assisted anonymized summaries**.

------------------------------------------------------------------------

## 2. Architecture Overview

### Core concept

Two data compartments: - **Patient Directory**: encrypted identifiers,
stored locally. - **Notes Repository**: anonymized, encrypted notes
linked by UUIDs.

### Stack

  -----------------------------------------------------------------------
  Layer                   Tech              Purpose
  ----------------------- ----------------- -----------------------------
  Frontend                React + Vite +    UI, client-side encryption
                          TypeScript (PWA)  

  Backend                 Node.js           API, storage of encrypted
                          (Express) +       blobs
                          PostgreSQL        

  Hosting                 OVH/Scaleway EU   GDPR compliant

  Encryption              WebCrypto API     Local encryption
                          (AES-GCM,         
                          Argon2id for key  
                          derivation)       
  -----------------------------------------------------------------------

### Data Flow

1.  Therapist logs in → local key generated/unlocked.
2.  Writes note → encrypted locally → ciphertext sent to backend.
3.  Backend stores ciphertext + metadata (UUIDs, timestamps only).
4.  Optional attachments encrypted before upload.

------------------------------------------------------------------------

## 3. Data Model

  ------------------------------------------------------------------------
  Table            Key fields                 Description
  ---------------- -------------------------- ----------------------------
  therapists       id, email, wrapped_key     account metadata

  patients         id, therapist_id,          encrypted identifiers
                   encrypted_name             

  appointments     id, therapist_id,          pseudonymized appointments
                   patient_uid, datetime      

  notes            id, patient_uid,           encrypted notes
                   appointment_id, ciphertext 

  attachments      id, note_id, mime, size,   encrypted files (optional)
                   encrypted_blob_ref         
  ------------------------------------------------------------------------

Notes and attachments are encrypted client-side. Patient names never
appear in plaintext.

------------------------------------------------------------------------

## 4. MVP Roadmap

**M1 -- Core Encryption + Note Saving** - Basic UI for creating a
patient + note. - Local AES-GCM encryption using WebCrypto. - Send
ciphertext to backend; store in Postgres. - Retrieve/decrypt locally.

**M2 -- Planner + Linked Notes** - Weekly planner UI (React Calendar
component). - Appointment creation linked to note UUID. - Local key
persistence (IndexedDB).

**M3 -- Budgeting & Reports** - Track rate per session, sessions done,
totals. - Local CSV/PDF export.

**M4 -- Attachments (optional)** - Compress, encrypt, upload. - Display
quota and pricing logic.

**M5 -- Privacy Guard & Validation** - Client-side name detector; warns
if identifiable data in notes. - Local anonymization helper.

**M6 -- Anonymized AI Summary (optional)** - Therapist validates
anonymized text. - Local/offline AI model or remote anonymized API call.

------------------------------------------------------------------------

## 5. Development Sprint Plan

**Week 1:** - Repo setup (client/server shared types). - Basic
encryption module (`crypto.ts`). - Minimal backend routes for notes.

**Week 2:** - Planner + patient linking. - Local key storage
(IndexedDB). - Simple auth placeholder.

**Week 3:** - Budgeting module. - Export feature.

**Week 4:** - Attachments & storage quota. - Cleanup + deploy POC to
OVH.

------------------------------------------------------------------------

## 6. Security & Compliance Checklist

-   🔐 Client-side encryption (AES-GCM, 256 bits).
-   🔑 Argon2id key derivation from passphrase.
-   ☁️ EU-only hosting.
-   🧱 Separation between confidential (encrypted) & operational data.
-   🪪 No plaintext identifiers in backend.
-   🗑️ Hard delete = remove ciphertext + wrapped key.
-   🧮 Backups tested; contain only ciphertext.
-   ⚠️ Warning when uploading files (privacy reminder + quota impact).

------------------------------------------------------------------------

## 7. Future Extensions

-   Multi-device key recovery (wrapped TMK restore).
-   Shared notes between professionals (key exchange).
-   Offline local LLM integration for anonymized summaries.
-   Optional certified hosting (HDS/ISO 27001) when scaling.

------------------------------------------------------------------------

**Current milestone:** M1 (Core Encryption + Note Saving)

Next steps: 1. Scaffold repo (client/server shared types). 2. Implement
basic `crypto.ts` encrypt/decrypt. 3. Create `/api/notes` endpoint. 4.
UI to create and display encrypted notes.
