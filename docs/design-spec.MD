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

- Ontology metadata modeling (objects, properties, actions/behaviors)
- Relationship and ECA rule modeling in synchronized visual/declarative/textual views
- Test scenario input and event-flow simulation against mock/user-entered data
- Simulation approval workflow with deterministic evidence bundle
- AI scenario elicitation that produces a structured workflow specification + simulation test set
- WSP v1 -> langconfig handoff adapter contract (schema mapping, `.langconfig` projection, and local payload validation), without local runtime compilation
- SDSL authoring in a CodeMirror-based editor
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
- MVP tenant isolation baseline: all ontology/SDSL/provenance reads and writes must be tenant-scoped via `tenant_id`-aware service boundaries; deeper storage hardening can iterate later

**MVP boundary:** MVP ends at an approved workflow-spec checkpoint (schema/rules/simulation evidence) and does **not** require code generation/deployment of runtime tools.

### Post-MVP

- Shared multi-user editing
- advanced workflow automation beyond SDSL authoring and validation
- DeepAgent Python runtime code generation adapter from canonical workflow spec via langconfig
- LangGraph adapter optional/next
- Tool packaging, publish, and manifest-driven runtime loading
- full autonomous rule-writing without review
- production-grade marketplace or plugin ecosystem

## 9. Out of Scope

- General-purpose website or app generation
- unrestricted package installation or arbitrary code execution as a product requirement
- full LSP parity with a mature IDE in the MVP
- replacing domain review with autonomous AI approval
- storing canonical business truth in local disk-only runtime state

## 10. User Stories

- As a domain expert, I want AI to suggest valid ontology/SDSL structures based on current schema and rules so I can author faster without losing correctness.
- As a scenario designer, I want to enter test datasets and run event-flow simulation so I can verify the information architecture before implementation.
- As a reviewer, I want every approved checkpoint to include ontology facts, simulation evidence, and provenance so I can trust the output.
- As a solution architect, I want AI elicitation to transform real business narratives into a structured workflow spec and simulator-ready test set.
- As an operator, I want tenant logic assets to be stored behind an abstraction layer so deployment can evolve without rewriting business logic.
- As a product team, we want a single streaming interaction model and a single canonical workflow contract (WSP v1) so frontend/backend and generators do not drift.

## 11. Experience Overview

The user works in a layered workspace:

- Left rail: `ResourceExplorer`
- Center: `SemanticEditor` with five tabs (`schema`, `rules`, `sdsl`, `simulation`, `code`)
- Right panel: `ChatView`
- Bottom dock utility panes: `FilesView`, `TerminalView`, `DiffView`

The expected core loop:

1. The user models ontology metadata: objects, properties, and actions/behaviors.
2. The user models links/relationships and ECA rules.
3. The user enters test data for a scenario and runs simulation against the current ontology model.
4. The user versions and publishes/checkpoints the ontology snapshot.
5. The user chats with AI to elicit real-world business scenarios (for example, Contract-to-Cash and subflows like Cash Receiving to Book).
6. AI generates a structured workflow spec and test data that can be executed by the ontology event-flow simulator.
7. The user approves that simulation and information architecture capture enough data to complete the workflow.
8. Phase 2 post-approval integration (not an MVP release gate): the user may inspect/edit the derived LangConfig-compatible payload in the `code` tab and optionally push it to a specified LangConfig endpoint for import/smoke-test.
9. Post-MVP compiler pipeline: external compiler adapters generate ontology-driven DeepAgent Python runtime code, UI, and manifest from approved WSP v1 (langconfig adapter first; LangGraph adapter optional next); the user deploys and tests the compiled graph/tool as a loadable runtime artifact.

Steps 1-7 plus local adapter payload derivation/validation define MVP completion. Step 8 is a post-approval integration enhancement targeted for Phase 2 and is not required for MVP acceptance. Step 9 is Post-MVP.

## 12. Functional Requirements

### 12.1 Workspace Shell

