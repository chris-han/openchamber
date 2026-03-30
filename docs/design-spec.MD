# Semantier Studio PRD

## Document Control

- Version: v1.0
- Status: Draft
- Date: 2026-03-30
- Source normalized from: `v0/Enterprise-Architecture-House-Components-Explained.md`

## 1. Product Summary

Semantier Studio is an AI-native workspace for authoring, validating, and simulating SDSL (Semantier Domain Specific Language) used for deterministic finance, tax, and management-accounting logic. The product combines a code editor, a visual topology canvas, and an AI copilot that can suggest and validate logic without becoming the system of record for business truth.

The MVP must prioritize determinism, auditability, and operator control over generic chat convenience. AI is an assistant layer on top of canonical ontology facts, validation tools, and explicit human approval.

## 2. Problem

Teams designing finance and tax logic currently work across fragmented tools:

- code or rule authoring is separate from visual reasoning
- validation is delayed and often manual
- AI coding tools generate plausible but unverifiable logic
- business logic assets are difficult to audit, trace, and reuse

This leads to slow iteration, high review cost, and low trust in AI-generated outputs for high-stakes financial workflows.

## 3. Why Now

- AI-native editors have normalized real-time copilot interaction, but most optimize for generic code generation rather than deterministic logic authoring.
- Finance and tax automation products need transparent rule provenance, not opaque generation.
- A focused SDSL workspace can create a defensible product wedge by combining editor UX, ontology-grounded generation, and validation in one loop.

## 4. Product Goal

Enable a user to create, edit, validate, and apply deterministic SDSL logic in a single workspace where every AI suggestion is grounded in ontology data, validated before acceptance, and traceable after execution.

## 5. Success Metrics

### Primary

- Reduce time to first valid SDSL rule by 60% versus manual authoring baseline.
- Achieve at least 90% acceptance rate for AI suggestions that pass deterministic validation.
- Ensure 100% of accepted AI-generated rules have provenance metadata linking suggestion, tool checks, and final user approval.

### Secondary

- User can move from prompt to accepted ghost-text suggestion in under 3 seconds for common authoring tasks.
- User can identify the ontology or validation source behind any accepted suggestion in one click.
- Less than 5% of accepted suggestions require rollback due to logic or ontology mismatch.

## 6. Target Users

- Domain experts authoring finance, tax, or management-accounting logic
- Solution architects designing ontology-backed rule systems
- Reviewers and auditors who need explainable logic provenance
- Internal operators maintaining tenant-specific logic assets

## 7. Product Principles

- Determinism over fluency: AI must never be the final authority.
- Ontology-first generation: business truth comes from canonical ontology and rule assets.
- Human-in-the-loop: users accept, reject, or edit every material change.
- Single interaction channel: streaming updates should flow through one consistent request/response path.
- Portable architecture: implementation should start in standard Node.js and remain Edge-ready.

## 8. In Scope

### MVP

- SDSL authoring in Monaco Editor
- Visual topology view in React Flow with code-to-canvas synchronization
- AI sidebar/copilot for suggestion, explanation, and correction flows
- Single-channel streaming transport for AI responses
- Tool-gated ontology lookup before rule generation
- Static logic validation before suggestion acceptance
- Ghost-text suggestions in editor with explicit accept/reject flow
- Inline validation and provenance feedback in the UI
- User feedback controls on AI responses
- Multi-tenant-ready storage abstraction for ontology and SDSL assets
- Deployment on standard Node.js infrastructure with future Edge migration compatibility

### Post-MVP

- Shared multi-user editing
- advanced workflow automation beyond SDSL authoring and validation
- full autonomous rule-writing without review
- production-grade marketplace or plugin ecosystem

## 9. Out of Scope

- General-purpose website or app generation
- unrestricted package installation or arbitrary code execution as a product requirement
- full LSP parity with a mature IDE in the MVP
- replacing domain review with autonomous AI approval
- storing canonical business truth in local disk-only runtime state

## 10. User Stories

