# Custom Edges And Connections

Use this reference for built-in edge types, custom edge components, labels, markers, update behavior, and connection validation.

## Contents

- Built-In Edge Types
- Basic Custom Edge
- Edge Label With HTML
- Removing An Edge From A Label
- Connection Handler
- Connection Validation
- Markers
- Edge Checklist

## Built-In Edge Types

Vue Flow includes common edge types such as:

- `default` / bezier
- `straight`
- `step`
- `smoothstep`

```ts
const edges = ref<Edge[]>([
  { id: 'a-b', source: 'a', target: 'b', type: 'smoothstep', animated: true },
])
```

Use built-in types first. Create custom edges when you need custom labels, controls, path styling, markers, or domain behavior.

## Basic Custom Edge

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, getBezierPath, type EdgeProps } from '@vue-flow/core'

type ApprovalEdgeData = {
  color?: string
}

const props = defineProps<EdgeProps<ApprovalEdgeData>>()

const path = computed(() => getBezierPath(props))
</script>

<template>
  <BaseEdge
    :id="id"
    :path="path[0]"
    :style="{ stroke: data?.color ?? '#2563eb', strokeWidth: 2 }"
  />
</template>
```

Register with `#edge-approval` for edges with `type: 'approval'`.

## Edge Label With HTML

Edges are SVG paths. Use `EdgeLabelRenderer` when a label needs normal HTML, events, or controls.

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@vue-flow/core'

type Data = {
  label: string
}

const props = defineProps<EdgeProps<Data>>()
const path = computed(() => getSmoothStepPath(props))
</script>

<template>
  <BaseEdge :id="id" :path="path[0]" />

  <EdgeLabelRenderer>
    <button
      class="edge-label nodrag nopan"
      type="button"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px, ${path[2]}px)`,
      }"
    >
      {{ data.label }}
    </button>
  </EdgeLabelRenderer>
</template>
```

Use `pointerEvents: 'all'` plus `nodrag nopan` for clickable labels.

## Removing An Edge From A Label

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, useVueFlow } from '@vue-flow/core'

const props = defineProps<EdgeProps>()
const { removeEdges } = useVueFlow()
const path = computed(() => getBezierPath(props))
</script>

<template>
  <BaseEdge :id="id" :path="path[0]" />

  <EdgeLabelRenderer>
    <button
      class="nodrag nopan"
      type="button"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px, ${path[2]}px)`,
      }"
      @click="removeEdges(id)"
    >
      Delete
    </button>
  </EdgeLabelRenderer>
</template>
```

## Connection Handler

Use `onConnect` when the user draws a new edge and you need to create a domain-specific edge object.

```ts
import { useVueFlow, type Connection, type Edge } from '@vue-flow/core'

const { addEdges, onConnect } = useVueFlow()

onConnect((connection: Connection) => {
  const edge: Edge = {
    ...connection,
    id: `${connection.source}:${connection.sourceHandle ?? 'out'}->${connection.target}:${connection.targetHandle ?? 'in'}`,
    type: 'approval',
    data: { label: 'New route' },
  }

  addEdges(edge)
})
```

## Connection Validation

Use validation to enforce product rules before an edge is created.

```vue
<script setup lang="ts">
import { VueFlow, type Connection } from '@vue-flow/core'

function isValidConnection(connection: Connection) {
  if (connection.source === connection.target) return false
  if (connection.sourceHandle === 'failure' && connection.targetHandle !== 'input') return false

  return true
}
</script>

<template>
  <VueFlow :is-valid-connection="isValidConnection" />
</template>
```

Keep validation deterministic and cheap; it may run frequently during pointer interactions.

## Markers

Use edge marker options for arrowheads and direction cues:

```ts
import { MarkerType, type Edge } from '@vue-flow/core'

const edge: Edge = {
  id: 'a-b',
  source: 'a',
  target: 'b',
  markerEnd: MarkerType.ArrowClosed,
}
```

## Edge Checklist

- Use built-in edge types unless custom rendering is needed.
- Use `BaseEdge` for custom paths so selection and interactions stay consistent.
- Use `EdgeLabelRenderer` for HTML labels or controls.
- Mark interactive labels with `nodrag nopan` and `pointerEvents: 'all'`.
- Include `sourceHandle` and `targetHandle` when nodes have multiple handles.
- Use `onConnect` to normalize newly created edge data.
- Use `isValidConnection` to enforce graph rules at the interaction boundary.
