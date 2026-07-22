# 02 — Node Edit Modal & Timeline Integration

**What to build:** Create `NodeEditModal` component for editing node properties (name, type, day, times, protocol, notes, image), deleting nodes with confirmation, and adding new nodes. Integrate it with `RouteTimeline` cards' "编辑" button and bottom "添加新游玩节点" button.

**Blocked by:** 01 — Store Extensions for Node CRUD & Preferences

**Status:** ready-for-agent

- [ ] Create `NodeEditModal` component with form inputs and delete confirmation
- [ ] Connect `RouteTimeline` StopCard edit button to trigger `NodeEditModal`
- [ ] Connect `RouteTimeline` bottom add button to trigger `NodeEditModal` with new node
- [ ] Ensure map and active route sync on save/delete