- The product must provide a browser-based workspace with editor, sidebar, and visual canvas.
- The UX shell must be built by forking OpenChamber (`github.com/chris-han/openchamber`), an MIT-licensed OpenCode frontend that already implements the OpenCode SDK connection layer, session management, branchable chat timeline, tool-call UI cards, diff viewer, permission dialogs, and theme plugin system.
- The fork must be maintained on a `semantier*` branch family (for example `semantier`, `semantier3`) and must continue pulling upstream `openchamber/openchamber:main` for SDK and UX improvements.
- **Layout isolation rule (merge-safety):** Semantier MUST be implemented as a **separate layout component** (`SemantierLayout`) rendered via a new conditional branch in `App.tsx`, NOT by extending `MainLayout`'s `MainTab` type or `secondaryView` switch. Rationale: extending `MainTab` requires modifying 6+ upstream files (`useUIStore`, `MainLayout`, `router/types`, `useRouter`, `useKeyboardShortcuts`, `useMenuActions`) with high merge-conflict risk on every upstream pull; `SemantierLayout` touches exactly 1 upstream file (`App.tsx`, one `if`-branch) and composes its own internal view system.
- `SemantierLayout` must compose its internal workspace by **reusing MainLayout's standalone view components** (`ChatView`, `FilesView`, `TerminalView`, `DiffView`) as direct imports — these components are not coupled to MainLayout and can be rendered in any container.
- **Two-layer navigation model:** `SemantierLayout` owns the **shell-level panels** (left rail: `ResourceExplorer`; center: `SemanticEditor`; right: `ChatView`; bottom dock: utility panes for `FilesView`, `TerminalView`, `DiffView`). `SemanticEditor` owns the **center authoring tabs** (`'schema' | 'rules' | 'sdsl' | 'simulation' | 'code'`). These are distinct layers: shell-level panel visibility is managed by `SemantierLayout` via `useSemantierUIStore`; center tab selection is managed by `SemanticEditor` internally. Do not merge these into a single tab model.
- **TBox/ABox layer model:** The center authoring tabs map to two ontological layers:
  - **Meta layer (TBox):** `schema`, `rules`, `sdsl` — three synchronized views of the same ontology meta-artifact (visual, declarative, textual). Changes in any meta tab must propagate to the other two: add entity in graph → SDSL gets a new block → rules tab shows new available triggers.
  - **Application integration layer:** `code` — LangConfig adapter payload workspace for inspecting/editing derived `.langconfig` JSON and related supporting artifacts that project approved WSP semantics into a concrete workflow import contract.
  - **Simulation (meta-mode capability exposed as tab):** The meta layer includes simulation as a first-class UI tab (`simulation`) that executes mock/user-entered ABox instances against current TBox definitions. Simulation feeds results back as warnings on graph nodes, diagnostics in the SDSL gutter, and reconciliation alerts in the properties panel. Simulation validates meta design decisions without requiring real instance data. The `semantier2` reconciliation tab (勾稽) is conceptually a simulation output — reframe it explicitly as such on port.
- **Properties panel modes:** The properties panel (`PropertiesPanel`) must be context-aware:
  - When a node/edge is selected in meta tabs (`schema`, `rules`, `sdsl`): show **meta editing** — add/remove properties, change types, set required/optional, define constraints, edit cardinality. The `semantier2` properties panel is read-only with mock data; it must be upgraded to support full meta editing in Phase 1.
  - When in the `code` tab: adapter payload editing context for LangConfig-compatible JSON/supporting files and remote import/test controls; property inspection is not applicable.
  - Reconciliation sub-tab (勾稽): reframed as **simulation results** — shows cross-domain consistency checks against mock data generated from the current TBox, not live production data.
- Semantier extends the fork by adding: a CodeMirror-based editor pane, a React Flow canvas pane, SDSL-aware tool result cards, a provenance panel, an ontology browser panel, and UNICELL warm-first theme via the existing `vite-theme-plugin.ts` mechanism.
- OpenCode's own TUI, CLI, and web client surfaces must not appear to the Semantier end user; Semantier owns the workspace UX end-to-end.
- The implementation must not depend on WebContainer-specific behavior or browser-local filesystem assumptions.

### 12.1.1 Canonical Workflow Specification Contract

- Semantics authority must be singular: all workflow meaning is owned by a canonical intermediate artifact named **Workflow Specification Package (WSP) v1**.
- WSP v1 is the source of truth between ontology/simulation authoring and runtime code generation; generators are adapters, not authorities.
- Minimum WSP v1 sections:
  - `ontology_snapshot`: versioned TBox definitions (entities, properties, relationships, constraints, actions/behaviors)
  - `rule_set`: ECA/SDSL rule graph with source-map metadata
  - `simulation_suite`: test scenarios, input datasets, expected/observed outcomes, reconciliation deltas
  - `approval_bundle`: reviewer decision, timestamp, and checkpoint/provenance IDs
  - `target_profile`: desired runtime target profile (for example `deepagent-py` as default, `langgraph` optional)
- MVP generation contract: only emit and approve WSP v1; runtime code generators are Post-MVP adapters.
- OpenChamber MVP hard boundary: OpenChamber must not compile runtime workflow artifacts locally. Approved WSP v1 bundles are handed off to an external compiler project in Post-MVP phases.
- **Option A authority rule:** Semantier owns translation from approved WSP v1 into LangConfig-compatible import payloads. LangConfig consumes that projection through its existing workflow import API; LangConfig does not own WSP semantics.
- MVP adapter deliverable: OpenChamber must produce a validated `WSP v1 handoff package` for langconfig, including:
  - canonical JSON payload (`wsp.bundle.json`)
  - derived LangConfig-compatible workflow payload (`workflow.langconfig` or equivalent import-ready JSON)
  - local adapter validation report for schema/contract conformance before any remote import
  - schema/version metadata (`wsp.version`, `contract_version`)
  - integrity hash and provenance pointer to `approval_bundle`
  - adapter target hint (`target_profile=deepagent-py`)
- Endpoint integration contract:
  - Phase 2 integration enhancement: Semantier should be able to push the derived LangConfig payload to a configured LangConfig endpoint using the existing workflow import surface (`POST /api/workflows/import`).
  - Endpoint-specific connection data (base URL, auth, project/workspace selection) is deployment configuration, not canonical workflow semantics.
  - The adapter may support a follow-up remote smoke test against the target LangConfig environment when an execution-capable endpoint contract is available; this remains non-blocking for MVP acceptance.
- Post-MVP adapter rule:
  - `DeepAgent Python` adapter (langconfig) compiles from WSP v1.
  - `LangGraph` adapter may compile from the same WSP v1.
  - Neither adapter may introduce semantics not representable in WSP v1.
