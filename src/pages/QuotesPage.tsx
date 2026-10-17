import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DURATION_LABELS, listTestimonials, type Testimonial } from '../api/testimonials';
import './QuotesPage.css';

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('all');
  const [consent, setConsent] = useState('all');
  const [duration, setDuration] = useState('all');
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError('');
    try {
      const rows = await listTestimonials(current.signal);
      if (!current.signal.aborted) setQuotes(rows);
    } catch (failure) {
      if (!current.signal.aborted) setError(failure instanceof Error ? failure.message : 'Could not load quotes.');
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => controller.current?.abort();
  }, [refresh]);

  const visible = useMemo(() => quotes.filter((quote) =>
    (rating === 'all' || quote.rating === Number(rating)) &&
    (duration === 'all' || quote.duration === duration) &&
    (consent === 'all' || quote.publishConsent === (consent === 'yes')) &&
    `${quote.name} ${quote.testimony}`.toLowerCase().includes(search.trim().toLowerCase()),
  ), [quotes, rating, consent, duration, search]);
  const average = quotes.length
    ? (quotes.reduce((sum, quote) => sum + quote.rating, 0) / quotes.length).toFixed(1)
    : null;

  return (
    <div className="quotes-page">
      <header className="quotes-header">
        <div><p className="quotes-eyebrow">Student voices</p><h1>Quotes</h1>
          <p>Ratings and testimonials from <a href="https://quotes.u-plate.com" target="_blank" rel="noreferrer">quotes.u-plate.com ↗</a></p>
        </div>
        <button type="button" className="quotes-button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>
      {!loading && !error && <p className="quotes-summary" aria-live="polite">
        <strong>{quotes.length}</strong> responses · Average rating: <strong>{average ? `${average} / 5` : 'No ratings yet'}</strong> · <strong>{quotes.filter((quote) => quote.publishConsent).length}</strong> approved for sharing
      </p>}
      <section className="quotes-filters" aria-label="Filter quotes">
        <label>Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or testimonial" /></label>
        <label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="all">All ratings</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? 'star' : 'stars'}</option>)}</select></label>
        <label>Time using UPlate<select value={duration} onChange={(event) => setDuration(event.target.value)}><option value="all">All durations</option>{Object.entries(DURATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Sharing permission<select value={consent} onChange={(event) => setConsent(event.target.value)}><option value="all">All responses</option><option value="yes">Approved for sharing</option><option value="no">Team only</option></select></label>
      </section>
      {error ? <div className="quotes-empty" role="alert"><p>{error}</p><button className="quotes-button" onClick={() => void refresh()}>Try again</button></div>
        : loading ? <div className="quotes-skeleton" role="status" aria-label="Loading quotes"><div /><div /><div /></div>
        : !visible.length ? <div className="quotes-empty">{quotes.length ? 'No quotes match these filters.' : 'No quotes yet. Share quotes.u-plate.com to collect your first response.'}</div>
        : <><p className="quotes-count">Showing {visible.length} of {quotes.length} responses</p><ol className="quotes-list">{visible.map((quote) => <li key={quote.id}>
          <div className="quote-meta"><strong>{quote.name || 'Anonymous'}</strong><span className="quote-rating" aria-label={`${quote.rating} out of 5 stars`}>{'★'.repeat(quote.rating)}{'☆'.repeat(5 - quote.rating)}</span>
            <span className={`quote-permission${quote.publishConsent ? ' quote-permission--yes' : ''}`}>{quote.publishConsent ? 'Approved for sharing' : 'Team only'}</span>
          </div>
          <blockquote>{quote.testimony}</blockquote>
          <div className="quote-details"><span>Using UPlate: {DURATION_LABELS[quote.duration] || quote.duration}</span><time dateTime={quote.createdAt}>{new Date(quote.createdAt).toLocaleString()}</time></div>
        </li>)}</ol></>}
    </div>
  );
}
