# S3–Filecoin Gateway (Reference Implementation)

This repository contains an early-stage, **reference-quality S3-compatible Gateway**
that translates standard S3 object semantics into Filecoin-based storage actions.

This project does **not** implement S3 itself, nor does it aim to be a production-grade
storage service. Its purpose is to serve as a clear, auditable integration layer
between existing S3 tooling and the Filecoin storage stack.

This branch represents the **early-stage implementation of a reusable S3-compatible object gateway**, designed to map standard S3 object storage semantics to Filecoin-based storage primitives.

The purpose of this work is to validate whether existing S3-based tools and workflows can interact with Filecoin storage with minimal friction, without requiring application-level changes.

This is **infrastructure-level work**, not a user-facing product.

---

## Scope of This Branch

This branch intentionally focuses on a **minimal but concrete subset of S3 object storage semantics**, including:

- Object upload (initial multipart support)
- Object listing
- Object retrieval
- Object deletion
- Basic object metadata indexing required for `ListObjects`

The goal is to establish a correct and inspectable foundation before expanding coverage or optimizing performance.

---

## Supported S3 Semantics (Early Stage)

The following S3-style operations are currently implemented at an early stage:

- **PutObject / Multipart Upload (initial implementation)**
- **GetObject**
- **ListObjects**
- **DeleteObject**

These operations are exposed via HTTP routes that mirror S3 object semantics and are designed to be compatible with standard S3 clients conceptually (e.g. aws-cli, SDKs), although full compatibility testing is ongoing.

---

## Architecture Overview

S3 Client  
→ S3-Compatible HTTP Routes  
→ Object Controllers  
→ Metadata Index (object list, lookup)  
→ Filecoin Storage Integration (Pin / Retrieval)

Key architectural principles:

- Explicit object semantics  
- Deterministic object handling  
- Minimal assumptions (no user accounts, billing, or product-specific logic)

---

## Key Components (Current Focus)

- S3-style object routes (list/read/delete, multipart entry points)
- Object controllers aligned with S3 object semantics
- A minimal persistent metadata index (currently a simple local store for clarity)

These components are sufficient to demonstrate a working object flow end-to-end.

---

## What Is Explicitly Out of Scope (for This Branch)

- Deal lifecycle management  
- Market / pricing / contract logic  
- Admin dashboards or statistics  
- User accounts, wallets, authentication, or billing  
- High availability, SLA guarantees, or production hardening  

This branch should be understood as **a reference-quality infrastructure foundation**, not a complete production system.

---

## Current Status

- Core S3 object semantics are implemented and testable  
- Multipart upload logic is present in an early form  
- Metadata indexing is functional but minimal  
- Filecoin storage integration is under active iteration  

---

## Intended Use

This code is intended to serve as:

- A technical validation of S3-to-Filecoin object mapping  
- A reusable starting point for ecosystem teams  
- A concrete basis for feedback  

It is **not** intended to be a hosted service or commercial offering.

---

## License

(To be determined)
