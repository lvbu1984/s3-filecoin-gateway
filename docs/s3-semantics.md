# S3 Semantics in S3–Filecoin Gateway

This document defines the **authoritative semantic behavior** of the S3–Filecoin Gateway.
All implementations MUST follow the rules described here.

This gateway does NOT implement S3 itself.
It implements a well-defined subset of S3 object semantics and translates them
into Filecoin-based storage actions.

---

## Core Principles

### 1. Separation of Concerns

- **S3 Semantics** define object visibility and behavior.
- **Metadata** defines which object is currently visible.
- **Filecoin** defines where data exists and how it is retrieved.

The gateway is responsible for maintaining correct S3 semantics,
not for managing Filecoin data lifecycle.

---

### 2. Identity Model

- In S3, an object is identified by `(bucket, key)`.
- In Filecoin, data is identified by `CID`.
- The gateway maintains a mapping between `(bucket, key)` and the current `CID`.

Filecoin never knows about S3 keys.
S3 clients never see CIDs.

---

## PutObject Semantics

### Behavior

When a client performs `PutObject(bucket, key, data)`:

1. The gateway validates the S3 request.
2. The object data is sent to the Filecoin storage layer.
3. Filecoin stores the data and returns a CID.
4. The gateway writes a metadata entry mapping `(bucket, key)` to the returned CID.
5. The gateway returns a successful PutObject response to the client.

### Rules

- Metadata MUST NOT be written before a CID is obtained.
- Each PutObject generates a new CID in Filecoin.
- If `(bucket, key)` already exists, the previous mapping is overwritten.
- Only the latest CID is considered the current object.

Old CIDs MAY continue to exist in Filecoin but are no longer visible through S3.

---

## GetObject Semantics

### Behavior

When a client performs `GetObject(bucket, key)`:

1. The gateway queries metadata for the current CID associated with `(bucket, key)`.
2. If no mapping exists, the object is considered not found.
3. The gateway retrieves data from Filecoin using the CID.
4. The data is returned to the client unchanged.

### Rules

- Metadata is the single source of truth for object visibility.
- Filecoin retrieval is always performed using CID.
- Gateways MUST NOT bypass metadata when serving GetObject.

---

## DeleteObject Semantics

### Behavior

When a client performs `DeleteObject(bucket, key)`:

1. The gateway removes or invalidates the metadata mapping for `(bucket, key)`.
2. The object becomes logically invisible to S3 clients.

### Rules

- DeleteObject MUST NOT delete data from Filecoin.
- DeleteObject affects visibility, not physical data existence.
- Data MAY continue to exist in Filecoin after deletion.

---

## Summary

- **Metadata determines visibility.**
- **Filecoin determines existence.**
- **The gateway enforces S3 semantics.**

This document represents the canonical semantic contract of the S3–Filecoin Gateway.

