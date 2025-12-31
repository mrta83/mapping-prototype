# Map Prototype Backlog

Technical debt and improvement items identified during code review.

## Priority 1 - Architecture

| ID | Item | Status | Notes |
|----|------|--------|-------|
| ARCH-001 | Extract JavaScript into ES Modules | Done | Created 17 modules in `src/` |
| ARCH-002 | Implement State Management Pattern | Done | Added validation, batch updates, persistence, selectors |
| ARCH-003 | Extract Layer Builders into Factory Pattern | Done | `src/layers/{clusters,heatmap,markers}.js` |

## Priority 2 - Code Quality

| ID | Item | Status | Notes |
|----|------|--------|-------|
| QUAL-001 | Consistent Error Handling | Pending | Add try/catch, user-friendly errors |
| QUAL-002 | Add JSDoc Documentation | Done | All modules documented |
| QUAL-003 | Extract Magic Numbers to Constants | Done | `src/config/constants.js` |
| QUAL-004 | Standardize Naming Conventions | Done | Consistent across modules |

## Priority 3 - Performance

| ID | Item | Status | Notes |
|----|------|--------|-------|
| PERF-001 | Data Source Abstraction | Pending | Support real data, not just generated |
| PERF-002 | Lazy Load Heavy Components | Pending | Load 3D/heatmap on demand |
| PERF-003 | Debounce Slider Updates | Pending | Reduce redraws during drag |
| PERF-004 | Memoize Expensive Computations | Done | Selectors with caching |

## Priority 4 - Robustness

| ID | Item | Status | Notes |
|----|------|--------|-------|
| ROB-001 | Graceful Mapbox Token Handling | Partial | Has modal, could improve validation |
| ROB-002 | Handle Empty Data States | Pending | Show meaningful empty states |
| ROB-003 | Network Error Recovery | Pending | Retry logic for tile loads |

## Priority 5 - Developer Experience

| ID | Item | Status | Notes |
|----|------|--------|-------|
| DX-001 | Add Development Build Config | Pending | Bundler setup (Vite/esbuild) |
| DX-002 | Create Component Storybook | Pending | Isolated UI component testing |
| DX-003 | Add Unit Tests | Pending | Test state, selectors, generators |

## Priority 6 - Technical Debt

| ID | Item | Status | Notes |
|----|------|--------|-------|
| DEBT-001 | Remove Inline Event Handlers | Pending | Replace `onclick=""` with listeners |
| DEBT-002 | Consolidate CSS | Pending | Extract to separate stylesheet |
| DEBT-003 | Remove Console Logs | Pending | Use proper logging or remove |

---

## Completed Summary

- **ARCH-001**: 17 ES modules created with proper imports/exports
- **ARCH-002**: State management with validation, batch updates, localStorage persistence, memoized selectors, debugging utilities
- **ARCH-003**: Factory pattern for cluster/heatmap/marker layer creation
- **QUAL-002/003/004**: JSDoc throughout, constants extracted, naming standardized
- **PERF-004**: Memoized selectors for filtered data, stats, bounds

## Next Recommended Items

1. **QUAL-001** - Error handling (improves user experience)
2. **PERF-001** - Real data support (enables production use)
3. **DX-003** - Unit tests (prevents regressions)
