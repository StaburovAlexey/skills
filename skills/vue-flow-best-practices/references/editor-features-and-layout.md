# Editor Features And Layout

Use this reference for common editor UI features: background, controls, minimap, panels, drag/drop, nested nodes, and automatic layout.

## Contents

- Canvas With Built-In Components
- Panel Toolbar
- Drag And Drop Node Creation
- Nested Nodes
- Node Resizer And Toolbar
- Automatic Layout
- UX Checklist

## Canvas With Built-In Components

```vue
<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background, BackgroundVariant } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
</script>

<template>
  <VueFlow class="flow-editor" v-model:nodes="nodes" v-model:edges="edges" fit-view-on-init>
    <Background :variant="BackgroundVariant.Dots" :gap="16" />
    <MiniMap pannable zoomable />
    <Controls />
  </VueFlow>
</template>

<style scoped>
.flow-editor {
  width: 100%;
  height: 100%;
  min-height: 640px;
}
</style>
```

Install optional packages before importing their components.

## Panel Toolbar

`Panel` from `@vue-flow/core` is useful for in-canvas controls.

```vue
<script setup lang="ts">
import { Panel, useVueFlow } from '@vue-flow/core'

const { fitView, zoomIn, zoomOut } = useVueFlow()
</script>

<template>
  <VueFlow v-model:nodes="nodes" v-model:edges="edges">
    <Panel position="top-right" class="flow-toolbar">
      <button type="button" @click="zoomOut">-</button>
      <button type="button" @click="zoomIn">+</button>
      <button type="button" @click="fitView({ padding: 0.2 })">Fit</button>
    </Panel>
  </VueFlow>
</template>
```

## Drag And Drop Node Creation

Use pane coordinate projection when dropping DOM items onto the graph.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow, type Edge, type Node } from '@vue-flow/core'

const { addNodes, project } = useVueFlow()
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const draggingType = ref<string | null>(null)
const flowWrapper = ref<InstanceType<typeof VueFlow> | null>(null)

function onDragStart(event: DragEvent, type: string) {
  draggingType.value = type

  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', type)
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/vueflow') || draggingType.value
  if (!type) return

  const bounds = flowWrapper.value?.$el.getBoundingClientRect()
  if (!bounds) return

  const position = project({
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  })

  const node: Node = {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: { label: `New ${type}` },
  }

  addNodes(node)
  draggingType.value = null
}
</script>

<template>
  <aside>
    <button draggable="true" type="button" @dragstart="onDragStart($event, 'task')">
      Task
    </button>
  </aside>

  <VueFlow
    ref="flowWrapper"
    class="flow-editor"
    v-model:nodes="nodes"
    v-model:edges="edges"
    @drop="onDrop"
    @dragover.prevent
  />
</template>
```

Use stable ids instead of `Date.now()` when dropped nodes correspond to persisted domain objects.

## Nested Nodes

Create groups by setting `parentNode` on child nodes. Child positions are relative to the parent.

```ts
const nodes = ref<Node[]>([
  {
    id: 'group-a',
    type: 'group',
    position: { x: 80, y: 80 },
    style: { width: '360px', height: '240px' },
    data: { label: 'Group A' },
  },
  {
    id: 'task-a',
    type: 'task',
    parentNode: 'group-a',
    extent: 'parent',
    expandParent: true,
    position: { x: 40, y: 60 },
    data: { label: 'Child task' },
  },
])
```

Use `extent: 'parent'` to keep child nodes inside the group.

## Node Resizer And Toolbar

Use these optional packages when the editor needs direct manipulation affordances.

```vue
<script setup lang="ts">
import { NodeResizer } from '@vue-flow/node-resizer'
import { NodeToolbar } from '@vue-flow/node-toolbar'
import { type NodeProps } from '@vue-flow/core'

const props = defineProps<NodeProps<{ label: string }>>()
</script>

<template>
  <div class="resizable-node">
    <NodeResizer :is-visible="selected" :min-width="120" :min-height="80" />

    <NodeToolbar :is-visible="selected" position="top">
      <button class="nodrag nopan" type="button">Edit</button>
    </NodeToolbar>

    {{ props.data.label }}
  </div>
</template>
```

## Automatic Layout

Vue Flow does not provide a built-in layout engine. Use a third-party layout library such as Dagre or ELK, then update node positions.

```ts
import dagre from '@dagrejs/dagre'
import { Position, type Edge, type Node } from '@vue-flow/core'

export function layoutGraph(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'LR') {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: direction })

  for (const node of nodes) {
    graph.setNode(node.id, { width: 180, height: 64 })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const position = graph.node(node.id)

    return {
      ...node,
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
      position: {
        x: position.x - 90,
        y: position.y - 32,
      },
    }
  })
}
```

Run layout after nodes have known dimensions if custom nodes vary significantly in size.

## UX Checklist

- Give the flow container an explicit height.
- Keep editor toolbars dense and out of the graph's primary working area.
- Use `fitView` after initial load, restore, or auto-layout.
- Avoid recreating `nodes`/`edges` arrays on every render unless intentionally applying a controlled change.
- Use `nodes-draggable`, `nodes-connectable`, `elements-selectable`, and zoom props to match the editor mode.
- Persist node positions after drag stop, not on every pointer move unless collaboration requires it.
