import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  reconnectEdge,
  ConnectionMode,
  Handle,
  Position,
  getBezierPath,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
} from '@xyflow/react'
import type { Connection, Edge, EdgeChange, EdgeProps, Node, NodeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, CircleDot, ArrowRight, Grip, LayoutTemplate } from 'lucide-react'
import dagre from 'dagre'
import { cn } from '@/lib/utils'

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type NodeType = 'entity' | 'dimension' | 'event'
type RelCategory = 'structural' | 'interoperation'

interface NodeData {
  id: string
  label: string
  type: NodeType
  description?: string
  properties: { name: string; type: string; required: boolean }[]
  actions?: string[]
  isRelated?: boolean
  connectState?: 'compatible' | 'incompatible' | null
  /** which handles are live: handleId → 'source' | 'target' */
  connectedHandles?: Record<string, 'source' | 'target'>
}

interface RelDef {
  category: RelCategory
  stroke: string
  strokeWidth: number
  /** Only set for interoperation; structural edges are always solid */
  strokeDasharray?: string
}

/* ─────────────────────────────────────────────
   Relationship definitions
   structural     → solid line
   interoperation → dashed + animated (marching ants)
───────────────────────────────────────────── */
const RELATIONSHIP_DEFS: Record<string, RelDef> = {
  participates:    { category: 'structural',     stroke: '#2dd4bf', strokeWidth: 2 },
  participated_by: { category: 'structural',     stroke: '#2dd4bf', strokeWidth: 2 },
  triggers:        { category: 'interoperation', stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,4' },
  triggered_by:    { category: 'interoperation', stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,4' },
  posts:           { category: 'interoperation', stroke: '#a064dc', strokeWidth: 2, strokeDasharray: '5,4' },
  posted_by:       { category: 'interoperation', stroke: '#a064dc', strokeWidth: 2, strokeDasharray: '5,4' },
  dimensions:      { category: 'structural',     stroke: '#508cdc', strokeWidth: 1.5 },
  dimension_of:    { category: 'structural',     stroke: '#508cdc', strokeWidth: 1.5 },
  relates:         { category: 'structural',     stroke: '#888',    strokeWidth: 1 },
}

function buildEdge(source: string, target: string, relType: string): Edge {
  const def = RELATIONSHIP_DEFS[relType] ?? RELATIONSHIP_DEFS.relates
  const isInterop = def.category === 'interoperation'
  return {
    id: `e-${source}-${target}`,
    source,
    target,
    label: relType,
    type: 'ontology',
    animated: isInterop,
    style: {
      stroke: def.stroke,
      strokeWidth: def.strokeWidth,
      strokeDasharray: isInterop ? (def.strokeDasharray ?? '5,4') : undefined,
    } as React.CSSProperties,
    markerEnd: { type: MarkerType.ArrowClosed, color: def.stroke, width: 16, height: 16 },
    reconnectable: true,
    data: { relType, category: def.category },
  }
}

/* ─────────────────────────────────────────────
   Port-state sync — compute which handles are
   live from the current edge list
───────────────────────────────────────────── */
function syncPortStates(nodes: Node[], edges: Edge[]): Node[] {
  const portMap = new Map<string, Record<string, 'source' | 'target'>>()
  edges.forEach((e) => {
    if (e.sourceHandle) {
      if (!portMap.has(e.source)) portMap.set(e.source, {})
      portMap.get(e.source)![e.sourceHandle] = 'source'
    }
    if (e.targetHandle) {
      if (!portMap.has(e.target)) portMap.set(e.target, {})
      portMap.get(e.target)![e.targetHandle] = 'target'
    }
  })
  return nodes.map((n) => ({
    ...n,
    data: { ...n.data, connectedHandles: portMap.get(n.id) ?? {} },
  }))
}

/* ─────────────────────────────────────────────
   Initial nodes
───────────────────────────────────────────── */
const INITIAL_NODES: Node[] = [
  {
    id: 'contract',
    position: { x: 100, y: 100 },
    type: 'custom',
    data: {
      id: 'contract', label: 'Contract', type: 'entity',
      description: '合同是双方或多方之间的法律约束性协议',
      properties: [
        { name: 'contractId', type: 'string',  required: true  },
        { name: 'amount',     type: 'decimal', required: true  },
        { name: 'status',     type: 'enum',    required: true  },
        { name: 'signDate',   type: 'date',    required: false },
      ],
      actions: ['sign', 'amend', 'terminate'],
    },
  },
  {
    id: 'revenue',
    position: { x: 450, y: 80 },
    type: 'custom',
    data: {
      id: 'revenue', label: 'RevenueRecognition', type: 'event',
      description: '收入确认事件记录何时及如何将收入确认为已实现',
      properties: [
        { name: 'recognitionDate', type: 'date',    required: true },
        { name: 'amount',          type: 'decimal', required: true },
        { name: 'method',          type: 'enum',    required: true },
      ],
      actions: ['recognize', 'defer', 'reverse'],
    },
  },
  {
    id: 'tax',
    position: { x: 450, y: 280 },
    type: 'custom',
    data: {
      id: 'tax', label: 'TaxObligation', type: 'event',
      description: '基于合同或交易产生的纳税义务',
      properties: [
        { name: 'taxType',       type: 'enum',    required: true },
        { name: 'taxableAmount', type: 'decimal', required: true },
        { name: 'dueDate',       type: 'date',    required: true },
      ],
      actions: ['calculate', 'file', 'defer'],
    },
  },
  {
    id: 'ledger',
    position: { x: 750, y: 120 },
    type: 'custom',
    data: {
      id: 'ledger', label: 'GeneralLedger', type: 'entity',
      description: '总账记录所有已审核的财务事务',
      properties: [
        { name: 'accountCode', type: 'string',  required: true },
        { name: 'debit',       type: 'decimal', required: true },
        { name: 'credit',      type: 'decimal', required: true },
      ],
      actions: ['post', 'reconcile', 'close'],
    },
  },
  {
    id: 'actor',
    position: { x: 100, y: 300 },
    type: 'custom',
    data: {
      id: 'actor', label: 'Actor', type: 'dimension',
      description: '参与合同或交易的主体',
      properties: [
        { name: 'actorId', type: 'string', required: true },
        { name: 'name',    type: 'string', required: true },
        { name: 'role',    type: 'enum',   required: true },
      ],
      actions: ['authenticate', 'authorize', 'audit'],
    },
  },
  {
    id: 'cost_center',
    position: { x: 750, y: 300 },
    type: 'custom',
    data: {
      id: 'cost_center', label: 'CostCenter', type: 'dimension',
      description: '成本中心是管理会计的基本分析维度',
      properties: [
        { name: 'centerId', type: 'string',  required: true  },
        { name: 'name',     type: 'string',  required: true  },
        { name: 'budget',   type: 'decimal', required: false },
      ],
    },
  },
]

const INITIAL_EDGES: Edge[] = [
  buildEdge('actor',    'contract',    'participates'),
  buildEdge('contract', 'revenue',     'triggers'),
  buildEdge('contract', 'tax',         'triggers'),
  buildEdge('revenue',  'ledger',      'posts'),
  buildEdge('contract', 'cost_center', 'dimensions'),
]

/* ─────────────────────────────────────────────
   Relationship rules
───────────────────────────────────────────── */
const RELATIONSHIP_RULES: Record<string, { targets: string[]; relationType: string }[]> = {
  contract:    [
    { targets: ['revenue', 'tax'], relationType: 'triggers'        },
    { targets: ['cost_center'],    relationType: 'dimensions'      },
    { targets: ['actor'],          relationType: 'participated_by' },
  ],
  revenue:     [
    { targets: ['ledger'],   relationType: 'posts'        },
    { targets: ['contract'], relationType: 'triggered_by' },
  ],
  tax:         [{ targets: ['contract'],  relationType: 'triggered_by' }],
  ledger:      [{ targets: ['revenue'],   relationType: 'posted_by'    }],
  actor:       [{ targets: ['contract'],  relationType: 'participates' }],
  cost_center: [{ targets: ['contract'],  relationType: 'dimension_of' }],
}

function getRelatedNodeIds(nodeId: string): string[] {
  const related = new Set<string>()
  const forward = RELATIONSHIP_RULES[nodeId]
  if (forward) forward.forEach((r) => r.targets.forEach((t) => related.add(t)))
  Object.entries(RELATIONSHIP_RULES).forEach(([src, rules]) => {
    rules.forEach((r) => { if (r.targets.includes(nodeId)) related.add(src) })
  })
  return Array.from(related)
}

function getRelationshipType(sourceId: string, targetId: string): string {
  const rules = RELATIONSHIP_RULES[sourceId]
  if (rules) for (const r of rules) if (r.targets.includes(targetId)) return r.relationType
  const rev = RELATIONSHIP_RULES[targetId]
  if (rev) for (const r of rev) if (r.targets.includes(sourceId)) return r.relationType
  return 'relates'
}

function isConnectionValid(sourceId: string, targetId: string): boolean {
  if (sourceId === targetId) return false
  return getRelatedNodeIds(sourceId).includes(targetId)
}

/* ─────────────────────────────────────────────
   Helper: node type icon
───────────────────────────────────────────── */
function getTypeIcon(type: NodeType) {
  if (type === 'entity')    return <Box        className="h-3.5 w-3.5 text-primary" />
  if (type === 'dimension') return <CircleDot  className="h-3.5 w-3.5 text-primary" />
  return                           <ArrowRight className="h-3.5 w-3.5 text-primary" />
}

/* ─────────────────────────────────────────────
   Port handle — plain circle until connected,
   then emit (↗ amber) or receive (↙ sky) icon
───────────────────────────────────────────── */
function PortHandle({
  id, type, position, role,
}: {
  id: string
  type: 'source' | 'target'
  position: Position
  role?: 'source' | 'target'
}) {
  const buildPortChevronPath = (handleId: string, direction: 'inward' | 'outward') => {
    const towardCenter = direction === 'inward'
    switch (handleId) {
      case 'top':    return towardCenter ? 'M3.2 4.2 L5 6 L6.8 4.2' : 'M3.2 5.8 L5 4 L6.8 5.8'
      case 'bottom': return towardCenter ? 'M3.2 5.8 L5 4 L6.8 5.8' : 'M3.2 4.2 L5 6 L6.8 4.2'
      case 'left':   return towardCenter ? 'M4.2 3.2 L6 5 L4.2 6.8' : 'M5.8 3.2 L4 5 L5.8 6.8'
      case 'right':  return towardCenter ? 'M5.8 3.2 L4 5 L5.8 6.8' : 'M4.2 3.2 L6 5 L4.2 6.8'
      default:       return towardCenter ? 'M4.2 3.2 L6 5 L4.2 6.8' : 'M5.8 3.2 L4 5 L5.8 6.8'
    }
  }

  const isEmit = role === 'source'
  const isRecv = role === 'target'
  const connected = !!role
  const chevronPath = buildPortChevronPath(id, isEmit ? 'outward' : 'inward')
  const edgeCenteredStyle = {
    top:    { left: '50%', top: 0,     transform: 'translate(-50%, calc(-50% - 1px))' },
    bottom: { left: '50%', top: '100%',transform: 'translate(-50%, calc(-50% + 1px))' },
    left:   { left: 0,     top: '50%', transform: 'translate(calc(-50% - 1px), -50%)' },
    right:  { left: '100%',top: '50%', transform: 'translate(calc(-50% + 1px), -50%)' },
  }[id]

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={edgeCenteredStyle}
      className={cn(
        '!rounded-full !border-2 transition-all duration-200',
        !connected && '!w-3 !h-3 !bg-teal-700 !border-teal-400 hover:!bg-teal-600 hover:!border-teal-300',
        connected  && '!w-3 !h-3 !flex !items-center !justify-center',
        isEmit     && '!bg-amber-500 !border-amber-400',
        isRecv     && '!bg-sky-500 !border-sky-400',
      )}
    >
      {isEmit && (
        <svg viewBox="0 0 10 10" width="7" height="7" className="pointer-events-none">
          <path d={chevronPath} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
      {isRecv && (
        <svg viewBox="0 0 10 10" width="7" height="7" className="pointer-events-none">
          <path d={chevronPath} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )}
    </Handle>
  )
}

/* ─────────────────────────────────────────────
   Custom node   (card style + connect states)
───────────────────────────────────────────── */
function OntologyNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const { connectState, isRelated, properties, connectedHandles = {} } = data
  const display = properties.slice(0, 4)

  return (
    <div
      className={cn(
        'w-52 rounded-2xl border-2 shadow-lg transition-colors duration-200',
        'bg-card backdrop-blur-sm border-primary/40',
        selected                        && 'node-blink',
        isRelated && !selected          && 'node-related-blink',
        connectState === 'compatible'   && 'node-connect-compatible',
        connectState === 'incompatible' && 'node-connect-incompatible',
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <Grip className="h-3 w-3 text-muted-foreground cursor-grab shrink-0" />
        <div className="p-0.5 rounded bg-primary/20">{getTypeIcon(data.type)}</div>
        <span className="font-medium text-sm truncate">{data.label}</span>
      </div>

      <div className="p-2 space-y-1">
        {display.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', p.required ? 'bg-primary' : 'bg-muted-foreground')} />
            <span className="text-foreground truncate">{p.name}</span>
            <span className="text-muted-foreground ml-auto font-mono text-[10px]">{p.type}</span>
          </div>
        ))}
        {properties.length > 4 && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            +{properties.length - 4} 更多属性
          </div>
        )}
      </div>

      {/* Directional port handles */}
      <PortHandle id="top"    type="target" position={Position.Top}    role={connectedHandles['top']}    />
      <PortHandle id="bottom" type="source" position={Position.Bottom} role={connectedHandles['bottom']} />
      <PortHandle id="left"   type="source" position={Position.Left}   role={connectedHandles['left']}   />
      <PortHandle id="right"  type="source" position={Position.Right}  role={connectedHandles['right']}  />
    </div>
  )
}

const NODE_TYPES = { custom: OntologyNode }

/* ─────────────────────────────────────────────
   Custom edge — smoothstep routing + arrowhead
   + relation-name label
───────────────────────────────────────────── */
function OntologyEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  markerEnd, style, data, label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 16,
  })

  const relName = (data as any)?.relType ?? (label as string) ?? ''
  const stroke  = (style as React.CSSProperties)?.stroke as string | undefined

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} interactionWidth={20} />
      {relName && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, calc(-50% - 3px)) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 5,
            }}
            className="nodrag nopan"
          >
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-full
                bg-card/90 border border-border/60 backdrop-blur"
              style={{ color: stroke ?? 'inherit' }}
            >
              {relName}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const EDGE_TYPES = { ontology: OntologyEdge }

