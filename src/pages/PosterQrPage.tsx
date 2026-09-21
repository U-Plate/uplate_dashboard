import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { Button } from '../components/Button';
import './PosterQrPage.css';

type Destination = 'store' | 'website';
type QrBounds = { x: number; y: number; width: number; height: number };
type PosterItem = {
  key: string;
  fileName: string;
  image: HTMLImageElement;
  id: string;
  destination: Destination;
  bounds: QrBounds | null;
  status: string;
  manualMode: boolean;
};

type DetectedBarcode = { boundingBox: DOMRectReadOnly };
type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

const cleanId = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = source;
  });

const findGreenPlaceholder = (image: HTMLImageElement): QrBounds | null => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  let greenPixels = 0;
  const step = Math.max(1, Math.floor(Math.max(canvas.width, canvas.height) / 1200));

  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      if (green > 180 && green > red * 1.65 && green > blue * 1.65) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        greenPixels += 1;
      }
    }
  }

  if (maxX < 0 || maxY < 0) return null;
  const width = maxX - minX + step;
  const height = maxY - minY + step;
  const sampledArea = (width / step) * (height / step);
  const imageArea = canvas.width * canvas.height;
  const fillRatio = greenPixels / sampledArea;
  if (width * height < imageArea * 0.005 || fillRatio < 0.72) return null;

  return {
    x: minX,
    y: minY,
    width: Math.min(width, canvas.width - minX),
    height: Math.min(height, canvas.height - minY),
  };
};

const posterTargetUrl = (item: PosterItem) => {
  const slug = cleanId(item.id);
  if (!slug) return '';
  return item.destination === 'store'
    ? `https://qr.u-plate.com/store-${slug}`
    : `https://qr.u-plate.com/${slug}`;
};

const renderFinishedPoster = async (item: PosterItem) => {
  if (!item.bounds || !posterTargetUrl(item)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = item.image.naturalWidth;
  canvas.height = item.image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(item.image, 0, 0);

  const { bounds } = item;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, posterTargetUrl(item), {
    width: Math.max(128, Math.round(Math.min(bounds.width, bounds.height))),
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#111827', light: '#ffffff' },
  });
  context.fillStyle = '#ffffff';
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  const renderedSize = Math.min(bounds.width, bounds.height);
  context.drawImage(
    qrCanvas,
    bounds.x + (bounds.width - renderedSize) / 2,
    bounds.y + (bounds.height - renderedSize) / 2,
    renderedSize,
    renderedSize,
  );
  return canvas;
};

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The poster could not be exported.'));
    }, 'image/png');
  });

