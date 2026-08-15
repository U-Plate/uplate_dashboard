import React, { useMemo, useState } from 'react';
import { InternApplication } from '../constants';
import { useInternApplications } from '../contexts/InternApplicationsContext';
import './InternApplicantsPage.css';

type StatusFilter = 'unreviewed' | 'reviewed' | 'all';

const STATUS_ORDER: { value: StatusFilter; label: string }[] = [
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'all', label: 'All' },
];

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
    className={`applicant-check${checked ? ' applicant-check--on' : ''}`}
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

const ApplicantItem: React.FC<{
  item: InternApplication;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleReviewed: () => void;
}> = ({ item, expanded, onToggleExpand, onToggleReviewed }) => {
  const itemClass = [
    'applicant-item',
    item.reviewed ? 'applicant-item--reviewed' : '',
    expanded ? 'applicant-item--expanded' : '',
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
        className="applicant-item__row"
        onClick={onToggleExpand}
        onKeyDown={handleRowKeyDown}
        aria-expanded={expanded}
        tabIndex={0}
        role="button"
      >
        <div
          className="applicant-item__cell applicant-item__cell--check"
          onClick={(e) => {
            e.stopPropagation();
            onToggleReviewed();
          }}
        >
          <button
            type="button"
            className="applicant-check-btn"
            aria-label={item.reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
            aria-pressed={item.reviewed}
            onClick={(e) => {
              e.stopPropagation();
              onToggleReviewed();
            }}
          >
            <CheckMark checked={item.reviewed} />
          </button>
        </div>
        <div className="applicant-item__cell applicant-item__cell--name">
          <span className="applicant-name">{item.name}</span>
          <span className="applicant-gradyear">Class of {item.gradYear}</span>
        </div>
        <div className="applicant-item__cell applicant-item__cell--email">
          <span className="applicant-email">{item.email}</span>
        </div>
        <div className="applicant-item__cell applicant-item__cell--time">
          <span className="applicant-time" title={formatAbsolute(item.timestampString)}>
            {formatRelative(item.timestampString)}
          </span>
        </div>
        <div className="applicant-item__cell applicant-item__cell--chevron" aria-hidden>
          <Chevron expanded={expanded} />
        </div>
      </div>
      {expanded && (
        <div className="applicant-detail">
          <dl className="applicant-detail__qa">
            <div className="applicant-detail__qa-row">
              <dt>Why should we pick them?</dt>
              <dd>{item.whyThem}</dd>
            </div>
            <div className="applicant-detail__qa-row">
              <dt>What do they want out of this?</dt>
              <dd>{item.whatTheyWant}</dd>
            </div>
            <div className="applicant-detail__qa-row">
              <dt>Why UPlate?</dt>
              <dd>{item.whyUplate}</dd>
            </div>
          </dl>
          <dl className="applicant-detail__meta">
            <div className="applicant-detail__meta-row">
              <dt>From</dt>
              <dd>
                <a
                  className="applicant-detail__mailto"
                  href={`mailto:${item.email}?subject=Re%3A%20UPlate%20Marketing%20Intern%20application`}
                >
                  {item.email}
                </a>
              </dd>
            </div>
            <div className="applicant-detail__meta-row">
              <dt>Age</dt>
              <dd>{item.age}</dd>
            </div>
            <div className="applicant-detail__meta-row">
              <dt>Grad year</dt>
              <dd>{item.gradYear}</dd>
            </div>
            <div className="applicant-detail__meta-row">
              <dt>Applied</dt>
              <dd>{formatAbsolute(item.timestampString)}</dd>
            </div>
            <div className="applicant-detail__meta-row">
              <dt>Status</dt>
              <dd>
                {item.reviewed ? (
                  <span className="applicant-status applicant-status--reviewed">Reviewed</span>
                ) : (
                  <span className="applicant-status applicant-status--open">Unreviewed</span>
                )}
              </dd>
            </div>
          </dl>
          <div className="applicant-detail__actions">
            <button
              type="button"
              className={`applicant-action${item.reviewed ? ' applicant-action--secondary' : ''}`}
              onClick={onToggleReviewed}
            >
              {item.reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export const InternApplicantsPage: React.FC = () => {
  const { applications, loading, toggleReviewed } = useInternApplications();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unreviewed');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    let unreviewed = 0;
    applications.forEach((a) => {
      if (!a.reviewed) unreviewed += 1;
    });
    return {
      total: applications.length,
      unreviewed,
      reviewed: applications.length - unreviewed,
    };
  }, [applications]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...applications].sort((a, b) =>
      b.timestampString.localeCompare(a.timestampString),
    );
    return sorted.filter((a) => {
      if (statusFilter === 'unreviewed' && a.reviewed) return false;
      if (statusFilter === 'reviewed' && !a.reviewed) return false;
      if (q) {
        const hay = `${a.name} ${a.email} ${a.gradYear} ${a.whyThem} ${a.whatTheyWant} ${a.whyUplate}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [applications, statusFilter, search]);

  const hasAnyFilter = statusFilter !== 'unreviewed' || search.trim().length > 0;

  const clearFilters = () => {
    setStatusFilter('unreviewed');
    setSearch('');
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleToggleReviewed = (id: string) => {
    void Promise.resolve(toggleReviewed(id)).catch(() => {
      /* error is logged by context */
    });
  };

  return (
    <div className="applicant-page">
      <header className="applicant-page__header">
        <div className="applicant-page__title-row">
          <p className="applicant-page__eyebrow">Hiring</p>
          <h1 className="applicant-page__title">Marketing Intern Applicants</h1>
        </div>
        <p className="applicant-page__summary">
          <strong>{counts.unreviewed}</strong> unreviewed
          <span aria-hidden> · </span>
          <span>{counts.total} total</span>
        </p>
      </header>

      <section className="applicant-filters" aria-label="Filter applicants">
        <div
          className="applicant-segmented"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_ORDER.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`applicant-segmented__btn${statusFilter === s.value ? ' applicant-segmented__btn--active' : ''}`}
              onClick={() => setStatusFilter(s.value)}
              aria-pressed={statusFilter === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="applicant-search">
          <svg
            className="applicant-search__icon"
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
            className="applicant-search__input"
            type="search"
            placeholder="Search name, email, or answers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search name, email, or answers"
          />
        </div>
      </section>

      <section className="applicant-list-wrap">
        {loading ? (
          <div className="applicant-empty">Loading applicants...</div>
        ) : visible.length === 0 ? (
          <div className="applicant-empty">
            {applications.length === 0 ? (
              <>No applications yet.</>
            ) : (
              <>
                <span>No applicants match these filters.</span>
                {hasAnyFilter && (
                  <button
                    type="button"
                    className="applicant-empty__clear"
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
            <div className="applicant-list-header" aria-hidden>
              <div className="applicant-item__cell applicant-item__cell--check" />
              <div className="applicant-item__cell applicant-item__cell--name">Applicant</div>
              <div className="applicant-item__cell applicant-item__cell--email">Email</div>
              <div className="applicant-item__cell applicant-item__cell--time">Applied</div>
              <div className="applicant-item__cell applicant-item__cell--chevron" />
            </div>
            <ul className="applicant-list" role="list">
              {visible.map((item) => (
                <ApplicantItem
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggleExpand={() => handleToggleExpand(item.id)}
                  onToggleReviewed={() => handleToggleReviewed(item.id)}
                />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};
