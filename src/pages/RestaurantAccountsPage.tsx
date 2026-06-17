import React, { useCallback, useEffect, useState } from 'react';
import type { Column } from '../components/DataTable';
import { DataTable } from '../components/DataTable';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { SCHOOL } from '../config';
import {
  dashboardAccountsApi,
  type DashRestaurantAccount,
  type DashAccessCode,
} from '../api/dashboardAccounts';
import './RestaurantAccountsPage.css';

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' } as any) : '—';

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : '—';

export const RestaurantAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<DashRestaurantAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create-account modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Disable/enable confirm modal
  const [statusTarget, setStatusTarget] = useState<DashRestaurantAccount | null>(null);

  // Access-codes modal
  const [codesAccount, setCodesAccount] = useState<DashRestaurantAccount | null>(null);
  const [codes, setCodes] = useState<DashAccessCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesError, setCodesError] = useState<string | null>(null);
  const [codesBusy, setCodesBusy] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await dashboardAccountsApi.listRestaurants(SCHOOL));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await dashboardAccountsApi.createRestaurant({
        schoolId: SCHOOL,
        name: newName.trim() || undefined,
        contactEmail: newEmail.trim() || undefined,
      });
      setCreateOpen(false);
      setNewName('');
      setNewEmail('');
      await loadAccounts();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmStatus = async () => {
    if (!statusTarget) return;
    const disable = !statusTarget.disabledAt;
    try {
      const { disabledAt } = await dashboardAccountsApi.setStatus(statusTarget.id, disable);
      setAccounts((prev) =>
        prev.map((a) => (a.id === statusTarget.id ? { ...a, disabledAt } : a)),
      );
      setStatusTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update account');
    }
  };

  const openCodes = async (account: DashRestaurantAccount) => {
    setCodesAccount(account);
    setCodes([]);
    setCodesError(null);
    setCodesLoading(true);
    try {
      setCodes(await dashboardAccountsApi.listAccessCodes(account.id));
    } catch (e) {
      setCodesError(e instanceof Error ? e.message : 'Failed to load codes');
    } finally {
      setCodesLoading(false);
    }
  };

  const reloadCodes = async (accountId: string) => {
    setCodes(await dashboardAccountsApi.listAccessCodes(accountId));
  };

  const handleMintCode = async () => {
    if (!codesAccount) return;
    setCodesBusy(true);
    try {
      await dashboardAccountsApi.createAccessCode(codesAccount.id);
      await reloadCodes(codesAccount.id);
      await loadAccounts(); // refresh code counts on the table
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to mint code');
    } finally {
      setCodesBusy(false);
    }
  };

  const handleRevokeCode = async (code: string) => {
    if (!codesAccount) return;
    setCodesBusy(true);
    try {
      await dashboardAccountsApi.revokeAccessCode(code);
      await reloadCodes(codesAccount.id);
      await loadAccounts();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to revoke code');
    } finally {
      setCodesBusy(false);
    }
  };

  const columns: Column<DashRestaurantAccount>[] = [
    {
      header: 'Name',
      accessor: (row) => row.name || <span className="ra-muted">Unnamed</span>,
    },
    {
      header: 'Contact',
      accessor: (row) => row.contactEmail || <span className="ra-muted">—</span>,
    },
    {
      header: 'Status',
      accessor: (row) =>
        row.disabledAt ? (
          <span className="ra-badge ra-badge--disabled">Disabled</span>
        ) : (
          <span className="ra-badge ra-badge--active">Active</span>
        ),
    },
    {
      header: 'Activated',
      accessor: (row) =>
        row.activated ? (
          <span className="ra-activated">
            <span className="ra-badge ra-badge--activated">Yes</span>
            <span className="ra-activated__date">{fmtDate(row.activatedAt)}</span>
          </span>
        ) : (
          <span className="ra-muted">Not yet</span>
        ),
    },
    {
      header: 'Codes',
      accessor: (row) => (
        <span title={`${row.activeCodeCount} active of ${row.codeCount} total`}>
          {row.activeCodeCount} / {row.codeCount}
        </span>
      ),
    },
  ];

  return (
    <div className="restaurant-accounts-page">
      <div className="restaurant-accounts-page__header">
        <div className="restaurant-accounts-page__heading">
          <p className="restaurant-accounts-page__eyebrow">Manage</p>
          <h1 className="restaurant-accounts-page__title">Restaurant Accounts</h1>
          <p className="restaurant-accounts-page__subtitle">
            Create dashboard accounts, issue access codes, and track when restaurants activate.
          </p>
        </div>
        <div className="restaurant-accounts-page__header-actions">
          <Button onClick={() => setCreateOpen(true)}>+ New Account</Button>
        </div>
      </div>

      {error && <div className="restaurant-accounts-page__error">{error}</div>}

      {loading ? (
        <div className="restaurant-accounts-page__empty">Loading accounts…</div>
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          actions={(row) => (
            <div className="restaurant-accounts-page__actions">
              <Button onClick={() => openCodes(row)}>Codes</Button>
              <Button
                variant={row.disabledAt ? 'secondary' : 'danger'}
                onClick={() => setStatusTarget(row)}
              >
                {row.disabledAt ? 'Enable' : 'Disable'}
              </Button>
            </div>
          )}
          emptyMessage="No accounts yet. Create your first account to get started."
        />
      )}

      {/* Create account */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Restaurant Account"
        onConfirm={saving ? undefined : handleCreate}
        confirmText={saving ? 'Creating…' : 'Create'}
      >
        <div className="restaurant-accounts-page__form">
          <label className="restaurant-accounts-page__field">
            <span>Name</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Greyhouse Coffee"
            />
          </label>
          <label className="restaurant-accounts-page__field">
            <span>Contact email</span>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </label>
          <p className="ra-muted">
            School: <strong>{SCHOOL}</strong>. After creating, open “Codes” to issue an access
            code for the restaurant to sign up with.
          </p>
        </div>
      </Modal>

      {/* Disable / enable confirm */}
      <Modal
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.disabledAt ? 'Enable Account' : 'Disable Account'}
        onConfirm={handleConfirmStatus}
        confirmText={statusTarget?.disabledAt ? 'Enable' : 'Disable'}
        confirmVariant={statusTarget?.disabledAt ? 'primary' : 'danger'}
      >
        {statusTarget && (
          <p>
            {statusTarget.disabledAt ? (
              <>
                Re-enable <strong>{statusTarget.name || 'this account'}</strong>? Its users will be
                able to sign in again.
              </>
            ) : (
              <>
                Disable <strong>{statusTarget.name || 'this account'}</strong>? Its users will be
                blocked from signing in until re-enabled.
              </>
            )}
          </p>
        )}
      </Modal>

      {/* Access codes */}
      <Modal
        isOpen={!!codesAccount}
        onClose={() => setCodesAccount(null)}
        title={`Access Codes — ${codesAccount?.name || 'Account'}`}
      >
        <div className="restaurant-accounts-page__codes">
          <div className="restaurant-accounts-page__codes-bar">
            <span className="ra-muted">
              Single-use codes a restaurant enters to sign up.
            </span>
            <Button disabled={codesBusy} onClick={handleMintCode}>
              {codesBusy ? 'Working…' : '+ Mint code'}
            </Button>
          </div>

          {codesError && <div className="restaurant-accounts-page__error">{codesError}</div>}

          {codesLoading ? (
            <div className="restaurant-accounts-page__empty">Loading codes…</div>
          ) : codes.length === 0 ? (
            <div className="restaurant-accounts-page__empty">
              No codes yet. Mint one to invite a restaurant.
            </div>
          ) : (
            <table className="restaurant-accounts-page__codes-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Activated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <code
                        className="ra-code"
                        title="Click to copy"
                        onClick={() => navigator.clipboard?.writeText(c.code)}
                      >
                        {c.code}
                      </code>
                    </td>
                    <td>
                      <span className={`ra-badge ra-badge--${c.status}`}>{c.status}</span>
                    </td>
                    <td>{fmtDate(c.createdAt)}</td>
                    <td>{fmtDateTime(c.consumedAt)}</td>
                    <td>
                      {c.status === 'active' && (
                        <Button
                          variant="danger"
                          disabled={codesBusy}
                          onClick={() => handleRevokeCode(c.code)}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </div>
  );
};