- As a domain expert, I want AI to suggest valid SDSL based on my current code and ontology so I can author faster without losing correctness.
- As a reviewer, I want every accepted rule to show what ontology facts and validations were used so I can trust the output.
- As an operator, I want tenant logic assets to be stored behind an abstraction layer so deployment can evolve without rewriting business logic.
- As a user, I want visual feedback on the topology impact of a suggested rule so I can understand consequences before acceptance.
- As a product team, we want a single streaming interaction model so frontend and backend complexity stays manageable.

## 11. Experience Overview

The user works in a three-part workspace:

- Monaco Editor for SDSL authoring
- AI sidebar for prompt, streaming suggestions, and explanation
- React Flow canvas for topology and mapping visualization

The expected core loop:

1. The user edits or highlights SDSL.
2. The workspace sends current editor and topology context through one streaming channel.
3. The AI system retrieves ontology context and required validation tools.
4. The AI returns suggestions, rationale, and UI events progressively.
5. Monaco shows ghost text or inline diagnostics.
6. The user accepts, edits, or rejects the suggestion.
7. The system records provenance and feedback.

## 12. Functional Requirements

### 12.1 Workspace Shell

- The product must provide a browser-based workspace with editor, sidebar, and visual canvas.
- The UX shell must be built by forking OpenChamber (`github.com/chris-han/openchamber`), an MIT-licensed OpenCode frontend that already implements the OpenCode SDK connection layer, session management, branchable chat timeline, tool-call UI cards, diff viewer, permission dialogs, and theme plugin system.
- The fork must be maintained on a `semantier` branch and must continue pulling upstream `openchamber/openchamber:main` for SDK and UX improvements.
- Semantier extends the fork by adding: a Monaco Editor pane, a React Flow canvas pane, SDSL-aware tool result cards, a provenance panel, an ontology browser panel, and UNICELL warm-first theme via the existing `vite-theme-plugin.ts` mechanism.
- OpenCode's own TUI, CLI, and web client surfaces must not appear to the Semantier end user; Semantier owns the workspace UX end-to-end.
- The implementation must not depend on WebContainer-specific behavior or browser-local filesystem assumptions.

### 12.2 Editor

- Monaco Editor must be the default code editor.
- The editor must support SDSL syntax highlighting in MVP.
- The editor must display ghost-text suggestions and inline error markers.
- The editor must allow explicit accept, reject, and manual edit after AI suggestion.
- The editor must support Monaco glyph-margin and whole-line decorations for semantic diagnostics and rule-status feedback.
- The MVP editor language package must include Monarch-style tokenization for core SDSL keywords including `DIMENSION`, `MAP`, `BIND`, and `ASSERT`.
- Semantic diagnostics must be source-mapped to concrete file and line metadata so agent or validator feedback can target the exact SDSL rule that failed.

### 12.3 Visual Canvas

- React Flow must visualize logical relationships and mapping topology.
- The canvas must reflect accepted code changes and validation outcomes.
- The canvas should show provisional or dashed paths for unaccepted AI suggestions when feasible.

### 12.4 AI Copilot

- The copilot must support streaming responses over a single-channel transport.
- The copilot must expose user feedback controls for each assistant output.
- The copilot must surface intermediate states such as ontology lookup and validation activity.
- The copilot must prefer precise, bounded suggestions over large speculative rewrites.
- The MVP interaction channel baseline must use Vercel AI SDK and must not require CopilotKit runtime primitives as a core dependency.
- The agent session host must be OpenCode, embedded via the OpenCode SDK. Semantier creates and manages OpenCode sessions programmatically; it does not expose OpenCode's own TUI, web, or CLI surfaces to the end user.
- Context must be injected into the active session using `session.prompt` with `noReply: true` on each meaningful editor or ontology state change, so the agent always reasons from live data.
- Suggestions must be requested using `session.prompt` with a typed JSON schema format so responses are structured SDSL objects, not untyped prose.
- Semantier must subscribe to the OpenCode SSE event stream (`event.subscribe()`) to map tool-call events to Monaco ghost text, status badges, and React Flow provisional edges in real time.
- Copilot context snapshots must include, at minimum, the active SDSL buffer, the visible topology snapshot, and the relevant tenant-scoped ontology context.
- User feedback controls should use optimistic UI semantics: the local reaction state updates immediately, then a background write persists the associated `checkpoint_id` or equivalent provenance handle.
- Assistant message rendering should remain brand-controlled and headless-composable; the baseline stack may use shadcn/Radix primitives, Lucide icons, Shiki-highlighted code blocks, and Framer Motion where motion materially improves feedback clarity.

