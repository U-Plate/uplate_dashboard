import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import {
  approvePhoto,
  clearConfig,
  deletePublished,
  discardPending,
  EMPTY_S3_CONFIG,
  loadConfig,
  saveConfig,
  scanPendingGroups,
  type PendingGroup,
  type PendingObject,
  type S3Config,
} from '../utils/s3Gateway';
import { foodsApi, type FoodDetail } from '../api/foods';
import './PhotoReviewPage.css';

export const PhotoReviewPage: React.FC = () => {
  const [config, setConfig] = useState<S3Config | null>(() => loadConfig());
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [draft, setDraft] = useState<S3Config>(EMPTY_S3_CONFIG);

  const [groups, setGroups] = useState<PendingGroup[]>([]);
  const [tab, setTab] = useState<'queue' | 'published'>('queue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [discardingId, setDiscardingId] = useState<string | null>(null);
  const [deletingPublishedId, setDeletingPublishedId] = useState<string | null>(null);

  const [details, setDetails] = useState<Record<string, FoodDetail>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Block the UI with the config modal whenever credentials are missing.
  useEffect(() => {
    if (!config) {
      setDraft(EMPTY_S3_CONFIG);
      setConfigModalOpen(true);
    }
  }, [config]);

  const scan = useCallback(async (activeConfig: S3Config) => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanPendingGroups(activeConfig);
      // Selection is reconciled against the active tab by a dedicated effect.
      setGroups(result);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reach the bucket. Check your credentials, endpoint, and CORS policy.'
      );
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (config) {
      void scan(config);
    }
  }, [config, scan]);

  const handleSaveConfig = () => {
    saveConfig(draft);
    setConfig(draft);
    setConfigModalOpen(false);
  };

  const handleClearConfig = () => {
    clearConfig();
    setGroups([]);
    setDetails({});
    setError(null);
    setConfig(null);
  };

  const openConfigModal = () => {
    setDraft(config ?? EMPTY_S3_CONFIG);
    setConfigModalOpen(true);
  };

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-review-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<S3Config>;
      setDraft({ ...EMPTY_S3_CONFIG, ...parsed });
    } catch (err) {
      console.error(err);
      window.alert('Could not import config: the file is not valid JSON.');
    }
  };

  const handleApprove = async (group: PendingGroup, chosen: PendingObject) => {
    if (!config) return;
    const confirmed = window.confirm(
      `Publish "${chosen.fileName}" for ${group.id}? All other pending photos in this folder will be deleted.`
    );
    if (!confirmed) return;

    setApprovingKey(chosen.key);
    setError(null);
    try {
      await approvePhoto(config, group, chosen);
      await scan(config);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Approval failed.');
    } finally {
      setApprovingKey(null);
    }
  };

  const handleDiscardAll = async (group: PendingGroup) => {
    if (!config || group.pending.length === 0) return;
    const confirmed = window.confirm(
      `Discard all ${group.pending.length} pending photo${
        group.pending.length === 1 ? '' : 's'
      } for ${group.id}? This cannot be undone.${
        group.published ? ' The published image will be kept.' : ''
      }`
    );
    if (!confirmed) return;

    setDiscardingId(group.id);
    setError(null);
    try {
      await discardPending(config, group);
      await scan(config);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Discard failed.');
    } finally {
      setDiscardingId(null);
    }
  };

  const handleDeletePublished = async (group: PendingGroup) => {
    if (!config || !group.published) return;
    const confirmed = window.confirm(
      `Delete the published image for ${group.id}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingPublishedId(group.id);
    setError(null);
    try {
      await deletePublished(config, group);
      await scan(config);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingPublishedId(null);
    }
  };

  const configComplete =
    !!draft.bucketName && !!draft.accessKeyId && !!draft.secretAccessKey;

  const queueGroups = useMemo(
    () => groups.filter((g) => g.pending.length > 0),
    [groups]
  );
  const publishedGroups = useMemo(
    () => groups.filter((g) => g.published),
    [groups]
  );
  const visibleGroups = tab === 'queue' ? queueGroups : publishedGroups;

  // Fetch food details (name + ingredients) for every visible id in one call so
  // each food can be compared against its photos on the same page.
  useEffect(() => {
    const ids = visibleGroups.map((g) => g.id);
    if (ids.length === 0) {
      setDetails({});
      return;
    }

    let cancelled = false;
    setDetailsLoading(true);

    foodsApi
      .getByIds(ids)
      .then((items) => {
        if (cancelled) return;
        const map: Record<string, FoodDetail> = {};
        for (const item of items) map[item.id] = item;
        setDetails(map);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setDetails({});
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visibleGroups]);

  return (
    <div className="photo-review">
      <div className="photo-review__header">
        <div className="photo-review__heading">
          <p className="photo-review__eyebrow">Moderate</p>
          <h1 className="photo-review__title">Photo Review</h1>
          <p className="photo-review__subtitle">
            Approve pending photos straight from your S3-compatible bucket. Your
            browser talks to storage directly &mdash; no server in the middle.
          </p>
        </div>
        <div className="photo-review__header-actions">
          <Button variant="secondary" onClick={() => config && scan(config)} disabled={!config || loading}>
            {loading ? 'Scanning…' : 'Refresh'}
          </Button>
          <Button variant="secondary" onClick={openConfigModal}>
            {config ? 'Edit config' : 'Configure'}
          </Button>
          {config && (
            <Button variant="danger" onClick={handleClearConfig}>
              Clear configuration
            </Button>
          )}
        </div>
      </div>

      {error && <div className="photo-review__error">{error}</div>}

      {config && (
        <div className="photo-review__body">
          <div className="photo-review__tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'queue'}
              className={`photo-review__tab${
                tab === 'queue' ? ' photo-review__tab--active' : ''
              }`}
              onClick={() => setTab('queue')}
            >
              Queue
              <span className="photo-review__tab-count">{queueGroups.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === 'published'}
              className={`photo-review__tab${
                tab === 'published' ? ' photo-review__tab--active' : ''
              }`}
              onClick={() => setTab('published')}
            >
              Published
              <span className="photo-review__tab-count">{publishedGroups.length}</span>
            </button>
          </div>

          {visibleGroups.length === 0 ? (
            <div className="photo-review__placeholder">
              {loading
                ? 'Scanning bucket…'
                : tab === 'queue'
                  ? 'No foods with pending photos to approve.'
                  : 'No published photos yet.'}
            </div>
          ) : (
            <div className="photo-review__feed">
              {visibleGroups.map((group) => {
                const detail = details[group.id];
                return (
                  <section key={group.id} className="photo-review__food">
                    <div className="photo-review__arena-header">
                      <div className="photo-review__arena-heading">
                        <h2 className="photo-review__arena-title">
                          {detail?.name ?? group.id}
                        </h2>
                        <p className="photo-review__arena-hint">
                          {group.id} &middot; {group.pending.length} pending photo
                          {group.pending.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      {group.pending.length > 0 && (
                        <Button
                          variant="danger"
                          onClick={() => handleDiscardAll(group)}
                          disabled={discardingId !== null || approvingKey !== null}
                        >
                          {discardingId === group.id ? 'Discarding…' : 'Discard all'}
                        </Button>
                      )}
                    </div>

                    <div className="photo-review__detail">
                      {detailsLoading && !detail ? (
                        <p className="photo-review__detail-status">Loading food details…</p>
                      ) : detail ? (
                        <>
                          <p className="photo-review__detail-label">Ingredients</p>
                          <p className="photo-review__detail-ingredients">
                            {detail.ingredients?.trim()
                              ? detail.ingredients
                              : 'No ingredients listed.'}
                          </p>
                        </>
                      ) : (
                        <p className="photo-review__detail-status photo-review__detail-status--error">
                          No food item found for this id.
                        </p>
                      )}
                    </div>

                    {group.published && (
                      <div className="photo-review__published">
                        <p className="photo-review__published-label">Currently published</p>
                        <div className="photo-review__published-thumb">
                          <img
                            src={`${group.published.url}?t=${
                              group.published.lastModified?.getTime() ?? ''
                            }`}
                            alt={`Published image for ${group.id}`}
                            loading="lazy"
                          />
                        </div>
                        <Button
                          variant="danger"
                          onClick={() => handleDeletePublished(group)}
                          disabled={
                            deletingPublishedId !== null ||
                            approvingKey !== null ||
                            discardingId !== null
                          }
                        >
                          {deletingPublishedId === group.id
                            ? 'Deleting…'
                            : 'Delete published image'}
                        </Button>
                      </div>
                    )}

                    {group.pending.length === 0 ? (
                      <div className="photo-review__placeholder photo-review__placeholder--inline">
                        No pending photos for this id.
                      </div>
                    ) : (
                      <div className="photo-review__grid">
                        {group.pending.map((photo) => (
                          <div key={photo.key} className="photo-review__card">
                            <div className="photo-review__thumb">
                              <img src={photo.url} alt={photo.fileName} loading="lazy" />
                            </div>
                            <div className="photo-review__card-body">
                              <span className="photo-review__card-name" title={photo.fileName}>
                                {photo.fileName}
                              </span>
                              <button
                                className="photo-review__approve"
                                onClick={() => handleApprove(group, photo)}
                                disabled={approvingKey !== null || discardingId !== null}
                              >
                                {approvingKey === photo.key
                                  ? 'Publishing…'
                                  : 'Approve & Publish'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={configModalOpen}
        onClose={() => {
          // Only allow dismissing if we already have a working config.
          if (config) setConfigModalOpen(false);
        }}
        title="S3 Gateway Configuration"
        onConfirm={configComplete ? handleSaveConfig : undefined}
        confirmText="Save & connect"
        cancelText={config ? 'Cancel' : 'Close'}
      >
        <p className="photo-review__modal-note">
          Credentials are stored only in this browser&rsquo;s localStorage. Use a
          scoped, bucket-only IAM key and access this dashboard over HTTPS.
        </p>
        <div className="photo-review__config-io">
          <Button variant="secondary" onClick={() => importInputRef.current?.click()}>
            Import JSON
          </Button>
          <Button variant="secondary" onClick={handleExportConfig}>
            Export JSON
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportConfig(file);
              e.target.value = '';
            }}
          />
        </div>
        <p className="photo-review__modal-note photo-review__modal-note--warn">
          Exported files contain your secret key in plain text &mdash; share them
          only through a secure channel.
        </p>
        <FormField
          label="Bucket name"
          type="text"
          value={draft.bucketName}
          onChange={(v) => setDraft((d) => ({ ...d, bucketName: String(v) }))}
          placeholder="my-photos"
          required
        />
        <FormField
          label="Region"
          type="text"
          value={draft.region}
          onChange={(v) => setDraft((d) => ({ ...d, region: String(v) }))}
          placeholder="us-east-1 (or 'auto' for R2)"
        />
        <FormField
          label="Endpoint"
          type="text"
          value={draft.endpoint}
          onChange={(v) => setDraft((d) => ({ ...d, endpoint: String(v) }))}
          placeholder="https://<account>.r2.cloudflarestorage.com (leave blank for AWS)"
        />
        <FormField
          label="Public base URL"
          type="text"
          value={draft.publicBaseUrl}
          onChange={(v) => setDraft((d) => ({ ...d, publicBaseUrl: String(v) }))}
          placeholder="https://cdn.boilerbites.com (CDN domain for viewing images)"
        />
        <FormField
          label="Access Key ID"
          type="text"
          value={draft.accessKeyId}
          onChange={(v) => setDraft((d) => ({ ...d, accessKeyId: String(v) }))}
          placeholder="AKIA…"
          required
        />
        <FormField
          label="Secret Access Key"
          type="text"
          value={draft.secretAccessKey}
          onChange={(v) => setDraft((d) => ({ ...d, secretAccessKey: String(v) }))}
          placeholder="wJalr…"
          required
        />
      </Modal>
    </div>
  );
};
