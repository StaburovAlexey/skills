---
name: vue-flow-best-practices
description: Build and maintain Vue Flow graph editors in Vue 3 with TypeScript. Use when working with @vue-flow/core, VueFlow components, flowcharts, node editors, custom nodes, custom edges, handles, graph state, useVueFlow/useNode composables, drag-and-drop node creation, minimap/controls/background components, layouting, or troubleshooting Vue Flow rendering and connection behavior.
---

# Vue Flow Best Practices

Use this skill as a practical implementation guide for Vue Flow v1.x. Prefer Vue 3 Composition API, `<script setup lang="ts">`, typed nodes/edges, and small custom node/edge components.

If a generic Vue task is involved, also apply the `vue-best-practices` skill when available.

## Source Baseline

Treat these upstream sources as the baseline when details may have changed:

- Official docs: `https://vueflow.dev/`
- GitHub repo: `https://github.com/bcakmakoglu/vue-flow`
- TypeDocs: `https://vueflow.dev/typedocs/`

Vue Flow is Vue 3 only. Do not propose Vue 2 support.

## Workflow

1. Inspect the existing project first:
   - Confirm Vue 3, TypeScript, Vite/Nuxt setup, and package manager.
   - Check whether `@vue-flow/core` and optional packages are already installed.
   - Locate global CSS entry points and existing component conventions.
2. Choose the state model before coding:
   - Use `v-model:nodes` and `v-model:edges` for typical editable graphs where user changes should update local refs.
   - Use `:nodes` and `:edges` for read-only or externally controlled graphs.
   - Use controlled-flow callbacks only when the app must approve, persist, transform, or reject every change.
3. Model graph data explicitly:
   - Every node and edge needs a stable unique `id`.
   - Every node needs `position`.
   - Every edge needs `source` and `target`.
   - Put domain data in `data`, not scattered across rendering code.
4. Keep graph UI decomposed:
   - Keep the root flow component responsible for wiring state, slots, controls, and event handlers.
   - Put custom node UI in separate `.vue` components.
   - Put custom edge UI in separate `.vue` components.
   - Move graph operations into composables when reused by panels, sidebars, toolbars, or nodes.
5. Validate visually and behaviorally:
   - Confirm required Vue Flow CSS is loaded globally.
   - Confirm nodes render, edges connect to the intended handles, pan/zoom works, and dynamic handles do not misalign.
   - For frontend work, use browser screenshots or Playwright when the app can run locally.

## Reference Routing

Load only the references needed for the task:

- Setup, CSS, typed nodes/edges, basic flow shell: [basics](references/basics.md)
- Custom node components, handles, node data, interactive controls inside nodes: [custom-nodes-and-handles](references/custom-nodes-and-handles.md)
- Edge types, custom edges, labels, markers, connection validation: [custom-edges-and-connections](references/custom-edges-and-connections.md)
- `useVueFlow`, `useNode`, updates, events, controlled flow, persistence: [state-composables-and-events](references/state-composables-and-events.md)
- Background, controls, minimap, panels, drag/drop, nested nodes, layouting: [editor-features-and-layout](references/editor-features-and-layout.md)
- Common bugs and checks: [troubleshooting](references/troubleshooting.md)

## Implementation Defaults

- Import core component/types from `@vue-flow/core`.
- Import optional components from their packages:
  - `@vue-flow/background`
  - `@vue-flow/controls`
  - `@vue-flow/minimap`
  - `@vue-flow/node-resizer`
  - `@vue-flow/node-toolbar`
- Import required CSS once in an unscoped/global style entry:
  - `@vue-flow/core/dist/style.css`
  - `@vue-flow/core/dist/theme-default.css`
- Add optional component CSS when using optional packages if the package docs/examples require it.
- Use typed `ref<Node[]>(...)` and `ref<Edge[]>(...)` unless the project has a stronger domain-specific graph type.
- Prefer slots for custom components:
  - `#node-task` renders nodes with `type: 'task'`.
  - `#edge-approval` renders edges with `type: 'approval'`.
- Use `Handle` components inside custom nodes. Multiple handles of the same type need unique `id` values.
- Do not hide handles with `v-if`/`v-show` when edges depend on them; keep them mounted and hide with CSS such as `opacity: 0`.
- Use `class="nodrag nopan"` on interactive elements inside nodes or edge labels so buttons/inputs do not accidentally drag or pan the canvas.

## Final Self-Check

- Required styles are imported globally.
- Node and edge ids are stable and unique.
- Custom slot names match the `type` values exactly.
- State model is intentional: `v-model`, props-only, or controlled flow.
- Domain data lives in `node.data` / `edge.data` and is typed.
- Handles exist for every connection point; same-type handles have ids.
- Edge source/target handle ids match real handle ids when used.
- Interactive node/edge controls use `nodrag nopan`.
- Dynamic handle changes call `updateNodeInternals` if edges become stale.
- Visual verification covers initial render, connect, drag, zoom, and any custom toolbar/sidebar behavior.
