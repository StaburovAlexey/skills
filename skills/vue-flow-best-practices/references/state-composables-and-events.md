# State, Composables, And Events

Use this reference for `useVueFlow`, `useNode`, graph actions, event listeners, controlled flow, and persistence.

## Contents

- `useVueFlow` Pattern
- Add, Remove, Update
- Events In Template
- Events With `useVueFlow`
- Controlled Flow
- Save And Restore
- Store Instance Id
- State Checklist

## `useVueFlow` Pattern

Call `useVueFlow()` in components or composables that need graph state/actions.

```ts
import { useVueFlow } from '@vue-flow/core'

export function useWorkflowGraph() {
  const {
    addNodes,
    addEdges,
    removeNodes,
    removeEdges,
    updateNode,
    updateNodeData,
    findNode,
    fitView,
    onConnect,
    onNodeClick,
  } = useVueFlow()

  return {
    addNodes,
    addEdges,
    removeNodes,
    removeEdges,
    updateNode,
    updateNodeData,
    findNode,
    fitView,
    onConnect,
    onNodeClick,
  }
}
```

This keeps panels, sidebars, and custom nodes from duplicating graph mutation logic.

## Add, Remove, Update

```ts
import { useVueFlow, type Node } from '@vue-flow/core'

const { addNodes, removeNodes, updateNode, updateNodeData, findNode } = useVueFlow()

function addTask() {
  const node: Node = {
    id: crypto.randomUUID(),
    type: 'task',
    position: { x: 120, y: 120 },
    data: { label: 'New task' },
  }

  addNodes(node)
}

function disableTask(id: string) {
  updateNode(id, { draggable: false, selectable: false })
}

function renameTask(id: string, label: string) {
  updateNodeData(id, { label })
}

function moveTaskRight(id: string) {
  const node = findNode(id)
  if (!node) return

  node.position.x += 120
}

function deleteTask(id: string) {
  removeNodes(id)
}
```

For persisted graphs, use backend ids or deterministic ids instead of `crypto.randomUUID()` when the node already exists in domain data.

## Events In Template

```vue
<script setup lang="ts">
import { type EdgeMouseEvent, type NodeMouseEvent } from '@vue-flow/core'

function onNodeClick({ node }: NodeMouseEvent) {
  console.log('node', node.id)
}

function onEdgeClick({ edge }: EdgeMouseEvent) {
  console.log('edge', edge.id)
}
</script>

<template>
  <VueFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
    @node-click="onNodeClick"
    @edge-click="onEdgeClick"
  />
</template>
```

## Events With `useVueFlow`

Use event hooks when the handler belongs to a composable or needs shared graph actions.

```ts
import { useVueFlow } from '@vue-flow/core'

const { onInit, onConnect, onNodeDragStop, addEdges, fitView } = useVueFlow()

onInit(() => {
  fitView({ padding: 0.2 })
})

onConnect((connection) => {
  addEdges({
    ...connection,
    id: `${connection.source}-${connection.target}`,
    type: 'smoothstep',
  })
})

onNodeDragStop(({ node }) => {
  console.log('persist position', node.id, node.position)
})
```

## Controlled Flow

Use controlled flow when the application must inspect or transform changes before accepting them.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  VueFlow,
  useVueFlow,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@vue-flow/core'

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const { applyNodeChanges, applyEdgeChanges } = useVueFlow()

function onNodesChange(changes: NodeChange[]) {
  applyNodeChanges(changes)
}

function onEdgesChange(changes: EdgeChange[]) {
  applyEdgeChanges(changes)
}
</script>

<template>
  <VueFlow
    :nodes="nodes"
    :edges="edges"
    :apply-default="false"
    @nodes-change="onNodesChange"
    @edges-change="onEdgesChange"
  />
</template>
```

Use this for validation, undo/redo history, server-synced editors, audit logs, or collaboration state. For simple local editing, `v-model:nodes` and `v-model:edges` are usually simpler.

## Save And Restore

Persist nodes, edges, and viewport together.

```ts
import { useVueFlow, type FlowExportObject } from '@vue-flow/core'

const { toObject, setViewport, setNodes, setEdges } = useVueFlow()

function saveFlow(): FlowExportObject {
  return toObject()
}

function restoreFlow(flow: FlowExportObject) {
  setNodes(flow.nodes)
  setEdges(flow.edges)
  setViewport(flow.viewport)
}
```

If the exact TypeScript type changes across versions, inspect TypeDocs or the installed package types and keep the persisted shape equivalent.

## Store Instance Id

Use an explicit `id` when multiple flows are on the same page or when a composable must target a specific flow.

```vue
<VueFlow id="campaign-flow" v-model:nodes="nodes" v-model:edges="edges" />
```

```ts
const campaignFlow = useVueFlow({ id: 'campaign-flow' })
```

## State Checklist

- Use `v-model` for normal editable graph state.
- Use controlled flow only when app-level change approval is required.
- Keep graph mutation functions in a composable when multiple UI surfaces need them.
- Persist viewport with nodes and edges.
- Use explicit flow ids when multiple flow instances exist.
- Debounce server persistence from drag/update events.
