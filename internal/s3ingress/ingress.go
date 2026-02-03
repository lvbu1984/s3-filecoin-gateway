// ingress.go
//
// Phase 1 frozen responsibility:
// - Receive HTTP requests
// - Parse request line (method / path)
// - Extract bucket and object-key
//
// Forbidden in this file:
// - Reading request body
// - Any storage or metadata operation
// - Any Core or MK20 logic