- Manifest builders and tool loaders must consume compiler output derived from WSP v1 and include a pointer/hash back to the originating approval bundle.

### 12.1.2 WSP v1 -> LangConfig Projection Contract

- The WSP-to-LangConfig translator is an implementation authority for projection only, not for business semantics. WSP v1 remains the sole semantics authority; `.langconfig` is a derived interchange artifact.
- The translator must emit a LangConfig-compatible JSON object that is importable through `POST /api/workflows/import` and contains, at minimum:
  - top-level `version`
  - top-level `langconfig_version`
  - top-level `export_type="workflow"`
  - `workflow.name`
  - `workflow.configuration` and/or `workflow.blueprint`
- To minimize importer ambiguity, Semantier should emit both `workflow.configuration` and `workflow.blueprint` with the same projected node/edge graph unless LangConfig compatibility testing proves one can be omitted safely.
- Non-native WSP semantics that do not map directly to LangConfig workflow graph fields must be preserved losslessly under a namespaced metadata container such as `metadata.semantier` and/or `workflow.configuration.semantier_context`; they must not be silently dropped.

**Minimum projection shape**

```json
{
  "version": "1.0",
  "langconfig_version": "<validated-target-version>",
  "export_type": "workflow",
  "metadata": {
    "source": "semantier",
    "source_contract": "wsp-v1",
    "semantier": {
      "wsp_version": "1.0",
      "contract_version": "1.0",
      "target_profile": "deepagent-py",
      "approval_checkpoint_id": "<checkpoint-id>",
      "approval_bundle_hash": "<integrity-hash>"
    }
  },
  "workflow": {
    "name": "<derived-workflow-name>",
    "description": "<derived-workflow-description>",
    "strategy_type": null,
    "configuration": {
      "nodes": [],
      "edges": [],
      "semantier_context": {}
    },
    "blueprint": {
      "nodes": [],
      "edges": []
    }
  },
  "custom_tools": []
}
```

**Field mapping table**

| WSP v1 source | LangConfig target | Required | Rule |
| --- | --- | --- | --- |
| `wsp.version` | `metadata.semantier.wsp_version` | Yes | Preserve exact emitted WSP schema version. |
| `contract_version` | `metadata.semantier.contract_version` | Yes | Version the projection contract independently from WSP semantics version. |
| `target_profile` | `metadata.semantier.target_profile` | Yes | Must preserve `deepagent-py` or other approved adapter target exactly. |
| `approval_bundle.checkpoint_id` | `metadata.semantier.approval_checkpoint_id` | Yes | This is the canonical remote trace-back handle. |
| `approval_bundle` integrity hash / provenance pointer | `metadata.semantier.approval_bundle_hash` and/or `metadata.semantier.approval_bundle_ref` | Yes | At least one stable integrity/provenance reference must survive translation. |
| `approval_bundle.reviewer_decision`, timestamps | `metadata.semantier.approval_summary` | Recommended | Preserve reviewer/approval audit data without redefining semantics in LangConfig-native fields. |
| `ontology_snapshot` | `workflow.configuration.semantier_context.ontology_snapshot` | Yes | Preserve full approved ontology snapshot in a namespaced container unless a subset is intentionally pruned by versioned contract rule. |
| `rule_set` executable graph | `workflow.configuration.nodes`, `workflow.configuration.edges`, mirrored in `workflow.blueprint.nodes`, `workflow.blueprint.edges` | Yes | This is the import-critical projection. Node/edge graph must be deterministic from approved WSP inputs. |
| `rule_set` source-map metadata | `workflow.configuration.semantier_context.rule_source_map` | Recommended | Keep source-line traceability out of LangConfig-native control fields. |
| `simulation_suite` | `workflow.configuration.semantier_context.simulation_suite` | Recommended | Preserve scenario/test evidence for debugging and later replay, even if LangConfig does not execute it natively at import time. |
| Derived workflow title/summary from approved scenario/workflow spec | `workflow.name`, `workflow.description` | Yes | Translator must derive stable human-readable values; importer must never receive empty `workflow.name`. |
| Tool requirements inferred from projected nodes | `custom_tools[]` and referenced tool IDs in node config | Conditional | Emit only when the projected workflow graph references custom tools required by LangConfig import/runtime behavior. |

**Projection rules**

- The translator must be deterministic: identical approved WSP input must produce byte-equivalent LangConfig payloads apart from explicitly allowed non-semantic fields such as export timestamp or target-version pin.
- The translator must not invent workflow semantics that are absent from WSP v1. If LangConfig requires a field with no WSP authority, the translator may only fill it with:
  - `null`
  - a documented static default
  - a deployment-time value outside canonical semantics
- Any LangConfig-only operational field must be treated as projection metadata, not business meaning.
- Endpoint configuration (`base_url`, auth token, project/workspace selection) is not part of the projected `.langconfig` payload and must live in connection settings/UI state.

**Fixtures and contract tests**

- Before implementation is considered complete, the repo must contain fixture pairs and contract tests for at least:
  - `minimal_linear_flow`: one-path workflow with no custom tools
  - `conditional_branch_flow`: branching node/edge graph with condition metadata
  - `tool_enabled_flow`: workflow requiring `custom_tools[]` emission and node tool ID references
  - `invalid_missing_name`: translation/input case that proves the validator rejects import-unsafe payloads before remote push
