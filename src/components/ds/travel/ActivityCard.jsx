import Icon from '../core/Icon';
import VotePill from './VotePill';

/**
 * ActivityCard — a single itinerary item on the day timeline.
 * Time rail on the left, category icon tile, title + place, optional vote pill
 * and cost. Designed to sit inside a vertical timeline (see UI kit).
 */
const CAT = {
  food: { icon: 'utensils', bg: 'var(--amber-50)', fg: 'var(--amber-600)' },
  stay: { icon: 'bed', bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  travel: { icon: 'plane', bg: 'var(--accent-soft)', fg: 'var(--cyan-600)' },
  sight: { icon: 'pin', bg: 'var(--owed-soft)', fg: 'var(--green-600)' },
  fun: { icon: 'ticket', bg: '#F3E8FF', fg: 'var(--violet-600)' },
  transit: { icon: 'car', bg: 'var(--slate-100)', fg: 'var(--slate-600)' },
};

function ActivityCard({ time, title, place, category = 'sight', cost, votes, voted, onVote, proposed = false, onClick, style, ...rest }) {
  const c = CAT[category] || CAT.sight;
  return (
    <div style={{ display: 'flex', gap: 12, ...style }} {...rest}>
      {time && (
        <div style={{ width: 52, flex: 'none', textAlign: 'right', paddingTop: 14 }}>
          <div style={{ font: "var(--fw-bold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-strong)', fontVariantNumeric: 'tabular-nums' }}>{time}</div>
        </div>
      )}
      <div
        onClick={onClick}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          background: 'var(--surface-card)',
          border: `1px solid ${proposed ? 'var(--border-default)' : 'var(--border-subtle)'}`,
          borderStyle: proposed ? 'dashed' : 'solid',
          borderRadius: 'var(--r-lg)',
          boxShadow: proposed ? 'none' : 'var(--shadow-xs)',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <div style={{ width: 40, height: 40, flex: 'none', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg, color: c.fg }}>
          <Icon name={c.icon} size={20} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: "var(--fw-semibold) var(--fs-title)/1.2 'Inter', sans-serif", color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
          {place && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, color: 'var(--text-muted)' }}>
              <Icon name="pin" size={12} strokeWidth={2} />
              <span style={{ font: "var(--fw-regular) var(--fs-sm)/1 'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place}</span>
            </div>
          )}
        </div>
        {typeof votes === 'number' ? (
          <VotePill count={votes} voted={voted} onClick={onVote} />
        ) : (
          cost && <span style={{ font: "var(--fw-bold) var(--fs-sm)/1 'Inter', sans-serif", color: 'var(--text-body)', fontVariantNumeric: 'tabular-nums' }}>{cost}</span>
        )}
      </div>
    </div>
  );
}

export default ActivityCard;
