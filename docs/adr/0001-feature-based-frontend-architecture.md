# ADR-0001: Feature-Based Frontend Architecture

## Status

✅ Accepted

## Date

2024-12-01

## Context

The DAP frontend started with a flat component structure (`src/components/`) that became increasingly difficult to navigate as the application grew. Finding related code required searching across multiple directories, and there was no clear ownership of features.

Key pain points:
- 50+ components in a single directory
- No clear boundaries between features
- Shared utilities mixed with feature code
- Difficult onboarding for new developers
- Cross-feature dependencies were implicit

## Decision

Adopt a **Feature-Based Architecture** where code is organized by business domain under `src/features/`. Each feature is self-contained with its own:

```
src/features/{feature-name}/
├── components/      # React components
├── hooks/           # Feature-specific hooks
├── graphql/         # Queries and mutations
├── context/         # Context providers (if needed)
├── types/           # TypeScript interfaces
├── utils/           # Feature utilities
└── index.ts         # Public API (barrel export)
```

### Rules

1. **Barrel Exports**: All public APIs exported via `index.ts`
2. **No Cross-Feature Internals**: Features can only import from other features' barrel files
3. **Shared Code**: Truly reusable code goes in `src/shared/`
4. **Pages Separate**: Route components live in `src/pages/`

## Consequences

### Positive

- ✅ Clear code organization by business domain
- ✅ Easy to find all code related to a feature
- ✅ Clear ownership boundaries
- ✅ Easier onboarding - directory structure matches business concepts
- ✅ Features can be developed/tested in isolation
- ✅ Enables future code splitting by feature

### Negative

- ⚠️ Requires discipline to maintain boundaries
- ⚠️ Some initial refactoring overhead
- ⚠️ May lead to code duplication if shared code not properly identified
- ⚠️ Barrel files add indirection

### Neutral

- Need ESLint rules to enforce import boundaries
- Documentation must be updated to explain structure
- CI should validate architecture compliance

## Alternatives Considered

### Alternative 1: Atomic Design (Atoms/Molecules/Organisms)

- **Pros**: Clear component hierarchy, promotes reusability
- **Cons**: Business logic scattered across levels, harder to find feature code
- **Why rejected**: Optimizes for component reuse over feature cohesion

### Alternative 2: Layer-Based (components/hooks/services/etc.)

- **Pros**: Simple, familiar to most developers
- **Cons**: Related code spread across directories, no feature isolation
- **Why rejected**: Current pain point - already tried this approach

### Alternative 3: Micro-Frontends

- **Pros**: Complete isolation, independent deployments
- **Cons**: Too complex for current scale, operational overhead
- **Why rejected**: Overkill for single-team development

## References

- [React Feature-Based Architecture](https://feature-sliced.design/)
- [CONTEXT.md - Frontend Structure](../CONTEXT.md)
- [enforce-modular-layout.sh](../../scripts/enforce-modular-layout.sh)

