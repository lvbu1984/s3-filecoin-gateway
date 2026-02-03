# Architecture Overview

This document describes the high-level architecture and design principles of the
S3–Filecoin Gateway reference implementation.

The goal of this project is to provide a clear and auditable integration layer
that allows existing S3-compatible tools to interact with Filecoin-based storage,
without modifying existing workflows.

## System Components

At a high level, the gateway is composed of the following logical components:

1. **S3-Compatible Gateway Layer**
2. **Metadata & Indexing Layer**
3. **Filecoin Storage Integration Layer**
4. **External Storage Infrastructure (FWSS / PDP)**

### 1. S3-Compatible Gateway Layer

This layer exposes a limited, well-defined subset of the S3 API over HTTP.

Responsibilities:
- Accept standard S3 client requests (e.g. PutObject, GetObject)
- Validate request structure and basic semantics
- Translate S3 object operations into internal storage actions

Out of scope:
- Authentication and access control
- Full S3 API compatibility
- SLA, billing, or performance guarantees

### 2. Metadata & Indexing Layer

This layer maintains object metadata required to support S3-style object listing
and lookup semantics.

Responsibilities:
- Map S3 bucket/key pairs to internal object identifiers
- Store object metadata (size, timestamps, CID references)
- Support prefix-based listing and pagination

Out of scope:
- Acting as a general-purpose database
- Strong transactional guarantees across objects

### 3. Filecoin Storage Integration Layer

This layer is responsible for translating internal storage actions into
Filecoin-native operations.

Responsibilities:
- Interact with Filecoin Pin or equivalent warm storage services
- Manage object-to-CID mapping
- Handle upload, retrieval, and logical deletion workflows

Out of scope:
- Direct sector management
- Deal lifecycle optimization
- Retrieval market tuning

### 4. External Storage Infrastructure (FWSS / PDP)

This layer represents external Filecoin storage infrastructure and services
that physically store and serve the data.

Responsibilities:
- Provide warm storage and retrievability guarantees
- Participate in PDP-based verification workflows

The gateway treats this layer as an external dependency and does not assume
direct control over its internal behavior.

