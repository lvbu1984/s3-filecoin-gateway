// validate.go
//
// Phase 1 frozen responsibility:
// - Validate S3 request semantics
// - Handle Expect: 100-continue
// - Reject invalid requests early
//
// Forbidden in this file:
// - Reading request body
// - Creating any persistent state
// - Any MK20 interaction

