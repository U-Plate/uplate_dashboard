import React, { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import './RichTextEditor.css';

interface RichTextEditorProps {
  /** HTML, owned by the parent. */
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Toggles the error border. */
  error?: boolean;
  /** Id of the <label> describing this editor. */
  ariaLabelledBy?: string;
}

/** Strip tags to get the visible text — used by callers for empty validation. */
export const htmlToPlainText = (html: string): string =>
  new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';

const URL_RE = /^(https?:\/\/|mailto:)/i;

/**
 * Dependency-free WYSIWYG editor built on contentEditable + execCommand.
 *
 * execCommand is deprecated but universally implemented and preserves the
 * native undo stack; the backend `normalizeEmailHtml` is the authoritative
 * sanitizer/normalizer, so messy browser markup is cleaned server-side.
 *
 * The contentEditable div is controlled at the boundary only: innerHTML is set
 * once on mount and re-synced from `value` solely on external changes (e.g. a
 * form reset), never on every keystroke — otherwise the caret would jump.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  disabled,
  placeholder,
  error,
  ariaLabelledBy,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(value);
  const savedRange = useRef<Range | null>(null);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Set initial content once, and re-sync only when `value` changes externally
  // (i.e. not as a result of our own onInput emit) — e.g. resetForm().
  useEffect(() => {
    if (editorRef.current && value !== lastHtml.current) {
      editorRef.current.innerHTML = value;
      lastHtml.current = value;
    }
  }, [value]);

  // Prefer inline CSS for indentation so margin-left survives email clients.
  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, 'true');
    } catch {
      /* not all browsers support the flag; backend normalizes regardless */
    }
  }, []);

  const emit = () => {
    const html = editorRef.current?.innerHTML ?? '';
    lastHtml.current = html;
    onChange(html);
  };

  const focusEditor = () => editorRef.current?.focus();

  const exec = (command: string, arg?: string) => {
    if (disabled) return;
    focusEditor();
    document.execCommand(command, false, arg);
    emit();
  };

  const formatBlock = (tag: 'h1' | 'h2') => {
    if (disabled) return;
    focusEditor();
    const current = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    // Toggle: if already this block, go back to a paragraph.
    document.execCommand('formatBlock', false, current === tag ? 'p' : tag);
    emit();
  };

  // Toolbar buttons use onMouseDown + preventDefault so the editor keeps its
  // selection (onClick would blur it first).
  const onToolMouseDown =
    (fn: () => void) => (e: React.MouseEvent) => {
      e.preventDefault();
      fn();
    };

  const openLinkModal = () => {
    if (disabled) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
      setLinkText(sel.toString());
    } else {
      savedRange.current = null;
      setLinkText('');
    }
    setLinkUrl('');
    setLinkError(null);
    setLinkOpen(true);
  };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!URL_RE.test(url)) {
      setLinkError('Enter a URL starting with http://, https://, or mailto:');
      return;
    }
    focusEditor();
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
    if (range) {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = linkText.trim() || url;
      range.deleteContents();
      range.insertNode(a);
      // Move caret after the inserted link.
      range.setStartAfter(a);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setLinkOpen(false);
    savedRange.current = null;
    emit();
  };

  return (
    <div className={`rte${error ? ' rte--error' : ''}${disabled ? ' rte--disabled' : ''}`}>
      <div className="rte__toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" className="rte__tool" aria-label="Bold" title="Bold"
          disabled={disabled} onMouseDown={onToolMouseDown(() => exec('bold'))}>
          <strong>B</strong>
        </button>
        <button type="button" className="rte__tool" aria-label="Underline" title="Underline"
          disabled={disabled} onMouseDown={onToolMouseDown(() => exec('underline'))}>
          <u>U</u>
        </button>
        <span className="rte__divider" aria-hidden="true" />
        <button type="button" className="rte__tool" aria-label="Title" title="Title"
          disabled={disabled} onMouseDown={onToolMouseDown(() => formatBlock('h1'))}>
          Title
        </button>
        <button type="button" className="rte__tool" aria-label="Heading" title="Heading"
          disabled={disabled} onMouseDown={onToolMouseDown(() => formatBlock('h2'))}>
          Heading
        </button>
        <span className="rte__divider" aria-hidden="true" />
        <button type="button" className="rte__tool" aria-label="Decrease indent" title="Decrease indent"
          disabled={disabled} onMouseDown={onToolMouseDown(() => exec('outdent'))}>
          &#x2190;|
        </button>
        <button type="button" className="rte__tool" aria-label="Increase indent" title="Increase indent"
          disabled={disabled} onMouseDown={onToolMouseDown(() => exec('indent'))}>
          |&#x2192;
        </button>
        <span className="rte__divider" aria-hidden="true" />
        <button type="button" className="rte__tool" aria-label="Insert link" title="Insert link"
          disabled={disabled} onMouseDown={onToolMouseDown(openLinkModal)}>
          &#x1F517; Link
        </button>
      </div>

      <div
        ref={editorRef}
        className="rte__editor"
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={ariaLabelledBy}
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
      />

      <Modal
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Insert link"
        onConfirm={insertLink}
        confirmText="Insert"
        cancelText="Cancel"
      >
        <div className="rte__link-fields">
          <label className="form-field__label" htmlFor="rte-link-url">URL</label>
          <input
            id="rte-link-url"
            className="form-field__input"
            type="text"
            value={linkUrl}
            onChange={(e) => { setLinkUrl(e.target.value); if (linkError) setLinkError(null); }}
            placeholder="https://example.com"
            autoFocus
          />
          <label className="form-field__label" htmlFor="rte-link-text">Display text</label>
          <input
            id="rte-link-text"
            className="form-field__input"
            type="text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Text shown in the email"
          />
          {linkError && <div className="form-field__error">{linkError}</div>}
        </div>
      </Modal>
    </div>
  );
};
