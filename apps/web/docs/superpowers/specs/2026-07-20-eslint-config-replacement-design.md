# ESLint Config Replacement Design

**Date:** 2026-07-20

## Goal

Replace Airbnb ESLint configuration with a modern, popular flat-config setup that works well with Vite + React + TypeScript.

## Requirements

- Remove `eslint-config-airbnb` from `package.json`.
- Use a modern popular config with many built-in rules.
- Keep the project on flat ESLint config.
- Enforce semicolons at the end of statements.
- Enforce arrow-function React components.

## Recommended Approach

Use `@antfu/eslint-config` as the base config and upgrade the ESLint runtime to a compatible major version. Layer project-specific React and stylistic overrides on top of the shared config instead of using legacy compatibility bridges.

## Scope

- Update lint dependencies.
- Rewrite `eslint.config.js` around `@antfu/eslint-config`.
- Verify lint config loads and the project lint command runs.

## Constraints

- The workspace currently has no Git repository metadata available, so spec-plan commits cannot be created.
- Existing project lint violations outside the config replacement should not be silently mass-fixed as part of this task.