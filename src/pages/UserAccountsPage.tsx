import { useState } from 'react';
import { api } from '../api/client';
import { SCHOOL, API_ENVIRONMENT } from '../config';
import { getAdminKey } from '../utils/adminKey';
import { Button } from '../components/Button';
import './RestaurantAccountsPage.css';

type User = { authID: string; username: string; name: string; school: string };
export function UserAccountsPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [target, setTarget] = useState<User | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const path = `/${SCHOOL}/admin/users?key=${encodeURIComponent(getAdminKey())}`;
  async function search(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setTarget(null); setConfirmation('');
    try {
      const result = await api.get<{ users: User[] }>(`${path}&query=${encodeURIComponent(query.trim())}`);
      setUsers(result.users);
      if (!result.users.length) setMessage('No matching user in this database. Try their exact username or Firebase UID.');
    } catch { setMessage('Could not find users. Check your admin key and try again.'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!target) return;
    setBusy(true); setMessage('');
    try {
      await api.post(path, { uid: target.authID, confirmation });
      setUsers(previous => previous.filter(user => user.authID !== target.authID));
      setTarget(null); setConfirmation(''); setMessage('Account deleted from Firebase Authentication and Cloudflare. You can sign up again.');
    } catch { setMessage('Deletion did not complete. The Firebase login may already be deleted. Retry to finish Cloudflare cleanup.'); }
    finally { setBusy(false); }
  }
  return <div className="restaurant-accounts-page">
    <h1>User accounts</h1>
    <p>Find an app user by exact username, email, or Firebase UID.</p>
    <p>Cloudflare database: <strong>{API_ENVIRONMENT}</strong>. Firebase Authentication may be shared between environments; deleting a login affects every app using that Firebase project.</p>
    <form onSubmit={search} className="restaurant-accounts-page__form">
      <label className="restaurant-accounts-page__field">User lookup<input value={query} onChange={event => setQuery(event.target.value)} required disabled={busy} /></label>
      <Button type="submit" disabled={busy || !query.trim()}>Find user</Button>
    </form>
    <p role="status">{message}</p>
    {users.map(user => <div key={user.authID}>
      <h2>{user.name || user.username}</h2><p>@{user.username} · {user.school}</p><p>Firebase UID: <code>{user.authID}</code></p>
      <Button variant="danger" disabled={busy} onClick={() => { setTarget(user); setConfirmation(''); }}>Delete account…</Button>
    </div>)}
    {target && <section aria-label="Confirm account deletion">
      <h2>Permanently delete @{target.username}?</h2>
      <p>This removes their Firebase login, Cloudflare profile, cloud backup, and related account records. Hosted competitions are deleted. This cannot be undone.</p>
      <label className="restaurant-accounts-page__field">Enter Firebase UID to confirm<input value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} autoComplete="off" /></label>
      <div className="restaurant-accounts-page__actions"><Button variant="secondary" disabled={busy} onClick={() => setTarget(null)}>Cancel</Button><Button variant="danger" disabled={busy || confirmation !== target.authID} onClick={remove}>{busy ? 'Deleting…' : 'Delete permanently'}</Button></div>
    </section>}
  </div>;
}