### 12.5 Deterministic Generation Contract

- AI must query canonical ontology data before generating material SDSL suggestions.
- AI must validate generated logic before presenting it as ready for acceptance.
- The system must enforce core logic constraints including predicate existence, arity compatibility, namespace correctness, and variable safety.
- The system should support additional checks for recursion, negation safety, and other Datalog-specific constraints where available.
- The logic model is authoritative under a Closed World Assumption: if a required fact cannot be proven from canonical tenant data and accepted rules, the system must treat that fact as unavailable rather than inventing it.
- Every financial or compliance conclusion must be traceable to a specific accepted rule and the ontology facts used to derive it.
- The canonical logic separation must distinguish:
  - EDB: tenant-scoped atomic facts and ontology state
  - IDB: SDSL derivation rules and assertions
- The SDSL surface must support these core primitives as authoritative MVP concepts:
  - `DIMENSION`: semantic field declaration
  - `MAP`: raw business-event to semantic/accounting mapping
  - `BIND`: assignment of values or tags inside a mapping context
  - `ASSERT`: reconciliation or constraint rule
- The system must reject unsafe or paradox-prone logic, including non-stratified negation and rule heads whose variables are not bound in a positive body predicate.
- The reasoning architecture should remain separable into:
  - domain logic execution
  - semantic correlation across finance, tax, and management dimensions
  - simulation/version replay of events against logic revisions

### 12.6 Tooling

- The platform must expose an ontology schema lookup capability.
- The platform must expose a logic validation capability.
- Tool results must be visible or inspectable by the user when they materially affect a suggestion.
- The canonical tool contract must include `get_ontology_schema` and `validate_datalog_logic`.
- `get_ontology_schema` must accept an object-shaped input with a required `namespace` field.
- The `namespace` field for `get_ontology_schema` must support constrained lookup at minimum for `core`, `fin`, `tax`, and `mgt`.
- `validate_datalog_logic` must accept an object-shaped input with a required `code` string field containing the candidate SDSL to validate.
- For material SDSL suggestions, generation must execute in deterministic order: schema lookup first, validation second, suggestion emission third.
- The internal validator must preserve or return source-location metadata so failures can be rendered as code-local diagnostics.
- If the external/MCP surface is implemented, Semantier should additionally expose compatibility tools for syntax validation and business-event simulation, normalized behind the same canonical validation engine rather than a second logic authority.

### 12.10 A2UI Bridge Contract

- The frontend must support a typed Agent-to-UI (A2UI) directive bridge so structured UI instructions can be rendered without treating model prose as executable UI state.
- The A2UI bridge must parse and validate directives from the same single-channel stream and reject malformed directives explicitly.
- Minimum UI event classes that must be representable are: tool status, validation error, code suggestion, topology sync hint, and code-highlight signal.
- A2UI events that affect accepted state must be traceable in provenance records together with tool evidence.
- The canonical message envelope for agent-emitted UI directives must be an object with:
  - `type`: must equal `a2ui-directive`
  - `version`: protocol version string
  - `action`: directive type identifier
  - `payload`: typed directive payload
- The initial authoritative action set must support at minimum:
  - `SYNC_LOGIC_TO_UI`
  - `UPDATE_PROP`
  - `HIGHLIGHT_CODE_ERROR`
- `SYNC_LOGIC_TO_UI` payloads must support `target_file` and an ordered `components` array.
- `HIGHLIGHT_CODE_ERROR` payloads must support `file`, `line`, `severity`, and `message`.
- The canonical A2UI component registry must include:
  - `SemanticInput`: ontology-backed semantic input with `predicate`, `label`, and `required`
  - `CurrencyField`: amount input with `currency`, `precision`, and optional masking behavior
  - `LogicBadge`: assertion-state feedback with `rule_id`, `status`, and `delta`
  - `TaxEffectCard`: tax-impact visualization with `category`, `impact_ratio`, and descriptive copy
  - `DimensionTree`: hierarchy selector with `hierarchy` and `values`
