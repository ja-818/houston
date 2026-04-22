# houston-engine-protocol

Wire types for the Houston Engine. One crate, two consumers:

1. `houston-engine-server` — Rust side of the server.
2. `@houston-ai/engine-client` — TypeScript side of every client.

This crate is the **source of truth**. If TS types drift from these, the
TS types are wrong.

## Contents

- `EngineEnvelope` — every WebSocket frame.
- `EnvelopeKind` — `event | req | res | ping | pong`.
- `ClientRequest` — `sub` / `unsub` ops.
- `LagMarker` — backpressure signal.
- `ErrorBody` + `ErrorCode` — REST error responses.
- `HealthResponse`, `VersionResponse` — endpoint DTOs.
- Constants: `PROTOCOL_VERSION`, `ENGINE_VERSION`, `HEADER_ENGINE_VERSION`.

See `knowledge-base/engine-protocol.md` for the full reference.
