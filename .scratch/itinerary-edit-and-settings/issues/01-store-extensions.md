# 01 — Store Extensions for Node CRUD & Preferences

**What to build:** Extend `useAppStore` with travel preferences state and CRUD actions (`updateNode`, `addNode`, `deleteNode`, `updatePreferences`, `clearMessages`, `resetSavedRoutes`). Ensure node mutations cleanly update both active itinerary and saved route library states. Provide automated unit tests for store actions.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Add `travelPreferences` to `AppState` with defaults
- [ ] Implement `updateNode`, `addNode`, `deleteNode` actions with node key cleanup
- [ ] Implement `updatePreferences`, `clearMessages`, `resetSavedRoutes` actions
- [ ] Write unit test for store node mutations
