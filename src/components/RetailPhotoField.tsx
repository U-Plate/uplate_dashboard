import { useEffect, useId, useMemo, useRef } from 'react';
import { Button } from './Button';
import './RetailPhotoField.css';

import { RETAIL_PHOTO_TYPES } from '../utils/retailPhotos';

export function RetailPhotoField({ currentUrl, file, removed, onFile, onRemoved, error, disabled }: {
  currentUrl: string | null;
  file: File | null;
  removed: boolean;
  onFile: (file: File | null) => void;
  onRemoved: (removed: boolean) => void;
  error?: string;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const preview = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const shown = preview ?? (removed ? null : currentUrl);
  return <div className="form-field">
    <label className="form-field__label" htmlFor={id}>Food photo</label>
    <div className="retail-photo-field">
      <div className="retail-photo-field__preview">
        {shown ? <img src={shown} alt="Menu item photo preview" /> : <span>No photo</span>}
      </div>
      <div className="retail-photo-field__controls">
        <input id={id} ref={input} className="retail-photo-field__input" type="file"
          accept={RETAIL_PHOTO_TYPES.join(',')} disabled={disabled}
          aria-describedby={`${id}-hint`} aria-invalid={!!error}
          onChange={(event) => {
            const chosen = event.target.files?.[0];
            event.target.value = '';
            if (chosen) { onRemoved(false); onFile(chosen); }
          }} />
        <div className="retail-photo-field__buttons">
          <Button variant="secondary" disabled={disabled} onClick={() => input.current?.click()}>
            {shown ? 'Replace photo' : 'Choose photo'}
          </Button>
          {shown && <Button variant="danger" disabled={disabled} onClick={() => { onFile(null); onRemoved(!!currentUrl); }}>Remove</Button>}
          {(file || removed) && <Button variant="secondary" disabled={disabled} onClick={() => { onFile(null); onRemoved(false); }}>Undo</Button>}
        </div>
        <p id={`${id}-hint`} className="retail-photo-field__hint" title="The same photo represents this menu item across all sizes. Students cannot upload retail photos.">
          {file ? `${file.name} · uploads when you save.` : removed ? 'The photo will be removed when you save.' : 'Shown in the app’s menu and item details. One photo for all sizes. JPEG, PNG or WebP, up to 5 MB.'}
        </p>
        <p className="retail-photo-field__hint">Publishes on save. No review queue.</p>
      </div>
    </div>
    {error && <div className="form-field__error" role="alert">{error}</div>}
  </div>;
}