- Contract-test expectations must verify:
  - the emitted payload passes local adapter validation
  - the emitted payload contains required LangConfig import keys
  - provenance fields survive translation
  - projected node/edge graph is deterministic across repeated runs
- Until machine-readable schema files and fixtures exist in repo, this subsection is the temporary human-readable authority for projection behavior. Once schema files and fixture tests exist, those artifacts become the executable authority and this section must describe, not duplicate, them.

### 12.2 Editor

- A CodeMirror-based editor must be the default code editor.
- The editor must support SDSL syntax highlighting in MVP.
- The editor must display ghost-text suggestions and inline error markers.
- The editor must allow explicit accept, reject, and manual edit after AI suggestion.
- The editor must support CodeMirror gutter markers and line decorations for semantic diagnostics and rule-status feedback.
- The MVP editor language package must provide a CodeMirror `LanguageSupport` extension (implemented via `StreamLanguage.define()` or a Lezer grammar) that tokenizes core SDSL keywords including `DIMENSION`, `MAP`, `BIND`, and `ASSERT`. The in-repo `CodeMirrorEditor` component (`packages/ui/src/components/ui/CodeMirrorEditor.tsx`) is the baseline; SDSL support is injected via the existing `extensions` prop.
- Semantic diagnostics must be source-mapped to concrete file and line metadata so agent or validator feedback can target the exact SDSL rule that failed.

### 12.3 Visual Canvas

- React Flow must visualize logical relationships and mapping topology.
- The canvas must reflect accepted code changes and validation outcomes.
- The canvas should show provisional or dashed paths for unaccepted AI suggestions when feasible.
- The canvas must support event-flow simulation playback over mock or user-entered test data and highlight path-level state transitions.

### 12.4 AI Copilot

- The copilot must support streaming responses over a single-channel transport.
- The copilot must expose user feedback controls for each assistant output.
- The copilot must surface intermediate states such as ontology lookup and validation activity.
- The copilot must prefer precise, bounded suggestions over large speculative rewrites.
- The MVP interaction channel baseline must use Vercel AI SDK and must not require CopilotKit runtime primitives as a core dependency.
- The agent session host must be OpenCode, embedded via the OpenCode SDK. Semantier creates and manages OpenCode sessions programmatically; it does not expose OpenCode's own TUI, web, or CLI surfaces to the end user.
- Context must be injected into the active session using `session.prompt(...)` on each meaningful editor or ontology state change, so the agent always reasons from live data. The `useSdslContextInjector` hook wraps this call with debouncing. (Note: `semantier2` uses a `noReply: true` parameter to suppress agent response during context-only injection. This parameter is **not yet verified** against the OpenCode SDK on `main`. Validate SDK support before relying on it; if unsupported, use an alternative suppression mechanism or accept the response and discard it client-side.)
- Suggestions must be requested using `session.prompt` with a typed JSON schema format so responses are structured SDSL objects, not untyped prose.
- Semantier must subscribe to the OpenCode SSE event stream via the verified `main` routed layer (`client.ts`, `useEventStream.ts`, `subscribeToGlobalEvents()`) to map tool-call events to CodeMirror ghost text, status badges, and React Flow provisional edges in real time.
- Copilot context snapshots must include, at minimum, the active SDSL buffer, the visible topology snapshot, and the relevant tenant-scoped ontology context.
- User feedback controls should use optimistic UI semantics: the local reaction state updates immediately, then a background write persists the associated `checkpoint_id` or equivalent provenance handle.
- Assistant message rendering should remain brand-controlled and headless-composable; the baseline stack may use shadcn/Radix primitives, Lucide icons, Shiki-highlighted code blocks, and Framer Motion where motion materially improves feedback clarity.
- ChatView must support three explicit interaction intents: ontology assistance, scenario elicitation, and code generation orchestration.
- Scenario elicitation must output a structured artifact (workflow spec + simulation test set), not free-form prose only.

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
- The platform must expose a `simulate_eca_rules` tool that generates mock ABox instances from the current TBox schema, executes ECA rules against them, and returns: fired rules, reconciliation deltas, constraint pass/fail results, and source-mapped diagnostics. This is the backend for the properties panel’s simulation reconciliation sub-tab.

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
  4. the resulting directive stream updates UI state and, if needed, CodeMirror diagnostics
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
- Editor: CodeMirror-based editor (added as a new pane in the fork)
- Visual layer: React Flow (added as a new pane in the fork)
- AI transport: Vercel AI SDK
- UI primitives: OpenChamber's existing shadcn/headless component layer, extended with UNICELL warm-first theme via `vite-theme-plugin.ts`
- Supporting UI libraries: Radix primitives, Lucide icons, Shiki for code rendering, and Framer Motion where feedback motion improves operator comprehension
- Logic engine: deterministic SDSL generation and validation layer, independent of any one agent framework
- Backend runtime: standard Node.js first
- Portability rule: all core logic, storage access, and transport boundaries must remain Edge-ready for later migration
- Storage: database-backed abstraction for ontology and SDSL assets
- OpenCode integration: OpenCode SDK (`@opencode-ai/sdk`) embedded as agent session host; already implemented by OpenChamber shell
- Layout isolation: `SemantierLayout` as a parallel surface entered via `App.tsx` conditional branch (`?mode=semantier` URL query), not a `MainLayout` modification. `SemantierLayout` reuses `MainLayout`'s standalone view components (`ChatView`, `FilesView`, `TerminalView`, `DiffView`) as imports and manages its own internal tab state. This keeps upstream merge surface to 1 file (`App.tsx`).
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
- Use a separate `SemantierLayout` with internal tab composition rather than extending `MainLayout`'s `MainTab` type. `MainTab` extension requires modifying 6+ upstream files (`useUIStore`, `MainLayout`, `router/types`, `useRouter`, `useKeyboardShortcuts`, `useMenuActions`) with high merge-conflict risk on every upstream sync. `SemantierLayout` touches 1 upstream file (`App.tsx`) and composes its own views by importing standalone components (`ChatView`, `FilesView`, `TerminalView`, `DiffView`) that are already decoupled from `MainLayout`.
- Integrate OpenCode via the SDK embedding already present in OpenChamber. Do not surface OpenCode's TUI/web client or delegate UX control to it.
- MCP is an optional outbound boundary for external consumers. Do not make MCP the primary interaction channel between OpenCode and Semantier.
- Keep the typed A2UI envelope and component registry authoritative; do not let free-form assistant prose become executable UI state.
- Treat source-mapped semantic feedback into the CodeMirror editor as a core product behavior, not an optional polish feature.

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

