import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { schoolwideCompetitionsApi } from '../api/schoolwideCompetitions';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import { FormField } from '../components/FormField';
import type { SchoolwideCompetition, SchoolwideCompetitionParticipant } from '../constants';
import './SchoolwideCompetitions.css';

const joinedFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const statusLabel: Record<SchoolwideCompetition['status'], string> = {
  waitingForPlayers: 'Upcoming',
  active: 'Active',
  completed: 'Completed',
};

export function SchoolwideCompetitionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<SchoolwideCompetition | null>(null);
  const [participants, setParticipants] = useState<SchoolwideCompetitionParticipant[]>([]);
  const [selected, setSelected] = useState<SchoolwideCompetitionParticipant | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [emailAttempt, setEmailAttempt] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    schoolwideCompetitionsApi.get(id)
      .then((response) => {
        setCompetition(response.competition);
        setParticipants(response.participants.sort((a, b) => b.score - a.score));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load the competition.'));
  }, [id]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    schoolwideCompetitionsApi.getEmail(id, selected.username)
      .then(response => {
        if (cancelled) return;
        setEmail(response.email);
        setEmailStatus('loaded');
      })
      .catch(() => { if (!cancelled) setEmailStatus('error'); });
    return () => { cancelled = true; };
  }, [id, selected, emailAttempt]);

  async function notify(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !title.trim() || !message.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      await schoolwideCompetitionsApi.notify(id, selected.username, title.trim(), message.trim());
      setStatus('sent');
      setTitle('');
      setMessage('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Notification could not be sent.');
      setStatus('idle');
    }
  }

  const columns: Column<SchoolwideCompetitionParticipant>[] = [
    {
      header: 'Participant',
      accessor: (row) => (
        <div className="schoolwide-participant">
          <strong>{row.name}</strong>
          <div className="schoolwide-handle">
            @{row.username}
            {row.anonymous && <span className="schoolwide-privacy-label">Anonymous publicly</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Days logged',
      accessor: (row) => <strong className="schoolwide-data-value">{row.daysLogged.toLocaleString()}</strong>,
    },
    { header: 'Joined', accessor: (row) => row.joinedAt ? joinedFormatter.format(new Date(row.joinedAt)) : 'Unknown' },
    { header: 'Score', accessor: (row) => <strong className="schoolwide-data-value">{row.score.toFixed(0)}</strong> },
  ];

  if (!competition && !error) {
    return (
      <div className="schoolwide-page" aria-label="Loading competition">
        <div className="schoolwide-detail-skeleton schoolwide-detail-skeleton--back" />
        <div className="schoolwide-detail-skeleton schoolwide-detail-skeleton--hero" />
        <div className="schoolwide-detail-skeleton schoolwide-detail-skeleton--table" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="schoolwide-page">
        <button className="schoolwide-back-link" type="button" onClick={() => navigate('/school-competitions')}>
          <span aria-hidden="true">←</span> Schoolwide competitions
        </button>
        <div className="schoolwide-alert" role="alert">{error}</div>
      </div>
    );
  }

  const loggingParticipants = participants.filter((participant) => participant.daysLogged > 0).length;
  const competitionWindow = `${dateFormatter.format(new Date(competition.startDate))} – ${dateFormatter.format(new Date(competition.endDate))}`;

  return (
    <article className="schoolwide-page schoolwide-page--detail">
      <button className="schoolwide-back-link" type="button" onClick={() => navigate('/school-competitions')}>
        <span aria-hidden="true">←</span> Schoolwide competitions
      </button>

      <header className="schoolwide-competition-hero">
        <div className="schoolwide-competition-hero__topline">
          <span className={`schoolwide-status schoolwide-status--${competition.status}`}>
            <span className="schoolwide-status__dot" aria-hidden="true" />
            {statusLabel[competition.status]}
          </span>
          <Button variant="secondary" onClick={() => navigate(`/school-competitions/${id}/edit`)}>Edit competition</Button>
        </div>
        <div className="schoolwide-competition-identity">
          {competition.logo && (
            <img
              className="schoolwide-competition-identity__logo"
              src={competition.logo}
              alt={`${competition.name} logo`}
            />
          )}
          <div className="schoolwide-competition-hero__heading">
            <p className="schoolwide-eyebrow">Campus macro competition</p>
            <h1>{competition.name}</h1>
            <p className="schoolwide-competition-hero__prize"><span>Prize</span>{competition.prize}</p>
          </div>
        </div>
        <dl className="schoolwide-overview">
          <div>
            <dt>Competition window</dt>
            <dd>{competitionWindow}</dd>
          </div>
          <div>
            <dt>Enrollment opened</dt>
            <dd>{dateFormatter.format(new Date(competition.joinDate))}</dd>
          </div>
          <div>
            <dt>Participants</dt>
            <dd>{competition.participantCount.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Logging meals</dt>
            <dd>{loggingParticipants.toLocaleString()} <small>of {competition.participantCount.toLocaleString()}</small></dd>
          </div>
          <div>
            <dt>Standings updated</dt>
            <dd>{competition.leaderboardUpdatedAt ? joinedFormatter.format(new Date(competition.leaderboardUpdatedAt)) : 'Not yet'}</dd>
          </div>
        </dl>
      </header>

      <section className="schoolwide-participants-panel" aria-labelledby="participants-heading">
        <div className="schoolwide-section-heading">
          <div>
            <p className="schoolwide-eyebrow">Roster</p>
            <h2 id="participants-heading">Participants</h2>
            <p>Select a participant to review their activity or send a device notification.</p>
          </div>
          <span className="schoolwide-section-count">{participants.length.toLocaleString()} total</span>
        </div>
        <DataTable
          columns={columns}
          data={participants}
          onRowClick={(row) => { setSelected(row); setStatus('idle'); setEmail(null); setEmailStatus('loading'); }}
          actions={(row) => (
            <Button
              variant="secondary"
              onClick={() => { setSelected(row); setStatus('idle'); setEmail(null); setEmailStatus('loading'); }}
            >
              Notify
            </Button>
          )}
          emptyMessage="No one has joined this competition yet."
        />
      </section>

      {selected && (
        <section className="schoolwide-contact" aria-live="polite" aria-labelledby="selected-participant-heading">
          <aside className="schoolwide-contact__person">
            <div className="schoolwide-contact__heading">
              <div className="schoolwide-contact__avatar" aria-hidden="true">
                {selected.name.trim().charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="schoolwide-eyebrow">Selected participant</p>
                <h2 id="selected-participant-heading">{selected.name}</h2>
                <span>@{selected.username}</span>
              </div>
            </div>
            <dl className="schoolwide-contact__facts">
              <div>
                <dt>Email</dt>
                <dd>
                  {emailStatus === 'loading' ? 'Looking up email…' : emailStatus === 'error' ? (
                    <><span>Email lookup failed. </span><button type="button" className="schoolwide-text-button" onClick={() => { setEmailStatus('loading'); setEmailAttempt(value => value + 1); }}>Retry</button></>
                  ) : email ? <a href={`mailto:${email}`}>{email}</a> : 'No email on this account'}
                </dd>
              </div>
              <div>
                <dt>Joined</dt>
                <dd>{selected.joinedAt ? joinedFormatter.format(new Date(selected.joinedAt)) : 'Unknown'}</dd>
              </div>
              <div>
                <dt>Meal logging</dt>
                <dd>{selected.daysLogged} {selected.daysLogged === 1 ? 'day' : 'days'}</dd>
              </div>
              <div>
                <dt>Leaderboard identity</dt>
                <dd>{selected.anonymous ? 'Anonymous' : 'Public'}</dd>
              </div>
            </dl>
          </aside>
          <form className="schoolwide-notify" onSubmit={notify}>
            <div>
              <p className="schoolwide-eyebrow">Direct notification</p>
              <h2>Message {selected.name}</h2>
              <p>Send competition or prize information to this participant’s device.</p>
            </div>
            <FormField label="Notification title" type="text" value={title} onChange={(value) => { setTitle(String(value)); setStatus('idle'); }} required />
            <FormField label="Message" type="textarea" value={message} onChange={(value) => { setMessage(String(value)); setStatus('idle'); }} required />
            {status === 'sent' && <div className="schoolwide-success">Notification sent to {selected.name}.</div>}
            <div className="schoolwide-notify__actions">
              <button className="schoolwide-text-button" type="button" onClick={() => setSelected(null)}>Close</button>
              <Button type="submit" disabled={status === 'sending' || !title.trim() || !message.trim()}>{status === 'sending' ? 'Sending…' : 'Send notification'}</Button>
            </div>
          </form>
        </section>
      )}
      {error && <div className="schoolwide-alert" role="alert">{error}</div>}
    </article>
  );
}
