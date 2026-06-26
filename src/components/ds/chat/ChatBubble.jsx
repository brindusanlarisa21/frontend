import Avatar from '../core/Avatar';

/**
 * ChatBubble — group chat message. "mine" = brand gradient, right-aligned;
 * "theirs" = white surface, left-aligned with avatar + name.
 */
function ChatBubble({ text, mine = false, author, src, time, showAvatar = true, showName = true, style, ...rest }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', ...style }} {...rest}>
      {!mine && showAvatar ? (
        <Avatar name={author} src={src} size="xs" />
      ) : (
        !mine && <div style={{ width: 24, flex: 'none' }} />
      )}
      <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
        {!mine && showName && author && (
          <span style={{ font: "var(--fw-semibold) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-muted)', margin: '0 0 4px 12px' }}>{author}</span>
        )}
        <div
          style={{
            padding: '9px 13px',
            background: mine ? 'var(--grad-brand)' : 'var(--surface-card)',
            color: mine ? '#fff' : 'var(--text-strong)',
            border: mine ? 'none' : '1px solid var(--border-subtle)',
            boxShadow: mine ? 'var(--glow-brand)' : 'var(--shadow-xs)',
            borderRadius: mine ? '16px 16px 5px 16px' : '16px 16px 16px 5px',
            font: "var(--fw-regular) var(--fs-body)/1.4 'Inter', sans-serif",
            wordBreak: 'break-word',
          }}
        >
          {text}
        </div>
        {time && (
          <span style={{ font: "var(--fw-regular) var(--fs-xs)/1 'Inter', sans-serif", color: 'var(--text-subtle)', margin: mine ? '4px 4px 0 0' : '4px 0 0 12px' }}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

export default ChatBubble;