**Goal:** Running three-panel workspace with `semantier2` domain components ported into the OpenChamber `main` fork, including editable meta modeling and test-scenario input scaffold, with static topology — no live AI wiring yet.

**Revised approach:** Port domain components from the `semantier2` branch (reference implementation) into the OpenChamber `main` fork. The `semantier2` branch is treated as non-authoritative reference only — it demonstrates behavior and data shape but is not the implementation baseline. The `main` branch extension points (`App.tsx`, `CodeMirrorEditor.tsx`, `client.ts`, `useEventStream.ts`) are the sole implementation authority.

**Port vs. Rewrite rule:** Files that are editor-agnostic (stores, layout, tools, graph components) port directly from `semantier2`. Files that depend on Monaco Editor API (`semantic-editor.tsx`, `sdsl-language.ts`, `useToolEventGlyphs.ts`) must be rewritten against `main`'s CodeMirror 6 baseline.

New dependencies (add to `packages/ui`):
- `@xyflow/react` — React Flow v12 (required by `ontology-graph.tsx`)
- `dagre` + `@types/dagre` — auto-layout algorithm used by `ontology-graph.tsx`
- `react-resizable-panels` — resizable pane splits for `SemantierLayout`
- `@radix-ui/react-tabs` — required by ported shadcn `tabs.tsx`
- `@radix-ui/react-label` — required by ported shadcn `label.tsx`
- `lucide-react` — icons used by Semantier domain components

Note: `@uiw/react-codemirror` is NOT needed. The in-repo `CodeMirrorEditor` component already provides the React integration layer for CodeMirror 6 with extensions, block widgets, line decorations, and gutter support.

Ported from `semantier2` branch (adapt import paths, verify against `main` baseline):
- `packages/ui/src/components/semantier/ontology-graph.tsx` — polished React Flow graph with tree-to-graph integration helpers (`treeNodeToGraphNodeType`, `defaultProperties`), custom node types, typed edge categories, side-aware chevron port handles, animated glow, dagre layout, legend
- `packages/ui/src/components/semantier/resource-explorer.tsx` — namespace tree (core/fin/tax/mgt), tabs for ontology/dimensions/rules
- `packages/ui/src/components/semantier/properties-panel.tsx` — context-aware inspector with 3 sub-tabs: **属性 (Properties)** for meta editing (add/remove properties, change types, constraints, cardinality — upgrade from `semantier2`'s read-only mock), **仿真勾稽 (Simulation Reconciliation)** for cross-domain consistency checks against mock ABox data generated from the current TBox (reframed from `semantier2`'s "勾稽" tab), **版本 (Versions)** for version history
- `packages/ui/src/components/semantier/header.tsx` — app chrome: logo, command palette, Import/Export/Validate buttons