/* ─────────────────────────────────────────────
   Magnetic connection line
───────────────────────────────────────────── */
function MagneticConnectionLine({
  fromX, fromY, toX, toY,
  fromPosition, toPosition,
  connectionStatus,
}: {
  fromX: number; fromY: number; toX: number; toY: number
  fromPosition: Position; toPosition: Position
  connectionStatus: 'valid' | 'invalid' | null
}) {
  const [path] = getBezierPath({
    sourceX: fromX, sourceY: fromY, sourcePosition: fromPosition,
    targetX: toX,   targetY: toY,   targetPosition: toPosition,
  })

  const isValid   = connectionStatus === 'valid'
  const isInvalid = connectionStatus === 'invalid'
  const stroke = isInvalid ? '#ef4444' : '#2dd4bf'
  const glow   = isInvalid ? 'rgba(239,68,68,0.35)' : 'rgba(45,212,191,0.35)'

  return (
    <g>
      <path d={path} stroke={glow} strokeWidth={isInvalid ? 8 : 14} fill="none" />
      <path
        d={path}
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        strokeDasharray={isInvalid ? '4,3' : '10,5'}
        className={isInvalid ? 'conn-line-invalid' : 'conn-line-valid'}
      />
      <circle cx={toX} cy={toY} r={isValid ? 6 : 4} fill={stroke} opacity={0.9} />
    </g>
  )
}

