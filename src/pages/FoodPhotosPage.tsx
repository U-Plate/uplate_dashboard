import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FoodPhoto, FoodPhotoStatus } from '../constants';
import { useFoodPhotos } from '../contexts/FoodPhotosContext';
import { foodsApi, type FoodDetail } from '../api/foods';
import { Modal } from '../components/Modal';
import { formatAbsolute, formatRelative } from '../utils/formatTime';
import './FoodPhotosPage.css';

type StatusFilter = FoodPhotoStatus | 'all';

const STATUS_ORDER: { value: StatusFilter; label: string }[] = [
  { value: FoodPhotoStatus.Pending, label: 'Pending' },
  { value: FoodPhotoStatus.Approved, label: 'Approved' },
  { value: FoodPhotoStatus.Denied, label: 'Denied' },
  { value: 'all', label: 'All' },
];

const STATUS_LABEL: Record<FoodPhotoStatus, string> = {
  [FoodPhotoStatus.Pending]: 'Pending',
  [FoodPhotoStatus.Approved]: 'Live',
  [FoodPhotoStatus.Denied]: 'Denied',
  [FoodPhotoStatus.Replaced]: 'Replaced',
  [FoodPhotoStatus.Removed]: 'Removed',
};

/**
 * A just-approved photo sits behind the same CDN URL its predecessor did, so
 * the browser would happily show the old one. Version previews by review time
 * to force a refetch. The app deliberately does *not* do this — a stable URL
 * is what makes it cache well there.
 */
const versioned = (url: string, reviewedAt: number | null): string =>
  reviewedAt ? `${url}${url.includes('?') ? '&' : '?'}v=${reviewedAt}` : url;

const StatusPill: React.FC<{ status: FoodPhotoStatus }> = ({ status }) => (
  <span className={`photo-pill photo-pill--${status}`}>{STATUS_LABEL[status]}</span>
);