export function PosterQrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [posters, setPosters] = useState<PosterItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [idMode, setIdMode] = useState<'same' | 'different'>('different');
  const [isDetecting, setIsDetecting] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const activePoster = posters[activeIndex] ?? null;
  const poster = activePoster?.image ?? null;
  const fileName = activePoster?.fileName ?? '';
  const id = activePoster?.id ?? '';
  const destination = activePoster?.destination ?? 'store';
  const bounds = activePoster?.bounds ?? null;
  const status = activePoster?.status ?? 'Choose one or more posters to begin.';
  const manualMode = activePoster?.manualMode ?? false;

  const updateActivePoster = useCallback((updates: Partial<PosterItem>) => {
    setPosters((current) => current.map((item, index) =>
      index === activeIndex ? { ...item, ...updates } : item));
  }, [activeIndex]);

  const slug = useMemo(() => cleanId(id), [id]);
  const targetUrl = useMemo(() => {
    if (!slug) return '';
    return destination === 'store'
      ? `https://qr.u-plate.com/store-${slug}`
      : `https://qr.u-plate.com/${slug}`;
  }, [destination, slug]);

  const detectQr = useCallback(async (image: HTMLImageElement): Promise<Pick<PosterItem, 'bounds' | 'status' | 'manualMode'>> => {
    const greenPlaceholder = findGreenPlaceholder(image);
    if (greenPlaceholder) {
      return {
        bounds: greenPlaceholder,
        manualMode: false,
        status: 'Green QR area found. Add an ID to generate the replacement.',
      };
    }

    const Detector = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
    if (!Detector) {
      return {
        bounds: null,
        manualMode: true,
        status: 'No green placeholder was found and QR detection is unavailable. Select the area manually.',
      };
    }

    try {
      const detector = new Detector({ formats: ['qr_code'] });
      const results = await detector.detect(image);
      if (!results.length) {
        return {
          bounds: null,
          manualMode: true,
          status: 'No green placeholder or QR code was found. Select the area manually.',
        };
      }

      const box = results[0].boundingBox;
      const padding = Math.max(box.width, box.height) * 0.06;
      const x = Math.max(0, box.x - padding);
      const y = Math.max(0, box.y - padding);
      return {
        bounds: {
          x,
          y,
          width: Math.min(image.naturalWidth - x, box.width + padding * 2),
          height: Math.min(image.naturalHeight - y, box.height + padding * 2),
        },
        manualMode: false,
        status: 'QR code found. Add an ID to generate the replacement.',
      };
    } catch {
      return {
        bounds: null,
        manualMode: true,
        status: 'The QR code could not be detected. Select its area manually.',
      };
    }
  }, []);

  const drawPoster = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !poster) return;
    canvas.width = poster.naturalWidth;
    canvas.height = poster.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(poster, 0, 0);

    if (!bounds) return;
    if (!targetUrl) {
      if (manualMode && bounds.width > 0 && bounds.height > 0) {
        context.save();
        context.strokeStyle = '#44608d';
        context.lineWidth = Math.max(2, poster.naturalWidth / 500);
        context.setLineDash([12, 8]);
        context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        context.restore();
      }
      return;
    }
    const qrSize = Math.max(128, Math.round(Math.min(bounds.width, bounds.height)));
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, targetUrl, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#111827', light: '#ffffff' },
    });
    context.fillStyle = '#ffffff';
    context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    const renderedSize = Math.min(bounds.width, bounds.height);
    const renderedX = bounds.x + (bounds.width - renderedSize) / 2;
    const renderedY = bounds.y + (bounds.height - renderedSize) / 2;
    context.drawImage(qrCanvas, renderedX, renderedY, renderedSize, renderedSize);
  }, [bounds, manualMode, poster, targetUrl]);

  useEffect(() => {
    void drawPoster();
  }, [drawPoster]);

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) return;
    const firstNewIndex = posters.length;
    setIsDetecting(true);
    const loaded: PosterItem[] = [];
    for (const file of imageFiles) {
      const objectUrl = URL.createObjectURL(file);
      try {
        const image = await loadImage(objectUrl);
        const detection = await detectQr(image);
        loaded.push({
          key: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          fileName: file.name,
          image,
          id: idMode === 'same' ? id : cleanId(file.name.replace(/\.[^.]+$/, '')),
          destination: 'store',
          ...detection,
        });
      } catch {
        // Ignore unreadable files and continue processing the rest of the batch.
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }
    setPosters((current) => [...current, ...loaded]);
    if (loaded.length) setActiveIndex(firstNewIndex);
    setIsDetecting(false);
  };

  const isFileDrag = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes('Files');

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDraggingFile(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFile(false);
    void handleFiles(Array.from(event.dataTransfer.files));
  };

  const canvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, ((event.clientX - rect.left) / rect.width) * canvas.width)),
      y: Math.max(0, Math.min(canvas.height, ((event.clientY - rect.top) / rect.height) * canvas.height)),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!manualMode || !poster) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    setDragStart(point);
    updateActivePoster({ bounds: { x: point.x, y: point.y, width: 0, height: 0 } });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!manualMode || !dragStart) return;
    const point = canvasPoint(event);
    updateActivePoster({ bounds: {
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    } });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStart) return;
    const point = canvasPoint(event);
    const finalBounds = {
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    };
    setDragStart(null);
    if (finalBounds.width > 30 && finalBounds.height > 30) {
      updateActivePoster({
        bounds: finalBounds,
        status: 'QR area selected. Add an ID to generate the replacement.',
        manualMode: false,
      });
    } else {
      updateActivePoster({ bounds: null, status: 'Drag a box around the full QR code.' });
    }
  };

  const downloadPoster = async () => {
    await drawPoster();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'poster';
    link.download = `${baseName}-${slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadAllPosters = async () => {
    const zip = new JSZip();
    for (const [index, item] of posters.entries()) {
      const rendered = await renderFinishedPoster(item);
      if (!rendered) continue;
      const baseName = item.fileName.replace(/\.[^.]+$/, '') || `poster-${index + 1}`;
      zip.file(
        `${index + 1}-${baseName}-${cleanId(item.id)}.png`,
        await canvasToBlob(rendered),
      );
    }
    const archive = await zip.generateAsync({ type: 'blob' });
    const archiveUrl = URL.createObjectURL(archive);
    const link = document.createElement('a');
    link.download = 'uplate-posters.zip';
    link.href = archiveUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(archiveUrl), 1000);
  };

  const ready = Boolean(poster && bounds && targetUrl && bounds.width > 30 && bounds.height > 30);
  const allReady = posters.length > 1 && posters.every((item) =>
    Boolean(item.bounds && posterTargetUrl(item) && item.bounds.width > 30 && item.bounds.height > 30));

  return (
    <div
      className={`poster-qr-page${isDraggingFile ? ' poster-qr-page--dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingFile && (
        <div className="poster-qr-drop-overlay" aria-hidden="true">
          <div>
            <span>+</span>
            <strong>Drop poster to upload</strong>
            <small>The image stays on this device.</small>
          </div>
        </div>
      )}
      <header className="poster-qr-header">
        <div>
          <p className="poster-qr-header__eyebrow">Local tool</p>
          <h1>Poster QR builder</h1>
          <p>Replace a green placeholder or existing QR without uploading the artwork.</p>
        </div>
        <span className="poster-qr-header__privacy">Processed in your browser</span>
      </header>

      <div className="poster-qr-workspace">
        <aside className="poster-qr-controls" aria-label="Poster settings">
          <section className="poster-qr-step">
            <span className="poster-qr-step__number">1</span>
            <div className="poster-qr-step__body">
              <h2>Choose posters</h2>
              <p>Select multiple files or drag them anywhere onto this page.</p>
              <input
                ref={fileInputRef}
                className="poster-qr-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  void handleFiles(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                {poster ? 'Add more posters' : 'Choose posters'}
              </Button>
            </div>
          </section>

          {posters.length > 0 && (
            <div className="poster-qr-queue" aria-label="Uploaded posters">
              <div className="poster-qr-queue__header">
                <span>Posters</span>
                <small>{posters.length}</small>
              </div>
              <div className="poster-qr-queue__list">
                {posters.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`poster-qr-queue__item${index === activeIndex ? ' poster-qr-queue__item--active' : ''}`}
                    onClick={() => {
                      setActiveIndex(index);
                      setDragStart(null);
                    }}
                  >
                    <span>{index + 1}</span>
                    <strong>{item.fileName}</strong>
                    <small>{item.id || 'Needs ID'}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <section className="poster-qr-step">
            <span className="poster-qr-step__number">2</span>
            <div className="poster-qr-step__body">
              <fieldset className="poster-qr-id-mode">
                <legend>ID assignment</legend>
                <div>
                  <label className={idMode === 'same' ? 'poster-qr-id-mode__choice poster-qr-id-mode__choice--active' : 'poster-qr-id-mode__choice'}>
                    <input
                      type="radio"
                      name="id-mode"
                      checked={idMode === 'same'}
                      onChange={() => {
                        setIdMode('same');
                        if (id) setPosters((current) => current.map((item) => ({ ...item, id })));
                      }}
                    />
                    Same ID
                  </label>
                  <label className={idMode === 'different' ? 'poster-qr-id-mode__choice poster-qr-id-mode__choice--active' : 'poster-qr-id-mode__choice'}>
                    <input
                      type="radio"
                      name="id-mode"
                      checked={idMode === 'different'}
                      onChange={() => setIdMode('different')}
                    />
                    Different IDs
                  </label>
                </div>
              </fieldset>
              <label className="poster-qr-label" htmlFor="poster-id">
                {idMode === 'same' ? 'Shared ID' : 'Poster ID'}
              </label>
              <input
                id="poster-id"
                className="poster-qr-input"
                value={id}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (idMode === 'same') {
                    setPosters((current) => current.map((item) => ({ ...item, id: nextId })));
                  } else {
                    updateActivePoster({ id: nextId });
                  }
                }}
                placeholder="corec-vegetarian"
                spellCheck={false}
                disabled={!activePoster}
              />
              <span className="poster-qr-help">
                {idMode === 'same'
                  ? 'This ID will be used for every poster.'
                  : 'Select each poster above to edit its ID.'}
              </span>
            </div>
          </section>

          <section className="poster-qr-step">
            <span className="poster-qr-step__number">3</span>
            <fieldset className="poster-qr-step__body poster-qr-destination">
              <legend>Open after scan</legend>
              <label className={destination === 'store' ? 'poster-qr-choice poster-qr-choice--selected' : 'poster-qr-choice'}>
                <input type="radio" name="destination" checked={destination === 'store'} onChange={() => updateActivePoster({ destination: 'store' })} disabled={!activePoster} />
                <span><strong>App store</strong><small>Routes by device</small></span>
              </label>
              <label className={destination === 'website' ? 'poster-qr-choice poster-qr-choice--selected' : 'poster-qr-choice'}>
                <input type="radio" name="destination" checked={destination === 'website'} onChange={() => updateActivePoster({ destination: 'website' })} disabled={!activePoster} />
                <span><strong>Website</strong><small>Opens the QR URL</small></span>
              </label>
            </fieldset>
          </section>

          <div className="poster-qr-result">
            <span>QR destination</span>
            <code>{targetUrl || 'Enter an ID'}</code>
          </div>

          {poster && (
            <button
              className="poster-qr-detect-button"
              type="button"
              onClick={() => {
                updateActivePoster({
                  bounds: null,
                  manualMode: true,
                  status: 'Drag a box around the full QR code.',
                });
              }}
            >
              Select QR area manually
            </button>
          )}

          <div className="poster-qr-download-actions">
            <Button onClick={() => void downloadPoster()} disabled={!ready}>
              Download poster
            </Button>
            {posters.length > 1 && (
              <Button variant="secondary" onClick={() => void downloadAllPosters()} disabled={!allReady}>
                Download all ({posters.length})
              </Button>
            )}
          </div>
        </aside>

        <main className={`poster-qr-preview${manualMode ? ' poster-qr-preview--selecting' : ''}`}>
          <div className="poster-qr-preview__toolbar">
            <div>
              <h2>Preview</h2>
              <p role="status">{isDetecting ? 'Finding the QR code…' : status}</p>
            </div>
            {poster && <span>{poster.naturalWidth} × {poster.naturalHeight}px</span>}
          </div>
          <div className="poster-qr-canvas-stage">
            {poster ? (
              <canvas
                ref={canvasRef}
                className="poster-qr-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => {
                  setDragStart(null);
                  updateActivePoster({ bounds: null });
                }}
                aria-label={manualMode ? 'Drag to select the QR code area' : 'Poster preview'}
              />
            ) : (
              <button className="poster-qr-empty" type="button" onClick={() => fileInputRef.current?.click()}>
                <span className="poster-qr-empty__icon" aria-hidden="true">+</span>
                <strong>Choose a poster</strong>
                <span>Your image stays on this device.</span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
