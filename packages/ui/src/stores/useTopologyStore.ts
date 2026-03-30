import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'

interface TopologyState {
  nodes: Node[]
  edges: Edge[]
  /** Replace the entire topology (authoritative sync from accepted SDSL or canvas edit) */
  setTopology: (nodes: Node[], edges: Edge[]) => void
  /** Update nodes only (e.g. after layout) */
  setNodes: (nodes: Node[]) => void
  /** Update edges only */
  setEdges: (edges: Edge[]) => void
}

export const useTopologyStore = create<TopologyState>((set) => ({
  nodes: [],
  edges: [],

  setTopology: (nodes, edges) => set({ nodes, edges }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}))
