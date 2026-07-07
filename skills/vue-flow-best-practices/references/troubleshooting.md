# Troubleshooting

Use this reference when Vue Flow renders incorrectly, edges do not connect, state does not update, or custom nodes/edges behave strangely.

## Contents

- Blank Or Broken Canvas
- Nodes Render But Edges Do Not
- Custom Node Does Not Render
- Custom Edge Does Not Render
- Buttons Inside Nodes Drag The Canvas
- State Updates Do Not Reflect In Local Arrays
- New Connections Are Missing Domain Data
- Layout Looks Wrong After Auto-Layout
- Multiple Flows Interfere
- Nuxt Or SSR Issues
- Debug Checklist

## Blank Or Broken Canvas

Check:

- `@vue-flow/core/dist/style.css` is imported globally.
- `@vue-flow/core/dist/theme-default.css` is imported if relying on default styling.
- The flow container has explicit height. `height: 100%` only works if parents also have height.
- The app is using Vue 3, not Vue 2.
- The component is mounted client-side if using SSR/Nuxt and browser APIs.

Minimal container check:

```css
.flow-editor {
  width: 100%;
  height: 640px;
}
```

## Nodes Render But Edges Do Not

Check:

- Edge `source` and `target` match real node ids.
- Node ids and edge ids are unique strings.
- Custom nodes include source/target `Handle` components where connections should attach.
- When using handle ids, `sourceHandle` and `targetHandle` match the actual handle ids.
- Hidden handles are still mounted; do not use `v-if` to remove handles needed by edges.
- Dynamic handles call `updateNodeInternals` after DOM updates if edge endpoints are stale.

## Custom Node Does Not Render

Check:

- Node has `type: 'task'`.
- Slot is named `#node-task`.
- The custom node component is imported.
- The slot forwards all props with `v-bind="props"`.
- Type names are consistent and case-sensitive.

```vue
<template #node-task="props">
  <TaskNode v-bind="props" />
</template>
```

## Custom Edge Does Not Render

Check:

- Edge has `type: 'approval'`.
- Slot is named `#edge-approval`.
- Custom edge uses `EdgeProps`.
- Custom edge renders a path with `BaseEdge` or a valid SVG path.
- HTML labels are rendered inside `EdgeLabelRenderer`, not directly inside SVG without SVG-compatible elements.

## Buttons Inside Nodes Drag The Canvas

Add both classes:

```vue
<button class="nodrag nopan" type="button">Edit</button>
```

For edge labels, also set `pointerEvents: 'all'` on the label element style.

## State Updates Do Not Reflect In Local Arrays

If using `:nodes="nodes"` and `:edges="edges"`, internal Vue Flow actions may update only the internal store.

Use `v-model:nodes` and `v-model:edges` for normal editable state:

```vue
<VueFlow v-model:nodes="nodes" v-model:edges="edges" />
```

Use controlled flow only when handling `@nodes-change` and `@edges-change` yourself.

## New Connections Are Missing Domain Data

Normalize new edges in `onConnect`:

```ts
const { onConnect, addEdges } = useVueFlow()

onConnect((connection) => {
  addEdges({
    ...connection,
    id: `${connection.source}-${connection.target}`,
    type: 'domain-edge',
    data: { label: 'New condition' },
  })
})
```

## Layout Looks Wrong After Auto-Layout

Check:

- Node width/height assumptions match actual custom node size.
- Positions from layout library are converted from center coordinates to Vue Flow top-left coordinates when needed.
- `sourcePosition` and `targetPosition` match layout direction.
- `fitView` runs after setting new node positions.

## Multiple Flows Interfere

Use explicit ids:

```vue
<VueFlow id="left-flow" />
<VueFlow id="right-flow" />
```

Then target the correct store:

```ts
const leftFlow = useVueFlow({ id: 'left-flow' })
```

## Nuxt Or SSR Issues

- Render Vue Flow only on the client if the page hits browser-only APIs during SSR.
- Put Vue Flow CSS imports in a global CSS file configured by Nuxt when possible.
- Guard direct `window`, `document`, `DragEvent`, and screenshot APIs behind client-only code.

## Debug Checklist

- Log `nodes.value` and `edges.value` after every graph operation.
- Inspect the rendered DOM for `.vue-flow`, `.vue-flow__node`, and `.vue-flow__edge`.
- Temporarily switch custom nodes/edges to built-in types to isolate data vs rendering bugs.
- Temporarily remove validation to isolate connection rule bugs.
- Use `fitView()` after restoring or auto-layouting to make sure content is not off-screen.
