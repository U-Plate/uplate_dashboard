import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schoolwideCompetitionsApi } from '../api/schoolwideCompetitions';
import { Button } from '../components/Button';
import { DataTable, type Column } from '../components/DataTable';
import type { SchoolwideCompetition } from '../constants';
import './SchoolwideCompetitions.css';

export function SchoolwideCompetitionsPage() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<SchoolwideCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    schoolwideCompetitionsApi.getAll()
      .then(setCompetitions)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load competitions.'))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<SchoolwideCompetition>[] = [
    {
      header: 'Name',
      accessor: (row) => (
        <div className="schoolwide-list-identity">
          {row.logo ? (
            <img src={row.logo} alt="" />
          ) : (
            <span aria-hidden="true">{row.name.trim().charAt(0).toUpperCase()}</span>
          )}
          <strong>{row.name}</strong>
        </div>
      ),
    },
    { header: 'Prize', accessor: 'prize' },
    { header: 'Join opens', accessor: (row) => new Date(row.joinDate).toLocaleDateString() },
    { header: 'Runs', accessor: (row) => `${new Date(row.startDate).toLocaleDateString()} to ${new Date(row.endDate).toLocaleDateString()}` },
    { header: 'People', accessor: 'participantCount' },
    { header: 'Status', accessor: (row) => row.status === 'waitingForPlayers' ? 'Upcoming' : row.status[0].toUpperCase() + row.status.slice(1) },
  ];

  return (
    <div className="schoolwide-page">
      <header className="schoolwide-header">
        <div>
          <p className="schoolwide-eyebrow">Campus macros</p>
          <h1>Schoolwide competitions</h1>
          <p>Open enrollment, nightly standings, and prize communication in one place.</p>
        </div>
        <Button onClick={() => navigate('/school-competitions/new')}>Create competition</Button>
      </header>

      {error && <div className="schoolwide-alert" role="alert">{error}</div>}
      {loading ? (
        <div className="schoolwide-loading">Loading competitions…</div>
      ) : (
        <DataTable
          columns={columns}
          data={competitions}
          onRowClick={(row) => navigate(`/school-competitions/${row.id}`)}
          emptyMessage="No schoolwide competitions yet. Create one to open enrollment."
        />
      )}
    </div>
  );
}