- Every A2UI component `id` must map deterministically to a rule, predicate, or other canonical logic identifier; orphan UI components are invalid.
- The frontend must not invent authoritative business state locally. Any material enablement, disablement, or reconciliation status must be driven by logic-engine output carried through the A2UI contract.
- The bridge must support the semantic feedback loop:
  1. user edits a rendered semantic control
  2. the change is reported back through the single interaction channel
  3. validation or inference reruns against canonical logic
  4. the resulting directive stream updates UI state and, if needed, Monaco diagnostics
- The implementation must maintain a deterministic component projection: later authoritative `SYNC_LOGIC_TO_UI` directives replace prior projected component state for the same target rather than merging ad hoc prose-derived fragments.

### 12.11 MCP Boundary Contract

- The primary OpenCode ↔ Semantier integration path is SDK embedding (§12.1, §12.4); MCP is not required for this path.
- Semantier may optionally expose an MCP-compatible server boundary for external consumers (third-party models, tooling integrations) that need access to ontology schema, active logic views, or validation entry points.
- If the MCP boundary is implemented, it must remain a read/tool interface for external callers only and must not become a second authoritative interaction channel for the embedded editor/copilot session.
- If implemented, the MCP resource surface should include canonical read views for `ontology/schema` and `logic/active-rules`.
- If implemented, the MCP tool surface should include normalized external entry points equivalent to syntax validation and simulation flows, such as `validate_sdsl_syntax` and `simulate_cbe_flow`, without duplicating runtime transition or logic authority.

### 12.12 Node-First, Edge-Ready Coding Contract

- Core business logic modules must avoid Node-only runtime dependencies (`fs`, `path`, long-lived TCP DB clients) so the same modules can execute in Edge or hybrid runtimes.
- Canonical asset access must go through storage provider interfaces; no direct filesystem reads for tenant truth in production.
- Transport code should prefer standards-based APIs (`fetch`, Web Streams, Web Crypto-compatible patterns) across runtime boundaries.
- Core modules should be ESM-compatible and avoid CommonJS-only assumptions in portability-critical paths.
- Database access patterns should be compatible with stateless or HTTP-capable connectivity for future Edge migration.
- Core parsers, validators, and inference modules must be written as pure logic functions over strings or objects so they can run unchanged in browser, Node.js, or Edge environments.
- Edge-targeted runtime paths must assume bounded memory and execution time; heavyweight audit or end-of-period jobs may remain on Node.js workers while real-time validation paths migrate first.
- Tenant routing at the edge or gateway layer should derive `tenant_id` from authenticated request context and resolve only tenant-authorized ontology and rule assets.

### 12.7 Provenance and Auditability

- Every accepted suggestion must capture source prompt, relevant context snapshot, tool calls, validation status, and final user action.
- Users must be able to inspect why a suggestion was made and what facts supported it.
- Audit records must be tenant-scoped and retained independently of ephemeral UI state.
- Provenance records should include the directive or checkpoint handle needed to associate user feedback, approvals, and later review activity with the exact assistant output that triggered them.
- Version history must support logic rollback or replay against prior rule sets for audit and simulation use cases.

### 12.8 Storage and Data Model

- `ontology.json` and SDSL assets must be accessed through a storage abstraction rather than direct filesystem dependency.
- The storage contract must support multi-tenant isolation.
- The MVP may store assets in a database-backed system even if local development uses seeded fixtures.
- The canonical SaaS data model must store tenant-scoped ontology facts, SDSL assets, and audit records in durable backend storage with explicit `tenant_id` ownership.
- Database-level isolation should support row-level enforcement patterns rather than per-tenant database proliferation by default.
- The system should preserve versioned logic assets so different tenants or time windows can replay against different approved rule revisions when required.

### 12.9 Deployment

