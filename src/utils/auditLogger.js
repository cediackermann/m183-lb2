/**
 * T-07: Security audit logger
 * Logs security-relevant events with actor, target, and timestamp.
 */
export function auditLog(event, actorId, detail) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    actor: actorId ?? 'anonymous',
    detail: detail ?? '',
  };
  console.log('[AUDIT]', JSON.stringify(entry));
}
