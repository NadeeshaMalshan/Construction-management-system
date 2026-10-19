import React from 'react';
import { formatDate } from '../services/api';

/**
 * Builds the clean conversation for an inquiry:
 * the opening message followed by all conversation messages.
 * Excludes raw automated assessment text blocks since the dedicated Feasibility Card displays them.
 */
export function buildInquiryThread(inq) {
  if (!inq) return [];
  const initiatedBy = inq.initiatedBy || 'CLIENT';
  const isManagerInitiated = initiatedBy === 'PROJECT_MANAGER' || initiatedBy === 'CLIENT_MANAGER';
  const opening = {
    key: `opening-${inq.id}`,
    senderRole: isManagerInitiated ? 'PROJECT_MANAGER' : 'CLIENT',
    senderName: isManagerInitiated ? 'Project Manager' : (inq.client?.name || 'Client'),
    message: inq.message,
    createdAt: inq.createdAt,
  };
  const messages = Array.isArray(inq.messages) ? inq.messages : [];
  const rest = messages.length > 0
    ? messages.map((m) => ({ ...m, key: `msg-${m.id}` }))
    : (inq.response
      ? [{ key: `legacy-${inq.id}`, senderRole: 'PROJECT_MANAGER', senderName: inq.respondedBy || 'Project Manager', message: inq.response, createdAt: inq.respondedAt }]
      : []);
  const combined = [opening, ...rest];
  const seen = new Set();
  const deduped = [];
  for (const m of combined) {
    if (!m || !m.message) continue;
    // Skip duplicate or automated technical assessment blocks in the chat thread
    if (m.message.includes('TECHNICAL FEASIBILITY ASSESSMENT')) continue;
    const key = `${m.senderRole || ''}:::${m.message.trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(m);
    }
  }
  return deduped;
}

/**
 * Modern chat-style conversation between Client and Project Manager.
 * viewerRole: 'CLIENT' | 'PROJECT_MANAGER'
 */
export default function InquiryThread({ inquiry, viewerRole }) {
  const thread = buildInquiryThread(inquiry);

  if (thread.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.86rem', fontStyle: 'italic' }}>
        No conversation messages yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '0.9rem 0' }}>
      {thread.map((m) => {
        const isManager = m.senderRole === 'PROJECT_MANAGER' || m.senderRole === 'CLIENT_MANAGER';
        const isViewerManager = viewerRole === 'PROJECT_MANAGER';
        const mine = (viewerRole === 'CLIENT' && !isManager) || (isViewerManager && isManager);
        const senderDisplayName = mine
          ? 'You'
          : (isManager ? 'Project Manager' : (m.senderName || inquiry.client?.name || 'Client'));
        const avatarInitial = isManager ? 'PM' : (m.senderName ? m.senderName.charAt(0).toUpperCase() : 'C');

        return (
          <div
            key={m.key}
            style={{
              display: 'flex',
              justifyContent: mine ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            {/* Avatar for other party */}
            {!mine && (
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: isManager ? '#dcfce7' : '#e0f2fe',
                  color: isManager ? '#15803d' : '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  border: `1px solid ${isManager ? '#86efac' : '#bae6fd'}`,
                }}
              >
                {avatarInitial}
              </div>
            )}

            {/* Bubble */}
            <div
              style={{
                maxWidth: '78%',
                minWidth: '160px',
                background: mine
                  ? (isViewerManager ? '#047857' : '#0284c7')
                  : '#f8fafc',
                color: mine ? '#ffffff' : '#0f172a',
                border: mine ? 'none' : '1px solid #e2e8f0',
                borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '0.75rem 1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '0.35rem',
                  borderBottom: mine ? '1px solid rgba(255,255,255,0.2)' : '1px solid #f1f5f9',
                  paddingBottom: '0.25rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: mine ? 'rgba(255,255,255,0.95)' : (isManager ? '#15803d' : '#0369a1'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {senderDisplayName}
                  {!mine && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: isManager ? '#dcfce7' : '#e0f2fe',
                        color: isManager ? '#166534' : '#0284c7',
                      }}
                    >
                      {isManager ? 'PM' : 'Client'}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: mine ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                  }}
                >
                  {m.createdAt ? formatDate(m.createdAt) : ''}
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: mine ? '#ffffff' : '#1e293b',
                }}
              >
                {m.message}
              </p>
            </div>

            {/* Avatar for current user */}
            {mine && (
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: isViewerManager ? '#065f46' : '#0369a1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              >
                You
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