- The first production-capable deployment path must run on standard Node.js infrastructure.
- Core logic modules must remain Edge-ready by avoiding hard dependency on Node-only APIs in business logic.
- Network and storage interfaces should use standards-compatible APIs where feasible.
- The production deployment path must not rely on ephemeral instance disk for canonical ontology or SDSL truth.
- A hybrid migration path is valid and expected:
  - standard Node.js first for full-featured runtime and debugging
  - selective Edge migration later for latency-sensitive validation paths
  - retain heavier jobs on Node.js where runtime limits make Edge a poor fit

## 13. Non-Functional Requirements

### Performance

- Streaming must begin quickly enough to feel interactive for common suggestion requests.
- Validation feedback must appear during the same user flow, not in a delayed batch job for standard authoring actions.

### Reliability

- The system must fail explicitly when ontology data or validator dependencies are unavailable.
- The UI must not silently accept unvalidated AI output.

### Security

- Tenant assets and context must remain isolated.
- AI suggestion context must be limited to authorized tenant data.
- Tenant-scoped retrieval and any vector or search augmentation must filter by `tenant_id` or an equivalent hard authorization boundary.

### Maintainability

- Core logic engine, storage, and transport layers must be separable.
- The product should support future migration from Node.js deployment to Edge or hybrid deployment without rewriting core rule logic.
- Validation, simulation, and UI projection contracts should share canonical schemas so external integration surfaces do not drift from the embedded product path.

## 14. Confirmed Technical Direction

The MVP should use the following baseline:

- Frontend shell: OpenChamber fork (`github.com/chris-han/openchamber`, `semantier` branch) — provides OpenCode SDK wiring, session timeline, tool-call cards, diff viewer, and theme system out of the box
- Editor: Monaco Editor (added as a new pane in the fork)
- Visual layer: React Flow (added as a new pane in the fork)
- AI transport: Vercel AI SDK
- UI primitives: OpenChamber's existing shadcn/headless component layer, extended with UNICELL warm-first theme via `vite-theme-plugin.ts`
- Supporting UI libraries: Radix primitives, Lucide icons, Shiki for code rendering, and Framer Motion where feedback motion improves operator comprehension
- Logic engine: deterministic SDSL generation and validation layer, independent of any one agent framework
- Backend runtime: standard Node.js first
- Portability rule: all core logic, storage access, and transport boundaries must remain Edge-ready for later migration
- Storage: database-backed abstraction for ontology and SDSL assets
- OpenCode integration: OpenCode SDK (`@opencode-ai/sdk`) embedded as agent session host; already implemented by OpenChamber shell
- MCP boundary: optional outbound interface for external consumers; not required for the primary editor/copilot path

OpenCode and Vercel AI SDK are the confirmed implementation baseline for this PRD. The architecture is Node-first and Edge-ready. All implementation work must preserve deterministic generation, auditability, and future portability to Edge deployment.

## 15. Key Tradeoffs and Decisions

- Choose single-channel streaming for frontend and backend interaction simplicity.
- Use custom or headless UI composition so the product remains brand-controlled and workflow-specific.
- Use OpenCode as the application shell.
- Optimize for trustworthy suggestion quality rather than maximum autonomous action surface.
- Do not make Bolt/WebContainer behavior the authority for canonical tenant assets or core rule execution semantics.
- Do not make CopilotKit a required runtime dependency for MVP copilot transport, state progression, or acceptance flow.
- Fork OpenChamber (`github.com/chris-han/openchamber`) as the UX shell baseline. Do not build the OpenCode SDK connection layer, session timeline, or tool-call UIs from scratch; extend the fork instead.
- Integrate OpenCode via the SDK embedding already present in OpenChamber. Do not surface OpenCode's TUI/web client or delegate UX control to it.
- MCP is an optional outbound boundary for external consumers. Do not make MCP the primary interaction channel between OpenCode and Semantier.
- Keep the typed A2UI envelope and component registry authoritative; do not let free-form assistant prose become executable UI state.
- Treat source-mapped semantic feedback into Monaco as a core product behavior, not an optional polish feature.

## 16. Risks

