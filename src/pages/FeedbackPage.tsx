import React, { useMemo, useState } from 'react';
import { Feedback, FeedbackType } from '../constants';
import { useFeedback } from '../contexts/FeedbackContext';
import './FeedbackPage.css';

type StatusFilter = 'unhandled' | 'handled' | 'all';
type TypeFilter = FeedbackType | 'All';

const TYPE_ORDER: FeedbackType[] = [
  FeedbackType.Bug,
  FeedbackType.Suggestion,
  FeedbackType.Question,
  FeedbackType.Compliment,
  FeedbackType.Other,
];

const STATUS_ORDER: { value: StatusFilter; label: string }[] = [
  { value: 'unhandled', label: 'Unhandled' },
  { value: 'handled', label: 'Handled' },
  { value: 'all', label: 'All' },
];

const TypeIcon: React.FC<{ type: FeedbackType }> = ({ type }) => {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (type) {
    case FeedbackType.Bug:
      return (
        <svg {...common}>
          <path d="M8 2l1.5 1.5M16 2l-1.5 1.5" />
          <rect x="6" y="6" width="12" height="12" rx="6" />
          <path d="M12 18v3M4 11h2M18 11h2M5 7l2 1.5M19 7l-2 1.5M5 16l2-1M19 16l-2-1" />
        </svg>
      );
    case FeedbackType.Suggestion:
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z" />
        </svg>
      );
    case FeedbackType.Question:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
        </svg>
      );
    case FeedbackType.Compliment:
      return (
        <svg {...common}>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    case FeedbackType.Other:
    default:
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
  }
};