/* ─────────────────────────────────────────────
   Dagre auto-layout
───────────────────────────────────────────── */
function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 100, ranksep: 120 })
  const NW = 208, NH = 160

  nodes.forEach((n) => g.setNode(n.id, { width: NW, height: NH }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  const usedHandles = new Map<string, Map<string, string>>()
  const getHandle = (nodeId: string, prefs: string[], relType: string) => {
    if (!usedHandles.has(nodeId)) usedHandles.set(nodeId, new Map())
    const used = usedHandles.get(nodeId)!
    for (const h of prefs) {
      if (!used.has(h) || used.get(h) === relType) { used.set(h, relType); return h }
    }
    return prefs[0]
  }

  const newNodes = nodes.map((n) => {
    const pos = g.node(n.id)
    return { ...n, position: { x: pos.x - NW / 2, y: pos.y - NH / 2 } }
  })

  const newEdges = edges.map((edge) => {
    const src = newNodes.find((n) => n.id === edge.source)
    const tgt = newNodes.find((n) => n.id === edge.target)
    if (!src || !tgt) return { ...edge, type: 'ontology', reconnectable: true }
    const dx = tgt.position.x - src.position.x
    const dy = tgt.position.y - src.position.y
    let srcPrefs: string[], tgtPrefs: string[]
    if (Math.abs(dx) > Math.abs(dy)) {
      srcPrefs = dx > 0 ? ['right','bottom','top','left'] : ['left','bottom','top','right']
      tgtPrefs = dx > 0 ? ['left','top','bottom','right'] : ['right','top','bottom','left']
    } else {
      srcPrefs = dy > 0 ? ['bottom','right','left','top'] : ['top','right','left','bottom']
      tgtPrefs = dy > 0 ? ['top','left','right','bottom'] : ['bottom','left','right','top']
    }
    const relType = (edge.data as any)?.relType ?? 'default'
    return {
      ...edge,
      sourceHandle: getHandle(edge.source, srcPrefs, relType),
      targetHandle: getHandle(edge.target, tgtPrefs, relType),
      type: 'ontology',
      reconnectable: true,
    }
  })

  return { nodes: newNodes, edges: newEdges }
}

/* ─────────────────────────────────────────────
   CSS animations
───────────────────────────────────────────── */
const CSS = `
@keyframes v0-node-blink {
  0%,100% { filter: drop-shadow(0 0 4px rgba(250,204,21,.6)); transform: scale(1); }
  50%     { filter: drop-shadow(0 0 20px rgba(250,204,21,.9)); transform: scale(1.06); }
}
.node-blink { animation: v0-node-blink 1.5s ease-in-out infinite; z-index: 1000; }

@keyframes v0-node-rel {
  0%,100% { filter: drop-shadow(0 0 2px rgba(45,212,191,.4)); }
  50%     { filter: drop-shadow(0 0 12px rgba(45,212,191,.7)); }
}
.node-related-blink { animation: v0-node-rel 2s ease-in-out infinite; }

@keyframes magnetic-breathe {
  0%,100% { box-shadow: 0 0 0 2px rgba(45,212,191,.5),0 0 10px rgba(45,212,191,.3); border-color: rgba(45,212,191,.8) !important; }
  50%     { box-shadow: 0 0 0 3px rgba(45,212,191,.9),0 0 24px rgba(45,212,191,.6); border-color: rgba(45,212,191,1) !important; }
}
.node-connect-compatible  { animation: magnetic-breathe .8s ease-in-out infinite; z-index: 900; }
.node-connect-incompatible{ opacity: .35; filter: grayscale(.5); }

@keyframes v0-edge-glow {
  0%,100% { stroke: rgba(250,204,21,.85); stroke-width: 2.5px; filter: drop-shadow(0 0 2px rgba(250,204,21,.9)); }
  50%     { stroke: rgba(255,220,50,1);   stroke-width: 3.5px; filter: drop-shadow(0 0 4px rgba(255,220,50,1)); }
}
.react-flow__edge.selected path.react-flow__edge-path {
  animation: v0-edge-glow 1s ease-in-out infinite;
  stroke: rgba(250,204,21,1) !important;
}
.react-flow__edge.selected path.react-flow__edge-interaction { stroke-width: 28px; cursor: pointer; }

@keyframes handle-valid-breathe {
  0%,100% { transform: scale(1.3); opacity:.9; }
  50%     { transform: scale(1.55); opacity:1; }
}
.react-flow__handle-valid {
  background-color: rgb(45,212,191) !important;
  box-shadow: 0 0 0 3px rgba(45,212,191,.5), 0 0 16px rgba(45,212,191,.8) !important;
  animation: handle-valid-breathe .8s ease-in-out infinite !important;
  z-index: 10 !important;
}

@keyframes handle-shake {
  0%,100% { transform: translateX(0); }
  25%     { transform: translateX(-3px); }
  75%     { transform: translateX(3px); }
}
.react-flow__handle-invalid {
  background-color: rgb(239,68,68) !important;
  box-shadow: 0 0 8px rgba(239,68,68,.8) !important;
  animation: handle-shake .15s ease-in-out infinite !important;
}

@keyframes conn-dash-flow    { 0% { stroke-dashoffset: 30; } 100% { stroke-dashoffset: 0; } }
@keyframes conn-invalid-pulse{ 0%,100% { opacity:.7; } 50% { opacity:1; } }
.conn-line-valid   { animation: conn-dash-flow    .5s linear      infinite; }
.conn-line-invalid { animation: conn-invalid-pulse .3s ease-in-out infinite; }
`

/* ─────────────────────────────────────────────
   Legend overlay
───────────────────────────────────────────── */
function RelationLegend() {
  return (
    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur border border-border rounded-lg p-3 z-10 text-xs pointer-events-none">
      <p className="text-muted-foreground font-semibold mb-2 uppercase tracking-wider text-[10px]">关系类型</p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <svg width="36" height="10" viewBox="0 0 36 10">
            <line x1="0" y1="5" x2="28" y2="5" stroke="#2dd4bf" strokeWidth="2" />
            <polygon points="24,2 30,5 24,8" fill="#2dd4bf" />
          </svg>
          <span className="text-foreground">structural 静态结构</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="36" height="10" viewBox="0 0 36 10">
            <line x1="0" y1="5" x2="28" y2="5" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,4">
              <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="0.4s" repeatCount="indefinite" />
            </line>
            <polygon points="24,2 30,5 24,8" fill="#ef4444" />
          </svg>
          <span className="text-foreground">interoperation 动态交互</span>
        </div>
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border/50">
          <svg viewBox="0 0 10 10" width="10" height="10">
            <circle cx="5" cy="5" r="4" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M4.2 3.2 L6 5 L4.2 6.8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-foreground">emit port 发射端口</span>
        </div>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 10 10" width="10" height="10">
            <circle cx="5" cy="5" r="4" fill="#0ea5e9" stroke="#38bdf8" strokeWidth="1.2" />
            <path d="M5.8 3.2 L4 5 L5.8 6.8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="text-foreground">receive port 接收端口</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
interface OntologyGraphProps {
  onSelectItem?: (type: 'node' | 'edge', data: any) => void
}

export function OntologyGraph({ onSelectItem }: OntologyGraphProps) {
  const init = () => {
    const { nodes, edges } = getLayoutedElements(INITIAL_NODES, INITIAL_EDGES)
    return { nodes: syncPortStates(nodes, edges), edges }
  }

  const [allNodes, setAllNodes] = useState<Node[]>(() => init().nodes)
  const [allEdges, setAllEdges] = useState<Edge[]>(() => init().edges)
  const edgeReconnectSuccessful = useRef(true)

  /* Sync port icons whenever edge list changes */
  useEffect(() => {
    setAllNodes((nds) => syncPortStates(nds, allEdges))
  }, [allEdges])

  /* ── Delete selected edges on Delete / Backspace key ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      setAllEdges((eds) => eds.filter((ed) => !ed.selected))
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  /* ── Change handlers ── */
  const onNodesChange = useCallback((c: NodeChange[]) => setAllNodes((n) => applyNodeChanges(c, n)), [])
  const onEdgesChange = useCallback((c: EdgeChange[]) => setAllEdges((e) => applyEdgeChanges(c, e)), [])

  /* ── Reconnect existing edge ── */
  const onReconnectStart = useCallback(() => { edgeReconnectSuccessful.current = false }, [])
  const onReconnect = useCallback((old: Edge, conn: Connection) => {
    edgeReconnectSuccessful.current = true
    setAllEdges((els) => reconnectEdge(old, conn, els))
  }, [])
  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) setAllEdges((els) => els.filter((e) => e.id !== edge.id))
  }, [])

  /* ── Connection validation ── */
  const isValidConnection = useCallback(
    (conn: Edge | Connection) => !!conn.source && !!conn.target && isConnectionValid(conn.source, conn.target),
    [],
  )

  /* ── Connect start: highlight compatible/incompatible targets ── */
  const onConnectStart = useCallback((_: any, params: { nodeId: string | null }) => {
    if (!params.nodeId) return
    const compatible = new Set(getRelatedNodeIds(params.nodeId))
    setAllNodes((nds) =>
      nds.map((n) =>
        n.id === params.nodeId
          ? n
          : { ...n, data: { ...n.data, connectState: compatible.has(n.id) ? 'compatible' : 'incompatible' } },
      ),
    )
  }, [])

  /* ── Connect end: clear highlight ── */
  const onConnectEnd = useCallback(() => {
    setAllNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, connectState: null } })))
  }, [])

  /* ── Create new edge ── */
  const onConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target) return
    const relType = getRelationshipType(conn.source, conn.target)
    const def     = RELATIONSHIP_DEFS[relType] ?? RELATIONSHIP_DEFS.relates
    const isInterop = def.category === 'interoperation'
    const newEdge: Edge = {
      id: `e-${conn.source}-${conn.target}-${Date.now()}`,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle ?? undefined,
      targetHandle: conn.targetHandle ?? undefined,
      label: relType,
      type: 'ontology',
      animated: isInterop,
      style: {
        stroke: def.stroke,
        strokeWidth: def.strokeWidth,
        strokeDasharray: isInterop ? (def.strokeDasharray ?? '5,4') : undefined,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: def.stroke, width: 16, height: 16 },
      reconnectable: true,
      data: { relType, category: def.category },
    }
    setAllEdges((eds) => addEdge(newEdge, eds))
  }, [])

  /* ── Node click ── */
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const related = getRelatedNodeIds(node.id)
    setAllNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
        data: { ...n.data, isRelated: related.includes(n.id), connectState: null },
      })),
    )
    setAllEdges((eds) => eds.map((e) => ({ ...e, selected: false, zIndex: 0 })))
    onSelectItem?.('node', node)
  }, [onSelectItem])

  /* ── Edge click (cycle stacked, also triggers inspector) ── */
  const onEdgeClick = useCallback((_: React.MouseEvent, clicked: Edge) => {
    setAllNodes((nds) => nds.map((n) => ({ ...n, selected: false, data: { ...n.data, isRelated: false } })))
    setTimeout(() => {
      setAllEdges((prev) => {
        const stacked = prev
          .filter((e) => e.source === clicked.source && e.target === clicked.target)
          .sort((a, b) => a.id.localeCompare(b.id))
        if (stacked.length > 1) {
          const cur  = stacked.findIndex((e) => e.id === clicked.id)
          const next = stacked[(cur + 1) % stacked.length]
          return prev.map((e) => ({ ...e, selected: e.id === next.id, zIndex: e.id === next.id ? 1000 : 0 }))
        }
        return prev.map((e) => ({ ...e, selected: e.id === clicked.id, zIndex: e.id === clicked.id ? 1000 : 0 }))
      })
    }, 10)
    onSelectItem?.('edge', clicked)
  }, [onSelectItem])

  /* ── Pane click ── */
  const onPaneClick = useCallback(() => {
    setAllNodes((nds) =>
      nds.map((n) => ({ ...n, selected: false, data: { ...n.data, isRelated: false, connectState: null } })),
    )
    setAllEdges((eds) => eds.map((e) => ({ ...e, selected: false, zIndex: 0 })))
    onSelectItem?.('node', null)
  }, [onSelectItem])

  /* ── Re-layout ── */
  const onLayout = useCallback(() => {
    const { nodes: ln, edges: le } = getLayoutedElements(allNodes, allEdges, 'TB')
    setAllNodes(syncPortStates([...ln], le))
    setAllEdges([...le])
  }, [allNodes, allEdges])

  return (
    <div className="relative w-full h-full bg-background">
      <style>{CSS}</style>

      <ReactFlow
        nodes={allNodes}
        edges={allEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        connectionMode={ConnectionMode.Loose}
        connectionLineComponent={MagneticConnectionLine as any}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} color="hsl(var(--border))" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      <RelationLegend />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={onLayout}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors
            bg-card/90 border border-border text-muted-foreground
            hover:bg-accent hover:text-foreground backdrop-blur shadow-xl"
        >
          <LayoutTemplate size={16} />
          重新排列
        </button>
      </div>
    </div>
  )
}