- Over-scoping into a full AI IDE would slow delivery and dilute the core finance-logic wedge.
- Depending too heavily on a borrowed shell could create architecture drag if shell assumptions conflict with multi-tenant SaaS needs.
- If ontology lookup and validation are not first-class, the product will collapse into a generic chat editor with low trust.
- Edge migration can become expensive later if Node-only dependencies leak into core logic too early.

## 17. Open Questions

- What is the exact first tenant segment and initial ontology complexity target?
- What is the minimum acceptable provenance record for regulated or audit-heavy use cases?
- Which validation checks are mandatory in MVP versus advisory?
- How much of the visual canvas must be editable in MVP versus read-only reflective?

## 18. Delivery Milestones

### Phase 1: Authoring Shell

**Goal:** Running three-panel workspace with v0 domain components ported into OpenChamber, with static topology — no AI wiring yet.

**Revised approach:** Port the already-polished domain components from `v0/components/semantier/` directly into the OpenChamber fork rather than building equivalent components from scratch. This collapses ~3 days of UI work into a single porting session.

New dependencies (add to `packages/ui`):
- `@xyflow/react` — React Flow v12 (required by `ontology-graph.tsx`)
- `dagre` + `@types/dagre` — auto-layout algorithm used by `ontology-graph.tsx`
- `react-resizable-panels` — resizable pane splits for `SemantierLayout`
- `@radix-ui/react-tabs` — required by ported shadcn `tabs.tsx`
- `@radix-ui/react-label` — required by ported shadcn `label.tsx`
- `@monaco-editor/react` — Monaco React wrapper (Phase 1 static; wired to session in Phase 2)

Ported from `v0/components/semantier/` (strip `"use client"`, fix import paths):
- `packages/ui/src/components/semantier/ontology-graph.tsx` — polished React Flow graph: custom node types, typed edge categories, side-aware chevron port handles, animated glow, dagre layout, legend
- `packages/ui/src/components/semantier/resource-explorer.tsx` — namespace tree (core/fin/tax/mgt), tabs for ontology/dimensions/rules
- `packages/ui/src/components/semantier/semantic-editor.tsx` — tab-split: SDSL code view + React Flow graph; code display replaced with Monaco in Phase 2
- `packages/ui/src/components/semantier/properties-panel.tsx` — reconciliation alerts, version history, property field inspector
- `packages/ui/src/components/semantier/header.tsx` — app chrome: logo, command palette, Import/Export/Validate buttons

Ported shadcn components missing from openchamber (copy from `v0/components/ui/`):
- `tabs.tsx`, `badge.tsx`, `label.tsx`, `progress.tsx`, `separator.tsx` (verify others against actual usage)

New files:
- `packages/ui/src/components/layout/SemantierLayout.tsx` — three-panel layout: `ResourceExplorer` (left rail) + `SemanticEditor` center/bottom + `ChatView` right, using `react-resizable-panels`; replaces `MainLayout` in the non-embedded browser path of `App.tsx`
- `packages/ui/src/stores/useSdslStore.ts` — Zustand store: `buffer`, `setBuffer`, `ghostText`, `setGhostText`
- `packages/ui/src/stores/useTopologyStore.ts` — Zustand store: `nodes`, `edges`, `setTopology`

Modifications to existing files:
- `packages/ui/src/App.tsx` — swap `<MainLayout />` with `<SemantierLayout />` in the non-embedded browser render path
- `packages/ui/src/styles/design-system.css` — add Semantier IDE token block (`--editor-bg`, `--node-bg`, `--node-border`, `--warning`, `--success`, `--info`) ported from v0 `globals.css`; add as `semantier-dark` theme class

Deliverable gate: user can open the app, see three panels (resource tree, ontology graph + code view, chat), interact with the React Flow graph, and have the chat timeline remain fully functional.

### Phase 2: Deterministic Copilot

**Goal:** Live AI suggestion loop — ontology lookup, validation, ghost text, SSE-driven status badges.

