# Enterprise Architecture House Components Explained

**Date**: March 30, 2026 at 05:26 PM  
**Source**: [Gemini Chat](https://gemini.google.com/app/3a2dda7e7c6ec875)  
**Sanitized for OpenChamber scope**: March 31, 2026

---

## Scope Note

This file has been sanitized to keep only OpenChamber-relevant implementation context.
All non-OpenChamber technology selection debates and alternatives (including cross-framework comparisons and platform-choice branches) were removed.

---

## OpenChamber-Relevant Conclusions

1. Keep a single interaction channel for streaming AI updates.
2. Keep deterministic generation as first principle: ontology lookup and validation gate suggestions.
3. Keep explicit human approval for material changes (accept/reject/edit).
4. Keep structured UI directives and source-mapped diagnostics as first-class behavior.
5. Keep code editor + topology canvas + AI sidebar as the core workspace triad.

---

## OpenChamber UX/Runtime Constraints

- OpenChamber is the UI shell baseline.
- Session lifecycle, tool-call cards, and timeline behavior should stay inside OpenChamber's existing interaction model.
- Semantic feedback should remain code-local and source-mapped.
- Tool outputs that affect suggestions should be user-visible and traceable.

---

## Editing Policy for This File

- Retain only OpenChamber-specific decisions and constraints.
- Do not add alternative product/platform selection discussions here.
- Put authoritative implementation specs in `design-spec.MD`.