Rewritten for CodeMirror (behavior reference from `semantier2`, implementation against `main`'s `CodeMirrorEditor`):
- `packages/ui/src/components/semantier/semantic-editor.tsx` — center-panel workspace with 5 internal tabs:
  - **本体建模** (`schema`) — `OntologyGraph` React Flow canvas. (Note: the `semantier2` branch uses generic "图形建模" — rename to "本体建模", the standard knowledge engineering term for defining entity types, relationships, and properties in a domain ontology.)
  - **规则定义** (`rules`) — editable ECA (Event-Condition-Action) rule view showing cross-domain WHEN/TRIGGER/EVALUATE/RECONCILE definitions. (Note: the `semantier2` branch uses the invented term "逻辑织入" — rename to industry-standard "规则定义" on port. Do not invent domain terminology; prefer established academic/industry terms per Occam's Razor principle.)
  - **SDSL 编辑器** (`sdsl`) — SDSL-specialized editor with ghost text suggestions, validation diagnostics, gutter status badges, and SDSL context injection. Must use in-repo `CodeMirrorEditor` with SDSL `LanguageSupport` extension, NOT Monaco `@monaco-editor/react`.
  - **测试场景** (`simulation`) — test-data input and event-flow simulation view for validating ontology/rules with mock or user-entered scenario data.
  - **代码编辑** (`code`) — LangConfig adapter workspace for previewing, editing, validating, and pushing the derived `.langconfig` workflow payload and closely related supporting artifacts (`.json`, `.yaml`, `.md`). Language-aware via `languageByExtension.ts`. File-open from `ResourceExplorer` or `FilesView` targets this tab. Uses the same in-repo `CodeMirrorEditor` without SDSL-specific extensions. The tab must expose endpoint controls for a specified LangConfig base URL and project/workspace target, plus actions for `Validate Payload`, `Push to LangConfig`, and `Smoke Test` when the target runtime exposes an execution-capable API. Runtime workflow code generation remains Post-MVP via external compiler adapters from approved WSP v1.

  The 5-tab design means no mode switching is required for the complete authoring JTBD. Users flow: ontology modeling (本体建模) → rule definition (规则定义) → SDSL authoring (SDSL 编辑器) → test scenario simulation (测试场景) → LangConfig adapter review/push (代码编辑) within the same center panel.

Ported shadcn components missing from openchamber (copy from `v0/components/ui/`):
- `tabs.tsx`, `badge.tsx`, `label.tsx`, `progress.tsx`, `separator.tsx` (verify others against actual usage)

Ported from `semantier2` (editor-agnostic, port directly):
- `packages/ui/src/components/layout/SemantierLayout.tsx` — three-panel shell using `react-resizable-panels`: left rail (`ResourceExplorer`), center workspace (`SemanticEditor`), right panel (`ChatView`), with an optional bottom dock for utility views (`FilesView`, `TerminalView`, `DiffView`). Shell-level panel visibility is managed by `useSemantierUIStore`, independent of `MainLayout`'s `activeMainTab`. The center authoring tabs (`schema` / `rules` / `sdsl` / `simulation` / `code`) are owned by `SemanticEditor`, not by `SemantierLayout`.
- `packages/ui/src/stores/useSdslStore.ts` — Zustand store: `buffer`, `setBuffer`, `ghostText`, `setGhostText`, `diagnostics`, `acceptGhostText`, `rejectGhostText`
- `packages/ui/src/stores/useTopologyStore.ts` — Zustand store: `nodes`, `edges`, `setTopology`
- `packages/ui/src/hooks/useSdslContextInjector.ts` — debounced `session.prompt(...)` wrapper for context injection (editor-agnostic). Note: `noReply: true` suppression is pending SDK verification on `main` (see §12.4).
- `packages/ui/src/lib/semantier-tools.ts` — canonical tool types, mock ontology data, validation contract
- `packages/ui/src/components/chat/SdslValidationCard.tsx` — typed tool-result card for `validate_datalog_logic`

Rewritten for CodeMirror (new files, behavior reference from `semantier2`):
- `packages/ui/src/lib/sdsl-language.ts` — SDSL `StreamLanguage` tokenizer for CodeMirror 6 (NOT Monarch tokenizer)
- `packages/ui/src/hooks/useToolEventGlyphs.ts` — SSE tool-event → CodeMirror `ViewPlugin` + `Decoration` bridge (NOT Monaco `deltaDecorations`)

Modifications to existing files:
- `packages/ui/src/App.tsx` — add Semantier mode entry: render `<SemantierLayout />` when URL query `?mode=semantier` is present, inserted as a new conditional branch before the default `<MainLayout />` return. This matches `App.tsx`'s existing multi-layout dispatch pattern (OnboardingScreen → ChatView → VSCodeLayout → **SemantierLayout** → MainLayout). The entry mechanism is `?mode=semantier` URL query parameter for MVP.
- `packages/ui/src/styles/design-system.css` — add Semantier IDE token block (`--editor-bg`, `--node-bg`, `--node-border`, `--warning`, `--success`, `--info`) ported from v0 `globals.css`; add as `semantier-dark` theme class

**Terminology rule (Occam's Razor):** Do not invent domain terms. Use established industry/academic terminology. Example: `semantier2` uses "逻辑织入" (Logic Weaving) — this is a marketing term with no academic precedent. Replace with "规则定义" (Rule Definition), the standard term from Business Rules Management Systems (BRMS) and ECA literature.

Deliverable gate: user can open the app, see three panels (resource tree, center workspace with five authoring tabs, chat), switch between all center tabs (本体建模 / 规则定义 / SDSL编辑器 / 测试场景 / 代码编辑), open adapter files in the code tab, interact with the React Flow graph, edit properties in the meta inspector (add/remove fields, change types), enter test data, and locally validate the derived LangConfig payload against the adapter contract. The user must be able to complete the full authoring JTBD (本体建模 → 规则定义 → SDSL编辑 → 测试场景仿真 → 代码编辑 → review) without leaving SemantierLayout.

### Phase 2: Deterministic Copilot

**Goal:** Live AI suggestion + scenario elicitation loop — ontology lookup, validation, simulation orchestration, ghost text, and SSE-driven status badges.

- Wire `useSdslContextInjector` (ported in Phase 1) to editor `onChange` so the active session always reflects the live SDSL buffer and ontology snapshot. The underlying call is `session.prompt(...)` as verified on `main` (see `gitApi.ts` L393 for the proven call pattern).
- Register `get_ontology_schema`, `validate_datalog_logic`, and `simulate_eca_rules` custom tools (scaffolded in Phase 1) backed by Semantier's internal modules.
- Subscribe to the OpenCode SSE event stream via the routed client layer (`client.ts` / `useEventStream.ts` / `subscribeToGlobalEvents()`) — these are the verified `main` abstractions. Map `tool.start` / `tool.result` events to CodeMirror gutter status badges and ChatView tool-call cards.
- Add `SdslValidationCard.tsx` and `OntologySchemaCard.tsx` in `components/chat/` to replace the generic tool output renderer for the two canonical tools.
- Wire `session.prompt` with JSON schema `format` parameter to a "Suggest" trigger; render structured SDSL response as CodeMirror ghost text via `setGhostText`.
- Add scenario elicitation flow in ChatView: user business narrative -> structured workflow spec -> simulator-ready test data.
- Route simulation outputs to the 测试场景 tab, graph overlays, and SDSL diagnostics.
- Implement MVP handoff adapter artifacts and Phase 2 integration actions: `wsp.bundle.json` export, WSP -> LangConfig translation, contract validation, endpoint configuration UI, and direct push/import to configured LangConfig environments via the existing import API.
- Add `code` tab adapter actions: `Validate Payload`, `Push to LangConfig`, and `Smoke Test` (the last one enabled only when the specified LangConfig endpoint exposes an execution-capable contract).
- Stand up optional MCP outbound boundary for external consumers if integration scope requires it.

### Phase 3: Visual and Audit Loop

- Bind accepted suggestions to React Flow updates and provenance records.
- Implement cross-tab synchronization: changes in any meta tab (schema/rules/sdsl) propagate to the other two in real time.
- Wire simulation results (from `simulate_eca_rules`) into graph node decorations and SDSL gutter annotations.
- Add explicit approval gate: simulation/event-flow and information architecture must be approved into a WSP v1 approval bundle checkpoint.

### Phase 4: Runtime Codegen and Deployment (Post-MVP)

- Compile approved WSP v1 bundles into runtime artifacts via adapters (DeepAgent Python via langconfig first; LangGraph adapter optional/next).
- Generate workflow code, UI scaffold, and manifest in 代码编辑 tab from compiler outputs.
- Package compiled workflow tools and publish into tool folder/registry.
- Validate manifest-driven loader behavior and provenance linkage back to WSP v1 approval bundle.

### Phase 5: Multi-Tenant Hardening

- Move asset access fully behind storage abstraction and prepare Node-to-Edge portability path.

## 19. Launch Criteria

- Users can author and accept validated SDSL suggestions end to end.
- Users can define simulation scenarios with test data and run event-flow simulation from the same workspace.
- Users can obtain an AI-generated structured workflow spec + test data from scenario elicitation chat.
- Users can approve simulation adequacy before code generation.
- Users can produce an approved WSP v1 checkpoint that is complete, deterministic, and provenance-linked.
- Users can inspect/edit a derived LangConfig-compatible payload and locally validate it against the adapter contract without manual file export/import.
- Adapter fixture and contract-test suite proves deterministic WSP -> `.langconfig` projection for minimal, branching, and tool-enabled workflows before any remote push is attempted.
- Provenance is recorded for all accepted AI-assisted changes.
- The product runs in standard Node.js production infrastructure without direct filesystem dependency for canonical tenant assets.
- The system demonstrates one complete editor-to-validation-to-visualization loop with deterministic behavior.

## 20. Implementation Tracking Appendix

This appendix tracks each artifact's implementation status relative to the `main` branch baseline. The `semantier2` branch is reference-only — it demonstrates behavior but is not the implementation authority.

### 20.1 Implementation Status Table

| Artifact | Baseline on `main` | Port from `semantier2` | Rewrite for CodeMirror | Status |
| --- | --- | --- | --- | --- |
| `App.tsx` layout dispatch | ✅ Multi-layout pattern proven (VSCodeLayout) | — | — | Planned delta: add Semantier mode branch |
| `CodeMirrorEditor.tsx` | ✅ Extensions, block widgets, line decorations, gutter | — | — | Baseline ready; SDSL extension injected via `extensions` prop |
| `client.ts` / `useEventStream.ts` | ✅ `subscribeToGlobalEvents()`, SSE event routing | — | — | Baseline ready; add Semantier event handlers |
| `languageByExtension.ts` | ✅ `StreamLanguage.define()` pattern for 20+ languages | — | — | Baseline ready; add SDSL case |
| `SemantierLayout.tsx` | — | ✅ Port directly (91 lines, editor-agnostic) | — | Planned |
| `ontology-graph.tsx` | — | ✅ Port directly (has tree integration helpers) | — | Planned |
| `resource-explorer.tsx` | — | ✅ Port directly | — | Planned |
| `properties-panel.tsx` | — | ✅ Port + upgrade (meta editing, simulation reframe, test data input) | — | Planned |
| `header.tsx` | — | ✅ Port directly | — | Planned |
| `useSdslStore.ts` | — | ✅ Port directly (pure Zustand, editor-agnostic) | — | Planned |
| `useTopologyStore.ts` | — | ✅ Port directly (pure Zustand) | — | Planned |
| `useSdslContextInjector.ts` | — | ✅ Port directly (session.prompt, editor-agnostic) | — | Planned |
| `semantier-tools.ts` | — | ✅ Port directly (pure types + mock data) | — | Planned |
| `SdslValidationCard.tsx` | — | ✅ Port directly (pure React component) | — | Planned |
| `semantic-editor.tsx` | — | Reference only (Monaco-based) | ✅ Rewrite using `CodeMirrorEditor` | Planned |
| `sdsl-language.ts` | — | Reference only (Monarch tokenizer) | ✅ Rewrite as `StreamLanguage.define()` | Planned |
| `useToolEventGlyphs.ts` | — | Reference only (Monaco `deltaDecorations`) | ✅ Rewrite as CodeMirror `ViewPlugin` + `Decoration` | Planned |
| Ghost text rendering | — | Reference only (Monaco inline decorations) | ✅ Rewrite as CodeMirror `StateField` + `Decoration.widget()` | Planned |
| `simulation` tab in `semantic-editor.tsx` | — | Reference extension | ✅ New tab + simulator result view | Planned |
| Scenario elicitation chat flow | — | — | ✅ New structured workflow-spec generation flow | Planned |
| Canonical WSP v1 contract | — | — | ✅ New singular semantics authority | Planned |
| WSP -> `.langconfig` mapping table + fixture contract | — | — | ✅ Deterministic projection rules and validation fixtures for LangConfig import compatibility | Planned (MVP) |
| WSP -> langconfig handoff adapter contract | — | — | ✅ MVP translation/export/local-validation contract (`wsp.bundle.json` + derived `.langconfig` payload) | Planned (MVP) |
| LangConfig endpoint integration actions (`Push to LangConfig`, optional `Smoke Test`) | — | — | ✅ Remote import/smoke integration using existing endpoint contract | Planned (Phase 2 enhancement) |
| Workflow code/manifest generator (DeepAgent Python via langconfig adapter) | — | — | ✅ New generation pipeline from WSP v1 | Deferred to Phase 4 (Post-MVP) |
| Workflow code/manifest generator (LangGraph adapter) | — | — | ✅ Optional adapter from WSP v1 | Deferred to Phase 4+ (Post-MVP) |
| Tool deploy + manifest loader validation | — | — | ✅ New deployment/verification pipeline | Deferred to Phase 4 (Post-MVP) |
| Semantier mode entry mechanism | — | — | — | Specified: `?mode=semantier` URL query (§12.1, §14, Phase 1 App.tsx) |
| Multi-tenant storage abstraction | — | — | — | MVP baseline required (`tenant_id`-scoped service boundaries); deeper hardening deferred to Phase 5 |
| MCP outbound boundary | — | — | — | Deferred: optional |
| Provenance/audit persistence | — | — | — | Deferred to Phase 3 |

### 20.2 Source-to-PRD Traceability

This section maps high-signal technical commitments from the source conversation export to their authoritative PRD sections.

| Source Commitment | PRD Authority Section(s) | Spec Status |
| --- | --- | --- |
| OpenCode is the workspace shell baseline | 12.1, 14, 15 | Specified |
| Vercel AI SDK is the single-channel transport baseline | 12.4, 14, 15 | Specified |
| Node-first implementation with Edge-ready migration path | 7, 12.9, 12.12, 14, 16 | Specified |
| Avoid WebContainer-specific runtime assumptions | 12.1, 15 | Specified |
| Deterministic generation: ontology lookup + validation before acceptance | 12.5, 12.6, 18 | Specified |
| Canonical tooling: `get_ontology_schema` and `validate_datalog_logic` | 12.6 | Specified |
| A2UI typed directive bridge with envelope and action contract | 12.10 | Specified |
| A2UI component registry (SemanticInput, CurrencyField, LogicBadge, TaxEffectCard, DimensionTree) | 12.10 | Specified |
| Semantic feedback loop: UI → logic validation → CodeMirror diagnostics | 12.2, 12.10, 15 | Specified |
| OpenChamber fork as UX shell with CodeMirror editor, React Flow, SDSL tool cards | 12.1, 14, 15, 18 | Specified |
| OpenCode SDK embedded as agent session host; context via `session.prompt(...)` (note: `noReply` suppression pending SDK verification); JSON schema format | 12.1, 12.4, 14, 15, 18 | Specified |
| MCP optional outbound boundary (not primary integration path) | 12.11, 14, 15 | Specified |
| Tenant-scoped audit/provenance, row-level storage, versioned assets | 12.7, 12.8, 13 (Security), 19 | Specified |
| CodeMirror + React Flow editor/canvas loop with ghost text, gutter diagnostics, topology sync | 11, 12.2, 12.3, 18, 19 | Specified |
| Closed-world logic model, EDB/IDB split, SDSL primitive set, safety constraints | 12.5 | Specified |
| Rejected: CopilotKit runtime dependency, Bolt/WebContainer as canonical authority | 12.4, 15 | Specified |

### 20.3 Authority Notes

- The `main` branch extension points (`App.tsx`, `CodeMirrorEditor.tsx`, `client.ts`, `useEventStream.ts`, `languageByExtension.ts`) are the sole implementation authority.
- The `semantier2` branch is a non-authoritative reference implementation. It demonstrates product behavior and data shapes but is built on Monaco Editor, which is not the `main` baseline.
- Files ported from `semantier2` must be verified against `main`'s import paths and component patterns before merge.
- The three CodeMirror rewrite files (`semantic-editor.tsx`, `sdsl-language.ts`, `useToolEventGlyphs.ts`) are the highest-risk technical slice and should be prioritized in estimation.