- Wire `useOpenCodeSession.injectContext` to Monaco `onChange` so the active session always reflects the live SDSL buffer and ontology snapshot.
- Register `get_ontology_schema` and `validate_datalog_logic` custom tools (scaffolded in Phase 1) backed by Semantier's internal modules.
- Subscribe to `event.subscribe()` SSE stream; map `tool.start` / `tool.result` events to Monaco glyph-margin status badges and ChatView tool-call cards.
- Add `SdslValidationCard.tsx` and `OntologySchemaCard.tsx` in `components/chat/` to replace the generic tool output renderer for the two canonical tools.
- Wire `session.prompt` with JSON schema format to a "Suggest" trigger; render structured SDSL response as Monaco ghost text via `setGhostText`.
- Stand up optional MCP outbound boundary for external consumers if integration scope requires it.

### Phase 3: Visual and Audit Loop

- Bind accepted suggestions to React Flow updates and provenance records.

### Phase 4: Multi-Tenant Hardening

- Move asset access fully behind storage abstraction and prepare Node-to-Edge portability path.

## 19. Launch Criteria

- Users can author and accept validated SDSL suggestions end to end.
- Provenance is recorded for all accepted AI-assisted changes.
- The product runs in standard Node.js production infrastructure without direct filesystem dependency for canonical tenant assets.
- The system demonstrates one complete editor-to-validation-to-visualization loop with deterministic behavior.

## 20. Source-to-PRD Traceability Appendix

This appendix maps high-signal technical commitments from the source conversation export to their authoritative PRD sections.

| Source Commitment (from normalized source) | PRD Authority Section(s) | Coverage |
| --- | --- | --- |
| OpenCode is the workspace shell baseline | 12.1, 14, 15 | Complete |
| Vercel AI SDK is the single-channel transport baseline | 12.4, 14, 15 | Complete |
| Node-first implementation with Edge-ready migration path | 7, 12.9, 12.12, 14, 16 | Complete |
| Avoid WebContainer-specific runtime assumptions for canonical implementation | 12.1, 15 | Complete |
| Deterministic generation requires ontology lookup and validation before acceptance | 12.5, 12.6, 18 | Complete |
| Canonical tooling names and object-shaped parameter schemas include get_ontology_schema and validate_datalog_logic | 12.6 | Complete |
| A2UI-style typed UI directive bridge for structured agent-driven UI feedback, including directive envelope and action contract | 12.10 | Complete |
| Component-level A2UI registry for SemanticInput, CurrencyField, LogicBadge, TaxEffectCard, and DimensionTree | 12.10 | Complete |
| Semantic feedback loop from generated UI back to logic validation and Monaco diagnostics | 12.2, 12.10, 15 | Complete |
| OpenChamber fork (`github.com/chris-han/openchamber`, `semantier` branch) as UX shell; extends with Monaco, React Flow, SDSL tool cards, provenance panel, UNICELL theme | 12.1, 14, 15, 18 | Complete |
| OpenCode SDK embedded as agent session host (already in OpenChamber); context injected via noReply prompts; structured output via JSON schema format | 12.1, 12.4, 14, 15, 18 | Complete |
| MCP is optional outbound boundary for external consumers; not the primary OpenCode↔Semantier integration path | 12.11, 14, 15 | Complete |
| MCP-compatible resources and tool names for external schema, active-rule, syntax-validation, and simulation access | 12.11 | Complete |
| Tenant-scoped audit/provenance, row-level storage isolation, and versioned ontology/SDSL assets | 12.7, 12.8, 13 (Security), 19 | Complete |
| Monaco + React Flow editor/canvas loop with ghost text, glyph diagnostics, and topology sync | 11, 12.2, 12.3, 18, 19 | Complete |
| Closed-world deterministic logic model, EDB/IDB split, SDSL primitive set, and safety constraints | 12.5 | Complete |
| Rejected as authority: CopilotKit runtime dependency and Bolt/WebContainer as canonical runtime authority | 12.4, 15 | Complete |

### Notes on Normalization

- The source document contains multiple exploratory branches (CopilotKit path, Bolt/WebContainer path, OpenCode SaaS path).
- This PRD is intentionally normalized to one authoritative baseline: OpenCode + Vercel AI SDK, Node-first and Edge-ready.
- Exploratory alternatives are retained only as historical context and are not implementation authority for this PRD.
