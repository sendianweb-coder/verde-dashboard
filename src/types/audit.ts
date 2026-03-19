export interface AuditLogEntry {
  id: string
  actorId: string
  action: string
  entity: string
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: string
}
