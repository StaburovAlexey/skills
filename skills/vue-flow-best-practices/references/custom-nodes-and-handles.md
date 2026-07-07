# Custom Nodes And Handles

Use this reference for custom node components, multiple handles, dynamic handles, and interactive controls inside nodes.

## Contents

- Basic Custom Node
- Multiple Handles
- Connection Mode
- Interactive Controls Inside Nodes
- Updating Node Data From The Node
- Hidden Handles
- Dynamic Handles
- Custom Node Checklist

## Basic Custom Node

```vue
<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'

type TaskData = {
  label: string
  assignee?: string
}

defineProps<NodeProps<TaskData>>()
</script>

<template>
  <div class="task-node">
    <Handle type="target" :position="Position.Left" />

    <strong>{{ data.label }}</strong>
    <span v-if="data.assignee">{{ data.assignee }}</span>

    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.task-node {
  min-width: 160px;
  padding: 10px 12px;
  border: 1px solid #d6dae1;
  border-radius: 6px;
  background: #fff;
  display: grid;
  gap: 4px;
}
</style>
```

Register it with a matching slot:

```vue
<template #node-task="props">
  <TaskNode v-bind="props" />
</template>
```

The slot name must be `node-` plus the node `type`.

## Multiple Handles

Multiple handles of the same type need unique `id` values. Store those ids on edges with `sourceHandle` and `targetHandle`.

```vue
<script setup lang="ts">
import { Handle, Position, type NodeProps } from '@vue-flow/core'

defineProps<NodeProps<{ label: string }>>()
</script>

<template>
  <div class="branch-node">
    <Handle id="input" type="target" :position="Position.Left" />

    <span>{{ data.label }}</span>

    <Handle id="success" type="source" :position="Position.Right" class="handle-success" />
    <Handle id="failure" type="source" :position="Position.Right" class="handle-failure" />
  </div>
</template>

<style scoped>
.branch-node {
  position: relative;
  padding: 12px 16px;
}

.handle-success {
  top: 30%;
}

.handle-failure {
  top: 70%;
}
</style>
```

```ts
const edges = ref<Edge[]>([
  {
    id: 'branch-success',
    source: 'branch',
    sourceHandle: 'success',
    target: 'approved',
    targetHandle: 'input',
  },
  {
    id: 'branch-failure',
    source: 'branch',
    sourceHandle: 'failure',
    target: 'rejected',
    targetHandle: 'input',
  },
])
```

## Connection Mode

Use strict mode when the domain requires `source` to `target` connections only:

```vue
<script setup lang="ts">
import { ConnectionMode } from '@vue-flow/core'
</script>

<template>
  <VueFlow :connection-mode="ConnectionMode.Strict" />
</template>
```

Loose mode allows connecting handles without enforcing source/target direction.

## Interactive Controls Inside Nodes

Add `nodrag nopan` to buttons, inputs, selects, menus, sliders, and other interactive elements inside a node.

```vue
<script setup lang="ts">
import { Handle, Position, type NodeProps, useVueFlow } from '@vue-flow/core'

type Data = {
  label: string
  enabled: boolean
}

const props = defineProps<NodeProps<Data>>()
const { updateNodeData, removeNodes } = useVueFlow()

function toggleEnabled() {
  updateNodeData(props.id, { enabled: !props.data.enabled })
}
</script>

<template>
  <div class="action-node">
    <Handle type="target" :position="Position.Left" />

    <span>{{ data.label }}</span>

    <button class="nodrag nopan" type="button" @click="toggleEnabled">
      {{ data.enabled ? 'Disable' : 'Enable' }}
    </button>

    <button class="nodrag nopan" type="button" @click="removeNodes(id)">
      Remove
    </button>

    <Handle type="source" :position="Position.Right" />
  </div>
</template>
```

## Updating Node Data From The Node

Use `useNode()` when a custom node needs direct access to its reactive node object.

```vue
<script setup lang="ts">
import { useNode } from '@vue-flow/core'

type NodeData = {
  label: string
  count: number
}

const { node } = useNode<NodeData>()

function increment() {
  node.data = {
    ...node.data,
    count: node.data.count + 1,
  }
}
</script>

<template>
  <button class="nodrag nopan" type="button" @click="increment">
    {{ node.data.label }}: {{ node.data.count }}
  </button>
</template>
```

Prefer `updateNodeData` from a shared composable when multiple components update the same graph.

## Hidden Handles

Do not remove handles from the DOM if an edge depends on them. Hide visually instead:

```vue
<Handle type="source" :position="Position.Right" style="opacity: 0" />
```

Removing handles with `v-if` can break edge endpoint calculations.

## Dynamic Handles

When handles are added, removed, or repositioned dynamically and edges look stale, update node internals.

```ts
import { nextTick } from 'vue'
import { useVueFlow } from '@vue-flow/core'

const { updateNodeInternals } = useVueFlow()

async function afterPortsChanged(nodeId: string) {
  await nextTick()
  updateNodeInternals([nodeId])
}
```

From a custom node, emitting `updateNodeInternals` is also supported:

```vue
<script setup lang="ts">
const emit = defineEmits<{
  updateNodeInternals: []
}>()

function onPortsChanged() {
  emit('updateNodeInternals')
}
</script>
```

## Custom Node Checklist

- Define `NodeProps<TData>` for the node component.
- Keep handles mounted.
- Give same-type handles unique ids.
- Position multiple handles manually with CSS.
- Mark interactive child controls with `nodrag nopan`.
- Avoid owning global graph orchestration in the node component unless it is truly local.
