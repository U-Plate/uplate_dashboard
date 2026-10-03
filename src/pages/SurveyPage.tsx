import React, { useMemo, useState } from 'react';
import { SwitcherSurveyResponse } from '../constants';
import { useSurvey } from '../contexts/SurveyContext';
import { formatAbsolute, formatRelative } from '../utils/formatTime';
import './SurveyPage.css';

type StatusFilter = 'unreviewed' | 'reviewed' | 'all';

const NOT_ANSWERED = 'Not answered';

const HOW_HEARD_ORDER = [
  'Instagram',
  'Friends',
  'Posters',
  'Stickers',
  'Tabling Event',
  'Parents/Facebook',
  'Reddit',
  'UPlate team',
  'Other',
];

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
  <span className={`survey-check${checked ? ' survey-check--on' : ''}`} aria-hidden>
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

const HowHeardPill: React.FC<{ value: string | null }> = ({ value }) => (
  <span className="survey-pill">{value ?? NOT_ANSWERED}</span>
);

const InterviewBadge: React.FC<{ willing: boolean }> = ({ willing }) =>
  willing ? <span className="survey-interview-badge">Up for a chat</span> : null;

const summaryPreview = (item: SwitcherSurveyResponse): string => {
  const text = item.whySwitched || item.likeBest || item.dislike || item.wishFeature;
  return text ?? '—';
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="survey-detail__meta-row">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const AnswerBlock: React.FC<{ question: string; answer: string | null }> = ({
  question,
  answer,
}) =>
  answer ? (
    <div className="survey-detail__answer">
      <p className="survey-detail__question">{question}</p>
      <p className="survey-detail__response">{answer}</p>
    </div>
  ) : null;

const SurveyItem: React.FC<{
  item: SwitcherSurveyResponse;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleReviewed: () => void;
}> = ({ item, expanded, onToggleExpand, onToggleReviewed }) => {
  const itemClass = [
    'survey-item',
    item.reviewed ? 'survey-item--reviewed' : '',
    expanded ? 'survey-item--expanded' : '',
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
        className="survey-item__row"
        onClick={onToggleExpand}
        onKeyDown={handleRowKeyDown}
        aria-expanded={expanded}
        tabIndex={0}
        role="button"
      >
        <div
          className="survey-item__cell survey-item__cell--check"
          onClick={(e) => {
            e.stopPropagation();
            onToggleReviewed();
          }}
        >
          <button
            type="button"
            className="survey-check-btn"
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
        <div className="survey-item__cell survey-item__cell--source">
          <HowHeardPill value={item.howHeard} />
        </div>
        <div className="survey-item__cell survey-item__cell--preview">
          <p className="survey-message-preview">{summaryPreview(item)}</p>
        </div>
        <div className="survey-item__cell survey-item__cell--interview">
          <InterviewBadge willing={item.willingToInterview} />
        </div>
        <div className="survey-item__cell survey-item__cell--time">
          <span className="survey-time" title={formatAbsolute(item.timestampString)}>
            {formatRelative(item.timestampString)}
          </span>
        </div>
        <div className="survey-item__cell survey-item__cell--chevron" aria-hidden>
          <Chevron expanded={expanded} />
        </div>
      </div>
      {expanded && (
        <div className="survey-detail">
          <AnswerBlock
            question="How did they hear about UPlate?"
            answer={
              item.howHeard === 'Other' && item.howHeardOther
                ? `Other — ${item.howHeardOther}`
                : item.howHeard
            }
          />
          <AnswerBlock question="Why did you switch to UPlate?" answer={item.whySwitched} />
          <AnswerBlock question="What do you like best about UPlate?" answer={item.likeBest} />
          <AnswerBlock question="What don't you like about UPlate?" answer={item.dislike} />
          <AnswerBlock
            question="What do you wish UPlate did but doesn't?"
            answer={item.wishFeature}
          />

          <dl className="survey-detail__meta">
            <StatRow
              label="15-min chat"
              value={item.willingToInterview ? 'Willing' : 'Not asked / declined'}
            />
            {item.willingToInterview && item.email && (
              <div className="survey-detail__meta-row">
                <dt>Email</dt>
                <dd>
                  <a className="survey-detail__mailto" href={`mailto:${item.email}`}>
                    {item.email}
                  </a>
                </dd>
              </div>
            )}
            <StatRow
              label="App launches"
              value={item.appLaunches != null ? String(item.appLaunches) : NOT_ANSWERED}
            />
            <StatRow
              label="Macro tracking"
              value={
                item.macroTrackingEnabled == null
                  ? NOT_ANSWERED
                  : item.macroTrackingEnabled
                    ? 'On'
                    : 'Off'
              }
            />
            <StatRow
              label="Food items logged"
              value={
                item.foodItemsLoggedCount != null
                  ? String(item.foodItemsLoggedCount)
                  : NOT_ANSWERED
              }
            />
            <StatRow
              label="Foods rated"
              value={item.foodsRatedCount != null ? String(item.foodsRatedCount) : NOT_ANSWERED}
            />
            <StatRow label="Submitted" value={formatAbsolute(item.timestampString)} />
          </dl>

          <div className="survey-detail__actions">
            <button
              type="button"
              className={`survey-action${item.reviewed ? ' survey-action--secondary' : ''}`}
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

export const SurveyPage: React.FC = () => {
  const { surveys, loading, toggleReviewed } = useSurvey();
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unreviewed');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const bySource: Record<string, number> = {};
    HOW_HEARD_ORDER.forEach((s) => (bySource[s] = 0));
    let unreviewed = 0;
    let willingToInterview = 0;
    surveys.forEach((s) => {
      if (s.howHeard) bySource[s.howHeard] = (bySource[s.howHeard] ?? 0) + 1;
      if (!s.reviewed) unreviewed += 1;
      if (s.willingToInterview) willingToInterview += 1;
    });
    return {
      total: surveys.length,
      unreviewed,
      reviewed: surveys.length - unreviewed,
      willingToInterview,
      bySource,
    };
  }, [surveys]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...surveys].sort((a, b) =>
      b.timestampString.localeCompare(a.timestampString),
    );
    return sorted.filter((s) => {
      if (sourceFilter !== 'All' && s.howHeard !== sourceFilter) return false;
      if (statusFilter === 'unreviewed' && s.reviewed) return false;
      if (statusFilter === 'reviewed' && !s.reviewed) return false;
      if (q) {
        const hay = [
          s.whySwitched,
          s.likeBest,
          s.dislike,
          s.wishFeature,
          s.howHeardOther,
          s.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [surveys, sourceFilter, statusFilter, search]);

  const hasAnyFilter =
    sourceFilter !== 'All' || statusFilter !== 'unreviewed' || search.trim().length > 0;

  const clearFilters = () => {
    setSourceFilter('All');
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
    <div className="survey-page">
      <header className="survey-page__header">
        <div className="survey-page__title-row">
          <p className="survey-page__eyebrow">Operations</p>
          <h1 className="survey-page__title">Survey</h1>
        </div>
        <p className="survey-page__summary">
          <strong>{counts.unreviewed}</strong> unreviewed
          <span aria-hidden> · </span>
          <span>{counts.total} total</span>
          {counts.willingToInterview > 0 && (
            <>
              <span aria-hidden> · </span>
              <span className="survey-summary-interview">
                {counts.willingToInterview} up for a chat
              </span>
            </>
          )}
        </p>
      </header>

      <section className="survey-filters" aria-label="Filter survey responses">
        <div className="survey-filters__chips" role="group" aria-label="Filter by source">
          <button
            type="button"
            className={`survey-chip${sourceFilter === 'All' ? ' survey-chip--active' : ''}`}
            onClick={() => setSourceFilter('All')}
            aria-pressed={sourceFilter === 'All'}
          >
            <span>All</span>
            <span className="survey-chip__count">{counts.total}</span>
          </button>
          {HOW_HEARD_ORDER.map((source) => (
            <button
              key={source}
              type="button"
              className={`survey-chip${sourceFilter === source ? ' survey-chip--active' : ''}`}
              onClick={() => setSourceFilter(source)}
              aria-pressed={sourceFilter === source}
            >
              <span>{source}</span>
              <span className="survey-chip__count">{counts.bySource[source] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="survey-filters__right">
          <div className="survey-segmented" role="group" aria-label="Filter by status">
            {STATUS_ORDER.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`survey-segmented__btn${statusFilter === s.value ? ' survey-segmented__btn--active' : ''}`}
                onClick={() => setStatusFilter(s.value)}
                aria-pressed={statusFilter === s.value}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="survey-search">
            <svg
              className="survey-search__icon"
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
              className="survey-search__input"
              type="search"
              placeholder="Search answers or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search answers or email"
            />
          </div>
        </div>
      </section>

      <section className="survey-list-wrap">
        {loading ? (
          <div className="survey-empty">Loading survey responses...</div>
        ) : visible.length === 0 ? (
          <div className="survey-empty">
            {surveys.length === 0 ? (
              <>No survey responses yet.</>
            ) : (
              <>
                <span>No responses match these filters.</span>
                {hasAnyFilter && (
                  <button type="button" className="survey-empty__clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="survey-list-header" aria-hidden>
              <div className="survey-item__cell survey-item__cell--check" />
              <div className="survey-item__cell survey-item__cell--source">Heard via</div>
              <div className="survey-item__cell survey-item__cell--preview">Response</div>
              <div className="survey-item__cell survey-item__cell--interview" />
              <div className="survey-item__cell survey-item__cell--time">Submitted</div>
              <div className="survey-item__cell survey-item__cell--chevron" />
            </div>
            <ul className="survey-list" role="list">
              {visible.map((item) => (
                <SurveyItem
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
