# Basics

Use this reference for initial setup, CSS, typed node/edge definitions, and the root `<VueFlow>` shell.

## Contents

- Install
- Required CSS
- Minimal Typed Flow
- State Model Choices
- Custom Type Wiring
- Root Flow Component Pattern
- Data Modeling Guidelines

## Install

```bash
pnpm add @vue-flow/core
```

Use the repo's package manager. Optional packages are separate:

```bash
pnpm add @vue-flow/background @vue-flow/controls @vue-flow/minimap
```

## Required CSS

Import these once in a global stylesheet or an unscoped root component style:

```css
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
```

Do not put these imports in a `<style scoped>` block.

## Minimal Typed Flow

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, type Edge, type Node, Position } from '@vue-flow/core'

type StepData = {
  label: string
  status: 'draft' | 'active' | 'done'
}

const nodes = ref<Node<StepData>[]>([
  {
    id: 'start',
    type: 'input',
    position: { x: 80, y: 80 },
    sourcePosition: Position.Right,
    data: { label: 'Start', status: 'active' },
  },
  {
    id: 'review',
    position: { x: 340, y: 80 },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    data: { label: 'Review', status: 'draft' },
  },
])

const edges = ref<Edge[]>([
  {
    id: 'start-review',
    source: 'start',
    target: 'review',
    animated: true,
  },
])
</script>

<template>
  <VueFlow v-model:nodes="nodes" v-model:edges="edges" fit-view-on-init />
</template>
```

## State Model Choices

Use `v-model:nodes` and `v-model:edges` for editable diagrams:

```vue
<VueFlow v-model:nodes="nodes" v-model:edges="edges" />
```

Use props-only when the flow is a projection of external state and Vue Flow should not own mutations:

```vue
<VueFlow :nodes="nodes" :edges="edges" :nodes-draggable="false" :nodes-connectable="false" />
```

Do not mix the deprecated `modelValue` style with `nodes`/`edges` props.

## Custom Type Wiring

Node and edge `type` values map to slots:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, type Edge, type Node } from '@vue-flow/core'
import TaskNode from './TaskNode.vue'
import ApprovalEdge from './ApprovalEdge.vue'

const nodes = ref<Node[]>([
  { id: 'task-1', type: 'task', position: { x: 80, y: 80 }, data: { label: 'Call lead' } },
  { id: 'task-2', type: 'task', position: { x: 360, y: 80 }, data: { label: 'Qualify' } },
])

const edges = ref<Edge[]>([
  { id: 'task-1-task-2', type: 'approval', source: 'task-1', target: 'task-2', data: { label: 'Approved' } },
])
</script>

<template>
  <VueFlow v-model:nodes="nodes" v-model:edges="edges">
    <template #node-task="nodeProps">
      <TaskNode v-bind="nodeProps" />
    </template>

    <template #edge-approval="edgeProps">
      <ApprovalEdge v-bind="edgeProps" />
    </template>
  </VueFlow>
</template>
```

## Root Flow Component Pattern

Keep the root graph component thin:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, type Edge, type Node } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import TaskNode from './nodes/TaskNode.vue'
import ApprovalEdge from './edges/ApprovalEdge.vue'

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
</script>

<template>
  <VueFlow
    class="workflow-canvas"
    v-model:nodes="nodes"
    v-model:edges="edges"
    :default-viewport="{ zoom: 0.9 }"
    fit-view-on-init
  >
    <Background />
    <MiniMap />
    <Controls />

    <template #node-task="props">
      <TaskNode v-bind="props" />
    </template>

    <template #edge-approval="props">
      <ApprovalEdge v-bind="props" />
    </template>
  </VueFlow>
</template>

<style scoped>
.workflow-canvas {
  width: 100%;
  height: 100%;
  min-height: 520px;
}
</style>
```

## Data Modeling Guidelines

- Keep backend ids stable; avoid `Math.random()` for persisted flows.
- Use `node.data` for domain payloads and `node.position` for canvas state.
- Use `edge.data` for labels, conditions, weights, or UI metadata.
- Keep rendering components dumb: receive `NodeProps`/`EdgeProps`, emit UI intent, and let parent/composables mutate graph state.
- Persist `nodes`, `edges`, and viewport together when restoring editor sessions.
