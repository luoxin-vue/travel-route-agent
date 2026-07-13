# CodeGraph Prioritization Rule

When searching, navigating, or exploring code in this codebase:

1. **Prioritize CodeGraph Tools**: Always prefer calling CodeGraph tools (such as `codegraph_explore` or other `mcp__codegraph__*` tools) over standard file/text search tools (like grep, list directory, or opening files sequentially to trace dependencies).
2. **One-Shot Structural Intelligence**: Reach for `codegraph_explore` to query how a feature or symbol works, trace call paths (including dynamic dispatches/callbacks/interface implementations), or assess the blast radius of a change.
3. **Surgical Code Reading**: First use CodeGraph to pinpoint the exact symbols, files, and line numbers of interest, and only then read or edit them directly. This reduces unnecessary tool calls and context bloat.