const Chevron: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 180ms ease',
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CheckMark: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span
    className={`feedback-check${checked ? ' feedback-check--on' : ''}`}
    aria-hidden
  >
    {checked && (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </span>
);

const TypePill: React.FC<{ type: FeedbackType }> = ({ type }) => (
  <span className={`feedback-pill feedback-pill--${type.toLowerCase()}`}>
    <TypeIcon type={type} />
    <span>{type}</span>
  </span>
);

const formatRelative = (iso: string): string => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const diffMs = Date.now() - t;
  const minutes = Math.round(diffMs / 60_000);
  const hours = Math.round(diffMs / 3_600_000);
  const days = Math.round(diffMs / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatAbsolute = (iso: string): string => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const FeedbackItem: React.FC<{
  item: Feedback;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleHandled: () => void;
}> = ({ item, expanded, onToggleExpand, onToggleHandled }) => {
  const itemClass = [
    'feedback-item',
    item.handled ? 'feedback-item--handled' : '',
    expanded ? 'feedback-item--expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleExpand();
    }
  };

  return (
    <li className={itemClass}>
      <div
        className="feedback-item__row"
        onClick={onToggleExpand}
        onKeyDown={handleRowKeyDown}
        aria-expanded={expanded}
        tabIndex={0}
        role="button"
      >
        <div
          className="feedback-item__cell feedback-item__cell--check"
          onClick={(e) => {
            e.stopPropagation();
            onToggleHandled();
          }}
        >
          <button
            type="button"
            className="feedback-check-btn"
            aria-label={item.handled ? 'Mark as unhandled' : 'Mark as handled'}
            aria-pressed={item.handled}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHandled();
            }}
          >
            <CheckMark checked={item.handled} />
          </button>
        </div>
        <div className="feedback-item__cell feedback-item__cell--type">
          <TypePill type={item.type} />
        </div>
        <div className="feedback-item__cell feedback-item__cell--message">
          <p className="feedback-message-preview">{item.message}</p>
        </div>
        <div className="feedback-item__cell feedback-item__cell--email">
          <span className="feedback-email">{item.email}</span>
        </div>
        <div className="feedback-item__cell feedback-item__cell--time">
          <span className="feedback-time" title={formatAbsolute(item.timestampString)}>
            {formatRelative(item.timestampString)}
          </span>
        </div>
        <div className="feedback-item__cell feedback-item__cell--chevron" aria-hidden>
          <Chevron expanded={expanded} />
        </div>
      </div>
      {expanded && (
        <div className="feedback-detail">
          <div className="feedback-detail__message">{item.message}</div>
          <dl className="feedback-detail__meta">
            <div className="feedback-detail__meta-row">
              <dt>From</dt>
              <dd>
                <a
                  className="feedback-detail__mailto"
                  href={`mailto:${item.email}?subject=Re%3A%20UPlate%20${encodeURIComponent(item.type)}%20feedback`}
                >
                  {item.email}
                </a>
              </dd>
            </div>
            <div className="feedback-detail__meta-row">
              <dt>Type</dt>
              <dd>
                <TypePill type={item.type} />
              </dd>
            </div>
            <div className="feedback-detail__meta-row">
              <dt>Received</dt>
              <dd>{formatAbsolute(item.timestampString)}</dd>
            </div>
            <div className="feedback-detail__meta-row">
              <dt>Status</dt>
              <dd>
                {item.handled ? (
                  <span className="feedback-status feedback-status--handled">Handled</span>
                ) : (
                  <span className="feedback-status feedback-status--open">Open</span>
                )}
              </dd>
            </div>
          </dl>
          <div className="feedback-detail__actions">
            <button
              type="button"
              className={`feedback-action${item.handled ? ' feedback-action--secondary' : ''}`}
              onClick={onToggleHandled}
            >
              {item.handled ? 'Mark as unhandled' : 'Mark as handled'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export const FeedbackPage: React.FC = () => {
  const { feedback, loading, toggleHandled } = useFeedback();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unhandled');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    TYPE_ORDER.forEach((t) => (byType[t] = 0));
    let unhandled = 0;
    feedback.forEach((f) => {
      byType[f.type] = (byType[f.type] ?? 0) + 1;
      if (!f.handled) unhandled += 1;
    });
    return {
      total: feedback.length,
      unhandled,
      handled: feedback.length - unhandled,
      byType,
    };
  }, [feedback]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...feedback].sort((a, b) =>
      b.timestampString.localeCompare(a.timestampString),
    );
    return sorted.filter((f) => {
      if (typeFilter !== 'All' && f.type !== typeFilter) return false;
      if (statusFilter === 'unhandled' && f.handled) return false;
      if (statusFilter === 'handled' && !f.handled) return false;
      if (q) {
        const hay = `${f.message} ${f.email}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [feedback, typeFilter, statusFilter, search]);

  const hasAnyFilter =
    typeFilter !== 'All' || statusFilter !== 'unhandled' || search.trim().length > 0;

  const clearFilters = () => {
    setTypeFilter('All');
    setStatusFilter('unhandled');
    setSearch('');
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleToggleHandled = (id: string) => {
    void Promise.resolve(toggleHandled(id)).catch(() => {
      /* error is logged by context */
    });
  };

  return (
    <div className="feedback-page">
      <header className="feedback-page__header">
        <div className="feedback-page__title-row">
          <p className="feedback-page__eyebrow">Operations</p>
          <h1 className="feedback-page__title">Feedback</h1>
        </div>
        <p className="feedback-page__summary">
          <strong>{counts.unhandled}</strong> unhandled
          <span aria-hidden> · </span>
          <span>{counts.total} total</span>
          {counts.byType[FeedbackType.Bug] > 0 && (
            <>
              <span aria-hidden> · </span>
              <span className="feedback-summary-bugs">
                {counts.byType[FeedbackType.Bug]} {counts.byType[FeedbackType.Bug] === 1 ? 'bug' : 'bugs'}
              </span>
            </>
          )}
        </p>
      </header>

      <section className="feedback-filters" aria-label="Filter feedback">
        <div className="feedback-filters__chips" role="group" aria-label="Filter by type">
          <button
            type="button"
            className={`feedback-chip${typeFilter === 'All' ? ' feedback-chip--active' : ''}`}
            onClick={() => setTypeFilter('All')}
            aria-pressed={typeFilter === 'All'}
          >
            <span>All</span>
            <span className="feedback-chip__count">{counts.total}</span>
          </button>
          {TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              className={`feedback-chip feedback-chip--${t.toLowerCase()}${typeFilter === t ? ' feedback-chip--active' : ''}`}
              onClick={() => setTypeFilter(t)}
              aria-pressed={typeFilter === t}
            >
              <TypeIcon type={t} />
              <span>{t}</span>
              <span className="feedback-chip__count">{counts.byType[t] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="feedback-filters__right">
          <div
            className="feedback-segmented"
            role="group"
            aria-label="Filter by status"
          >
            {STATUS_ORDER.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`feedback-segmented__btn${statusFilter === s.value ? ' feedback-segmented__btn--active' : ''}`}
                onClick={() => setStatusFilter(s.value)}
                aria-pressed={statusFilter === s.value}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="feedback-search">
            <svg
              className="feedback-search__icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              className="feedback-search__input"
              type="search"
              placeholder="Search messages or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search messages or email"
            />
          </div>
        </div>
      </section>

      <section className="feedback-list-wrap">
        {loading ? (
          <div className="feedback-empty">Loading feedback...</div>
        ) : visible.length === 0 ? (
          <div className="feedback-empty">
            {feedback.length === 0 ? (
              <>No feedback received yet.</>
            ) : (
              <>
                <span>No feedback matches these filters.</span>
                {hasAnyFilter && (
                  <button
                    type="button"
                    className="feedback-empty__clear"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="feedback-list-header" aria-hidden>
              <div className="feedback-item__cell feedback-item__cell--check" />
              <div className="feedback-item__cell feedback-item__cell--type">Type</div>
              <div className="feedback-item__cell feedback-item__cell--message">Message</div>
              <div className="feedback-item__cell feedback-item__cell--email">From</div>
              <div className="feedback-item__cell feedback-item__cell--time">Received</div>
              <div className="feedback-item__cell feedback-item__cell--chevron" />
            </div>
            <ul className="feedback-list" role="list">
              {visible.map((item) => (
                <FeedbackItem
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggleExpand={() => handleToggleExpand(item.id)}
                  onToggleHandled={() => handleToggleHandled(item.id)}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};