const PhotoCard: React.FC<{
  photo: FoodPhoto;
  detail: FoodDetail | undefined;
  busy: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onRemove: () => void;
  onZoom: (url: string) => void;
}> = ({ photo, detail, busy, onApprove, onDeny, onRemove, onZoom }) => {
  const isPending = photo.status === FoodPhotoStatus.Pending;
  const isApproved = photo.status === FoodPhotoStatus.Approved;
  const replaces =
    isPending && photo.currentApprovedUrl ? photo.currentApprovedUrl : null;
  const src = versioned(photo.url, photo.reviewedAt);
  const ingredients = detail?.ingredients?.trim() || null;

  return (
    <li className={`photo-card${busy ? ' photo-card--busy' : ''}`}>
      <div className="photo-card__frames">
        {replaces && (
          <figure className="photo-card__frame photo-card__frame--outgoing">
            <button
              type="button"
              className="photo-card__image-btn"
              onClick={() => onZoom(replaces)}
              aria-label="View the current photo full size"
            >
              <img src={replaces} alt="" loading="lazy" />
            </button>
            <figcaption>Currently live</figcaption>
          </figure>
        )}
        <figure className="photo-card__frame">
          <button
            type="button"
            className="photo-card__image-btn"
            onClick={() => onZoom(src)}
            aria-label={`View the submitted photo of ${photo.foodName ?? photo.foodId} full size`}
          >
            <img src={src} alt={photo.foodName ?? 'Submitted food photo'} loading="lazy" />
          </button>
          {replaces && <figcaption>Submitted</figcaption>}
        </figure>
      </div>

      <div className="photo-card__body">
        <div className="photo-card__heading">
          <h3 className="photo-card__name">
            {photo.foodName ?? <span className="photo-card__name--missing">Unknown food</span>}
          </h3>
          <StatusPill status={photo.status} />
        </div>

        <dl className="photo-card__meta">
          <div>
            <dt>Food ID</dt>
            <dd className="photo-card__mono">{photo.foodId}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd title={formatAbsolute(photo.submittedAt)}>
              {formatRelative(photo.submittedAt)}
            </dd>
          </div>
          <div>
            <dt>By</dt>
            <dd className="photo-card__mono">{photo.submittedBy || 'anonymous'}</dd>
          </div>
          {photo.reviewedAt && (
            <div>
              <dt>Reviewed</dt>
              <dd title={formatAbsolute(photo.reviewedAt)}>
                {formatRelative(photo.reviewedAt)}
              </dd>
            </div>
          )}
        </dl>

        {ingredients && (
          <details className="photo-card__ingredients">
            <summary>Ingredients</summary>
            <p>{ingredients}</p>
          </details>
        )}

        {isPending ? (
          <div className="photo-card__actions">
            <button
              type="button"
              className="photo-action photo-action--approve"
              onClick={onApprove}
              disabled={busy}
            >
              {replaces ? 'Approve & replace' : 'Approve'}
            </button>
            <button
              type="button"
              className="photo-action photo-action--deny"
              onClick={onDeny}
              disabled={busy}
            >
              Deny
            </button>
          </div>
        ) : (
          <>
            <p className="photo-card__resolved">
              {isApproved && 'Serving as this food’s photo in the app.'}
              {photo.status === FoodPhotoStatus.Denied && 'Image deleted.'}
              {photo.status === FoodPhotoStatus.Replaced &&
                'Superseded by a newer approved photo.'}
              {photo.status === FoodPhotoStatus.Removed &&
                'Removed from the app. Image deleted.'}
            </p>
            {isApproved && (
              <div className="photo-card__actions">
                <button
                  type="button"
                  className="photo-action photo-action--deny"
                  onClick={onRemove}
                  disabled={busy}
                >
                  Remove
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
};

export const FoodPhotosPage: React.FC = () => {
  const { photos, loading, pendingAction, approve, deny, remove, refresh } = useFoodPhotos();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(FoodPhotoStatus.Pending);
  const [search, setSearch] = useState('');
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [denying, setDenying] = useState<FoodPhoto | null>(null);
  const [removing, setRemoving] = useState<FoodPhoto | null>(null);

  // A photo alone doesn't tell you whether it's the right photo — "Grilled
  // Chicken" needs its ingredients next to it before anyone can judge the
  // image. Details are fetched per unseen food id and cached for the session:
  // ids are marked before the request so a failure (or a food that's left the
  // menu) can't spin the effect, and filtering never costs a round trip.
  const [details, setDetails] = useState<Record<string, FoodDetail>>({});
  const requestedIds = useRef(new Set<string>());

  useEffect(() => {
    const ids = [...new Set(photos.map((p) => p.foodId))].filter(
      (id) => !requestedIds.current.has(id),
    );
    if (ids.length === 0) return;
    ids.forEach((id) => requestedIds.current.add(id));

    let cancelled = false;
    foodsApi
      .getByIds(ids)
      .then((items) => {
        if (cancelled) return;
        setDetails((prev) => {
          const next = { ...prev };
          for (const item of items) next[item.id] = item;
          return next;
        });
      })
      .catch((err) => console.error('Failed to load food details:', err));

    return () => {
      cancelled = true;
    };
  }, [photos]);

  const counts = useMemo(() => {
    let pending = 0;
    let reviewed = 0;
    photos.forEach((p) => {
      if (p.status === FoodPhotoStatus.Pending) pending += 1;
      else reviewed += 1;
    });
    return { pending, reviewed, total: photos.length };
  }, [photos]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...photos]
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (q) {
          const hay = `${p.foodName ?? ''} ${p.foodId}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [photos, statusFilter, search]);

  const hasAnyFilter =
    statusFilter !== FoodPhotoStatus.Pending || search.trim().length > 0;

  const clearFilters = () => {
    setStatusFilter(FoodPhotoStatus.Pending);
    setSearch('');
  };

  // Approving is reversible (approve a different photo later), so it goes
  // through without a confirm. Denying deletes the image for good.
  const handleApprove = (id: string) => {
    void approve(id).catch(() => {
      /* rolled back and logged by the context */
    });
  };

  const confirmDeny = () => {
    const target = denying;
    setDenying(null);
    if (!target) return;
    void deny(target.id).catch(() => {
      /* rolled back and logged by the context */
    });
  };

  const confirmRemove = () => {
    const target = removing;
    setRemoving(null);
    if (!target) return;
    void remove(target.id).catch(() => {
      /* rolled back and logged by the context */
    });
  };

  return (
    <div className="photos-page">
      <header className="photos-page__header">
        <div className="photos-page__title-row">
          <p className="photos-page__eyebrow">Operations</p>
          <h1 className="photos-page__title">Food photos</h1>
        </div>
        <div className="photos-page__header-right">
          <p className="photos-page__summary">
            <strong>{counts.pending}</strong> pending
            <span aria-hidden> · </span>
            <span>{counts.reviewed} reviewed</span>
          </p>
          <button
            type="button"
            className="photos-refresh"
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <p className="photos-page__note">
        Approving publishes the photo to the food’s permanent image in the app.
        Denying and removing delete the image and can’t be undone.
      </p>

      <section className="photos-filters" aria-label="Filter photos">
        <div className="photos-segmented" role="group" aria-label="Filter by status">
          {STATUS_ORDER.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`photos-segmented__btn${statusFilter === s.value ? ' photos-segmented__btn--active' : ''}`}
              onClick={() => setStatusFilter(s.value)}
              aria-pressed={statusFilter === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="photos-search">
          <svg
            className="photos-search__icon"
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
            className="photos-search__input"
            type="search"
            placeholder="Search food name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search food name or ID"
          />
        </div>
      </section>

      <section className="photos-list-wrap">
        {loading ? (
          <div className="photos-empty">Loading photos...</div>
        ) : visible.length === 0 ? (
          <div className="photos-empty">
            {photos.length === 0 ? (
              <>No photos have been submitted yet.</>
            ) : (
              <>
                <span>No photos match these filters.</span>
                {hasAnyFilter && (
                  <button type="button" className="photos-empty__clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <ul className="photos-grid" role="list">
            {visible.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                detail={details[photo.foodId]}
                busy={pendingAction === photo.id}
                onApprove={() => handleApprove(photo.id)}
                onDeny={() => setDenying(photo)}
                onRemove={() => setRemoving(photo)}
                onZoom={setZoomed}
              />
            ))}
          </ul>
        )}
      </section>

      <Modal
        isOpen={denying !== null}
        onClose={() => setDenying(null)}
        title="Deny this photo?"
        onConfirm={confirmDeny}
        confirmText="Delete photo"
        confirmVariant="danger"
      >
        <p>
          This permanently deletes the submitted image for{' '}
          <strong>{denying?.foodName ?? denying?.foodId}</strong>. It can’t be recovered.
        </p>
      </Modal>

      <Modal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        title="Remove this photo?"
        onConfirm={confirmRemove}
        confirmText="Remove photo"
        confirmVariant="danger"
      >
        <p>
          This pulls the live photo for{' '}
          <strong>{removing?.foodName ?? removing?.foodId}</strong> out of the
          app and deletes the image. The food goes back to having no photo
          until a new one is approved.
        </p>
      </Modal>

      <Modal
        isOpen={zoomed !== null}
        onClose={() => setZoomed(null)}
        title="Photo"
      >
        {zoomed && <img className="photos-lightbox__image" src={zoomed} alt="" />}
      </Modal>
    </div>
  );
};
