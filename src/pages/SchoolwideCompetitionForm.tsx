import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { schoolwideCompetitionsApi } from '../api/schoolwideCompetitions';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import './SchoolwideCompetitions.css';

const dayStart = (value: string) => new Date(`${value}T00:00:00`).getTime();
const dayEnd = (value: string) => new Date(`${value}T23:59:59.999`).getTime();
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];
const dateInputValue = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function CompetitionLogoField({
  currentUrl,
  file,
  removed,
  disabled,
  onFile,
  onRemovedChange,
}: {
  currentUrl: string | null;
  file: File | null;
  removed: boolean;
  disabled: boolean;
  onFile: (file: File | null) => void;
  onRemovedChange: (removed: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const stagedPreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!stagedPreview) return;
    return () => URL.revokeObjectURL(stagedPreview);
  }, [stagedPreview]);

  const shown = stagedPreview ?? (removed ? null : currentUrl);

  return (
    <div className="form-field">
      <label className="form-field__label">Competition logo <span className="schoolwide-optional">Optional</span></label>
      <div className="schoolwide-logo-field">
        <div className="schoolwide-logo-field__preview">
          {shown ? <img src={shown} alt="Competition logo preview" /> : <span>No logo</span>}
        </div>
        <div className="schoolwide-logo-field__content">
          <input
            ref={inputRef}
            className="schoolwide-logo-field__input"
            type="file"
            accept={LOGO_TYPES.join(',')}
            disabled={disabled}
            onChange={(event) => {
              const chosen = event.target.files?.[0] ?? null;
              event.target.value = '';
              if (!chosen) return;
              onFile(chosen);
              onRemovedChange(false);
            }}
          />
          <div className="schoolwide-logo-field__actions">
            <Button type="button" variant="secondary" disabled={disabled} onClick={() => inputRef.current?.click()}>
              {shown ? 'Replace logo' : 'Choose logo'}
            </Button>
            {shown && (
              <Button
                type="button"
                variant="danger"
                disabled={disabled}
                onClick={() => {
                  onFile(null);
                  onRemovedChange(Boolean(currentUrl));
                }}
              >
                Remove
              </Button>
            )}
          </div>
          <p>
            {file
              ? `${file.name} will upload when you save.`
              : removed
                ? 'The current logo will be removed when you save.'
                : 'PNG, JPEG, WebP, AVIF or GIF. Maximum 5 MB.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SchoolwideCompetitionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [persistedId, setPersistedId] = useState<string | null>(id ?? null);
  const isEditing = Boolean(persistedId);
  const [name, setName] = useState('');
  const [prize, setPrize] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    schoolwideCompetitionsApi.get(id)
      .then(({ competition }) => {
        if (!active) return;
        setName(competition.name);
        setPrize(competition.prize);
        setJoinDate(dateInputValue(competition.joinDate));
        setStartDate(dateInputValue(competition.startDate));
        setEndDate(dateInputValue(competition.endDate));
        setCurrentLogo(competition.logo ?? null);
        setLoading(false);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Could not load the competition.');
        setLoading(false);
      });
    return () => { active = false; };
  }, [id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !prize.trim() || !joinDate || !startDate || !endDate) {
      setError('Name, prize, join date, start date, and end date are required.');
      return;
    }
    const join = dayStart(joinDate);
    const start = dayStart(startDate);
    const end = dayEnd(endDate);
    if (join > start || start >= end) {
      setError('Join date must be on or before the start date, and end date must come later.');
      return;
    }
    if (logoFile && !LOGO_TYPES.includes(logoFile.type)) {
      setError('Choose a PNG, JPEG, WebP, AVIF or GIF logo.');
      return;
    }
    if (logoFile && logoFile.size > MAX_LOGO_BYTES) {
      setError(`The logo is ${(logoFile.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`);
      return;
    }
    setSaving(true);
    let recordSaved = false;
    try {
      const input = {
        name: name.trim(),
        prize: prize.trim(),
        joinDate: join,
        startDate: start,
        endDate: end,
      };
      const saved = persistedId
        ? await schoolwideCompetitionsApi.update(persistedId, input)
        : await schoolwideCompetitionsApi.create(input);
      recordSaved = true;
      setPersistedId(saved.id);
      if (logoFile) {
        await schoolwideCompetitionsApi.uploadLogo(saved.id, logoFile);
      } else if (logoRemoved && currentLogo) {
        await schoolwideCompetitionsApi.deleteLogo(saved.id);
      }
      navigate(`/school-competitions/${saved.id}`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Could not save the competition.';
      setError(recordSaved ? `The competition was saved, but the logo change failed. ${message}` : message);
      setSaving(false);
    }
  }

  if (loading) return <div className="schoolwide-loading">Loading competition…</div>;

  return (
    <div className="schoolwide-page schoolwide-page--form">
      <header className="schoolwide-header">
        <div>
          <p className="schoolwide-eyebrow">Campus macros</p>
          <h1>{isEditing ? 'Edit schoolwide competition' : 'Create a schoolwide competition'}</h1>
          <p>{isEditing ? 'Update the competition details and enrollment window.' : 'Students can join from the opening date through the final day.'}</p>
        </div>
      </header>
      <form className="schoolwide-form" onSubmit={submit} noValidate>
        <FormField label="Competition name" type="text" value={name} onChange={(value) => setName(String(value))} required />
        <FormField label="Prize" type="textarea" value={prize} onChange={(value) => setPrize(String(value))} required placeholder="What the winner receives" />
        <CompetitionLogoField
          currentUrl={currentLogo}
          file={logoFile}
          removed={logoRemoved}
          disabled={saving}
          onFile={setLogoFile}
          onRemovedChange={setLogoRemoved}
        />
        <div className="schoolwide-date-grid">
          <FormField label="Join date" type="date" value={joinDate} onChange={(value) => setJoinDate(String(value))} required />
          <FormField label="Start date" type="date" value={startDate} onChange={(value) => setStartDate(String(value))} required />
          <FormField label="End date" type="date" value={endDate} onChange={(value) => setEndDate(String(value))} required />
        </div>
        <div className="schoolwide-note">Standings refresh once each day at 9:00 PM campus time. Scores use the same macro scoring as friend competitions.</div>
        {error && <div className="schoolwide-alert" role="alert">{error}</div>}
        <div className="schoolwide-actions">
          <Button type="button" variant="secondary" onClick={() => navigate(persistedId ? `/school-competitions/${persistedId}` : '/school-competitions')} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create competition'}</Button>
        </div>
      </form>
    </div>
  );
}
