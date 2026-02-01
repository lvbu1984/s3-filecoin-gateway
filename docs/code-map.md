# Code Map — S3–Filecoin Gateway

This document provides a **structural and semantic map** of the codebase.
Its purpose is to clearly distinguish:

- Core Gateway logic
- Gateway-adjacent infrastructure
- Legacy code inherited from earlier VaultX development

This document is **descriptive**, not prescriptive.
It does NOT change behavior, but defines how the codebase should be understood
and evolved.

---

## Design Reference

This codebase implements a **reference-grade S3–Filecoin Gateway**.

Conceptually, the gateway is structured into four layers:

1. **S3 Interface Layer** — user-facing S3 semantics
2. **Metadata Layer** — object visibility and indexing
3. **Translation Layer** — mapping S3 actions to Filecoin actions
4. **Storage Layer** — external Filecoin / FWSS / PDP systems

Only layers 1–3 are implemented in this repository.
The storage layer is external.

---

## Directory Classification Overview

The `src/` directory is classified into three categories:

- 🟢 **Gateway Core** — essential to S3–Filecoin Gateway behavior
- 🟡 **Gateway-Adjacent** — reusable infrastructure, but not core logic
- 🔴 **Legacy (VaultX)** — historical code not aligned with gateway scope

This classification guides future refactoring and cleanup.

---

## 🟢 Gateway Core (Must Be Preserved)

These directories constitute the **functional heart** of the gateway.
All S3 semantic guarantees defined in `docs/s3-semantics.md` must be enforced here.

### `src/api/`
**Role:** S3-facing API surface

- Defines external API shapes and request models
- Represents the user-facing S3 interface layer
- Must remain aligned with documented S3 semantics

---

### `src/routes/`
**Role:** HTTP routing and request dispatch

- Maps HTTP routes to controllers
- Contains no business logic
- Serves purely as a routing layer

---

### `src/controllers/`
**Role:** S3 operation orchestration

- Implements high-level flows for:
  - PutObject
  - GetObject
  - DeleteObject
- Coordinates metadata access and Filecoin interaction
- Enforces operation ordering defined by S3 semantics

This is the primary enforcement point for gateway behavior.

---

### `src/services/`
**Role:** Atomic business actions

- Implements reusable service-level operations
- Independent of HTTP and routing
- Encapsulates translation logic between S3 semantics and storage actions

---

### `src/store/`
**Role:** Metadata and object visibility layer

- Maintains mappings between `(bucket, key)` and current CID
- Serves as the single source of truth for object visibility
- Storage backend is abstracted and replaceable

---

## 🟡 Gateway-Adjacent (Reusable, Subject to Refinement)

These components support the gateway but are not part of its semantic core.

### `src/adapters/`
**Role:** External system adapters

- Wraps Filecoin / Pin / SDK interactions
- Acts as a boundary between gateway logic and external storage systems

Note:
- Some implementations may originate from VaultX-era code
- Adapter abstractions are valid, but implementations may require cleanup

---

### `src/models/`
**Role:** Shared data structures and schemas

- Defines DTOs, type definitions, and shared models
- May be reused across layers

Note:
- Must be reviewed to ensure no VaultX-specific product assumptions remain

---

## 🔴 Legacy Code (VaultX-Originated)

These directories originate from earlier VaultX product development
and are not part of the intended S3–Filecoin Gateway scope.

They are currently retained for reference only.

### `src/internal/`
**Status:** Legacy

- Contains internal product logic
- Not aligned with gateway reference goals
- Candidate for future removal or archival

---

### `src/cli/`
**Status:** Legacy / Out of Scope

- Implements CLI-based workflows
- CLI tooling is not part of the gateway service model
- Should be extracted or removed in later phases

---

## Cleanup Strategy (Non-Immediate)

No deletions are performed as part of this document.

Future cleanup should follow this order:

1. Preserve Gateway Core without modification
2. Refactor or slim Gateway-Adjacent code
3. Isolate and eventually remove Legacy code

All cleanup actions should be performed in separate commits.

---

## Summary

- **Gateway Core** defines authoritative behavior
- **Metadata governs visibility**
- **Adapters isolate external dependencies**
- **Legacy code is acknowledged, not ignored**

This document serves as the **canonical map** of the codebase
for maintainers, reviewers, and contributors.

## Note on VaultX Legacy Naming

Some identifiers, variable names, and internal abstractions in the codebase
still reference "VaultX".

These references originate from earlier internal development and do NOT
indicate a dependency on any VaultX product or service.

They are considered **legacy naming artifacts** and will be incrementally
renamed or removed in later refactoring phases, once gateway semantics and
behavior are fully stabilized.

