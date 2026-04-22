# DisclaimerGate — wiring

Agent D1 intentionally did **not** edit `app/src/main.tsx` (agent B is
also touching it for the i18n provider). The orchestrator merges both
by adding the gate to the render tree in `main.tsx`.

## Final render tree

```tsx
<QueryClientProvider client={queryClient}>
  <ErrorBoundary>
    <EngineGate>
      <I18nProvider>        {/* agent B */}
        <DisclaimerGate>    {/* agent D1 */}
          <App />
        </DisclaimerGate>
      </I18nProvider>
    </EngineGate>
  </ErrorBoundary>
</QueryClientProvider>
```

## Imports to add to `main.tsx`

```ts
import { DisclaimerGate } from "./components/shell/disclaimer-gate";
```

## Ordering rules (do not reorder)

1. `QueryClientProvider` — `DisclaimerGate` uses TanStack Query, so it
   must sit inside the provider. `main.tsx` already wraps the tree in
   `<QueryClientProvider client={queryClient}>` — no new provider
   needed.
2. `EngineGate` — the gate reads/writes the engine preference
   `legal_acceptance`, so the engine handshake must complete first.
3. `I18nProvider` (agent B) — if/when copy is localized, it must sit
   outside the gate so translations resolve inside it.
4. `DisclaimerGate` — last wrapper before `<App />`.

If agent B's `I18nProvider` also needs TanStack Query it can sit in
either order relative to `DisclaimerGate` as long as both stay inside
`EngineGate`.
