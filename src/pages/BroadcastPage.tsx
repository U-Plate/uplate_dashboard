import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { RichTextEditor, htmlToPlainText } from '../components/RichTextEditor';
import { broadcastApi } from '../api/broadcast';
import './BroadcastPage.css';

type Status = 'idle' | 'sending' | 'success';
type Mode = 'all' | 'specific';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseEmails = (raw: string): { valid: string[]; invalid: string[] } => {
  const parts = raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    (EMAIL_RE.test(p) ? valid : invalid).push(p);
  }
  return { valid, invalid };
};

const dedupeAppend = (existing: string[], incoming: string[]): string[] => {
  const seen = new Set(existing.map((e) => e.toLowerCase()));
  const next = [...existing];
  for (const email of incoming) {
    if (!seen.has(email.toLowerCase())) {
      seen.add(email.toLowerCase());
      next.push(email);
    }
  }
  return next;
};

export const BroadcastPage: React.FC = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<Mode>('all');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ subject?: string; message?: string; recipients?: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [sendError, setSendError] = useState<string | null>(null);

  const sending = status === 'sending';
  const recipientCount = recipients.length;

  const commitInput = (raw: string): string[] => {
    const { valid, invalid } = parseEmails(raw);
    let next = recipients;
    if (valid.length) {
      next = dedupeAppend(recipients, valid);
      setRecipients(next);
    }
    setEmailInput(invalid.join(', '));
    setEmailError(invalid.length ? `Not a valid email address: ${invalid.join(', ')}` : null);
    return next;
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((e) => e !== email));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (emailInput.trim()) commitInput(emailInput);
    } else if (e.key === 'Backspace' && emailInput === '' && recipients.length) {
      removeRecipient(recipients[recipients.length - 1]);
    }
  };

  const handleEmailChange = (value: string) => {
    // Commit when a separator is typed or pasted; otherwise keep editing.
    if (/[,;\s]/.test(value)) {
      commitInput(value);
    } else {
      setEmailInput(value);
      if (emailError) setEmailError(null);
    }
  };

  const validate = (finalRecipients: string[]): boolean => {
    const next: { subject?: string; message?: string; recipients?: string } = {};
    if (!subject.trim()) next.subject = 'Subject is required';
    if (!htmlToPlainText(message).trim()) next.message = 'Message is required';
    if (mode === 'specific' && finalRecipients.length === 0) {
      next.recipients = 'Add at least one recipient';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    let finalRecipients = recipients;
    if (mode === 'specific' && emailInput.trim()) {
      const { invalid } = parseEmails(emailInput);
      finalRecipients = commitInput(emailInput);
      if (invalid.length) return; // stop on invalid leftover, error already shown
    }

    if (!validate(finalRecipients)) return;
    setConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    setConfirmOpen(false);
    setStatus('sending');
    setSendError(null);
    try {
      await broadcastApi.send(
        subject.trim(),
        message,
        mode === 'specific' ? recipients : undefined,
      );
      setStatus('success');
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : 'The email could not be sent. Try again.',
      );
      setStatus('idle');
    }
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setMode('all');
    setRecipients([]);
    setEmailInput('');
    setEmailError(null);
    setErrors({});
    setSendError(null);
    setStatus('idle');
  };

  const audienceLabel =
    mode === 'all'
      ? 'all UPlate users'
      : `${recipientCount} ${recipientCount === 1 ? 'recipient' : 'recipients'}`;

  if (status === 'success') {
    return (
      <div className="broadcast">
        <div className="broadcast__result">
          <div className="broadcast__result-icon" aria-hidden="true">&#x2713;</div>
          <h1 className="broadcast__result-title">Email sent</h1>
          <p className="broadcast__result-text">
            &ldquo;{subject.trim()}&rdquo; was sent to {audienceLabel}.
          </p>
          <div className="broadcast__result-actions">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to dashboard
            </Button>
            <Button onClick={resetForm}>Send another</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="broadcast">
      <header className="broadcast__header">
        <p className="broadcast__eyebrow">Broadcast</p>
        <h1 className="broadcast__title">Email users</h1>
        <p className="broadcast__subtitle">
          Compose a message and send it to everyone, or to specific people.
        </p>
      </header>

      <form className="broadcast__form" onSubmit={handleSubmit} noValidate>
        <div
          className="broadcast__modes"
          role="radiogroup"
          aria-label="Recipients"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'all'}
            className={`broadcast__mode${mode === 'all' ? ' broadcast__mode--active' : ''}`}
            onClick={() => setMode('all')}
            disabled={sending}
          >
            All users
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'specific'}
            className={`broadcast__mode${mode === 'specific' ? ' broadcast__mode--active' : ''}`}
            onClick={() => setMode('specific')}
            disabled={sending}
          >
            Specific people
          </button>
        </div>

        {mode === 'all' ? (
          <div className="broadcast__scope" role="note">
            <span className="broadcast__scope-icon" aria-hidden="true">&#x2709;</span>
            <span className="broadcast__scope-text">
              <strong>Sends to every UPlate user.</strong> There is no undo once delivered.
            </span>
          </div>
        ) : (
          <div className="form-field">
            <label className="form-field__label" htmlFor="broadcast-recipients">
              Recipients
              <span className="form-field__required"> *</span>
            </label>
            <div
              className={`broadcast__chips${errors.recipients || emailError ? ' broadcast__chips--error' : ''}`}
              onClick={() => document.getElementById('broadcast-recipients')?.focus()}
            >
              {recipients.map((email) => (
                <span key={email} className="broadcast__chip">
                  {email}
                  <button
                    type="button"
                    className="broadcast__chip-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecipient(email);
                    }}
                    aria-label={`Remove ${email}`}
                    disabled={sending}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                id="broadcast-recipients"
                className="broadcast__chip-input"
                type="text"
                inputMode="email"
                value={emailInput}
                onChange={(e) => handleEmailChange(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                onBlur={() => emailInput.trim() && commitInput(emailInput)}
                placeholder={recipients.length ? 'Add another…' : 'name@example.com'}
                disabled={sending}
                aria-describedby="broadcast-recipients-hint"
              />
            </div>
            {errors.recipients ? (
              <div className="form-field__error">{errors.recipients}</div>
            ) : emailError ? (
              <div className="form-field__error">{emailError}</div>
            ) : (
              <div className="broadcast__hint" id="broadcast-recipients-hint">
                Press Enter or comma to add. {recipientCount} added.
              </div>
            )}
          </div>
        )}

        {sendError && (
          <div className="broadcast__alert" role="alert">
            <span className="broadcast__alert-icon" aria-hidden="true">!</span>
            <span>{sendError}</span>
          </div>
        )}

        <div className="form-field">
          <label className="form-field__label" htmlFor="broadcast-subject">
            Subject
            <span className="form-field__required"> *</span>
          </label>
          <input
            id="broadcast-subject"
            className={`form-field__input${errors.subject ? ' form-field__input--error' : ''}`}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this email about?"
            disabled={sending}
            maxLength={150}
          />
          {errors.subject && <div className="form-field__error">{errors.subject}</div>}
        </div>

        <div className="form-field">
          <label className="form-field__label" id="broadcast-message-label">
            Message
            <span className="form-field__required"> *</span>
          </label>
          <RichTextEditor
            value={message}
            onChange={setMessage}
            disabled={sending}
            error={!!errors.message}
            placeholder="Write the body of the email…"
            ariaLabelledBy="broadcast-message-label"
          />
          {errors.message ? (
            <div className="form-field__error">{errors.message}</div>
          ) : (
            <div className="broadcast__hint">
              Use the toolbar to format — bold, underline, headings, indenting, and links are supported.
            </div>
          )}
        </div>

        <div className="broadcast__actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            {sending ? 'Sending…' : mode === 'all' ? 'Send to all users' : 'Send email'}
          </Button>
        </div>
      </form>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={mode === 'all' ? 'Send to all users?' : 'Send email?'}
        onConfirm={handleConfirmSend}
        confirmText={mode === 'all' ? 'Send to all' : 'Send'}
        confirmVariant="danger"
        cancelText="Cancel"
      >
        <p>
          This sends <strong>&ldquo;{subject.trim()}&rdquo;</strong> to {audienceLabel}.
          This can&rsquo;t be undone.
        </p>
      </Modal>
    </div>
  );
};
