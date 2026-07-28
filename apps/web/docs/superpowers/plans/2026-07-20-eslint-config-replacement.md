# ESLint Config Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Airbnb with `@antfu/eslint-config` and enforce semicolons plus arrow-function React components.

**Architecture:** Upgrade ESLint to the version expected by `@antfu/eslint-config`, remove Airbnb-specific packages, and replace the flat config with a single Antfu-based export plus local rules. Verify configuration loading first, then run the full lint command to separate config health from pre-existing source lint errors.

**Tech Stack:** ESLint 9, @antfu/eslint-config, React, TypeScript, Vite, Yarn

## Global Constraints

- Keep flat config in `eslint.config.js`.
- Remove `eslint-config-airbnb` from dependencies.
- Enforce semicolons explicitly.
- Enforce arrow-function React components explicitly.
- Do not mass-refactor unrelated source files.

---

### Task 1: Replace lint dependencies and config

**Files:**
- Modify: `package.json`
- Modify: `eslint.config.js`
- Modify: `yarn.lock`

**Interfaces:**
- Consumes: existing `yarn lint` script
- Produces: a valid Antfu-based flat ESLint config

- [ ] Step 1: Install the new ESLint stack and remove Airbnb-specific packages.
- [ ] Step 2: Rewrite `eslint.config.js` to export an Antfu config with explicit semicolon and arrow-component rules.
- [ ] Step 3: Run ESLint against `eslint.config.js` to verify the config itself loads and lints cleanly.
- [ ] Step 4: Run `yarn lint` to confirm the project uses the new config and report any remaining source violations.