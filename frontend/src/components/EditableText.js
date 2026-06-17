import { useRef } from 'react';
import { useEditMode } from '../context/EditModeContext';
import api from '../api';

/**
 * EditableText — renders children normally; in edit mode shows an inline
 * editable field. On blur/Enter it calls onSave(newValue) if provided,
 * otherwise saves via the built-in API helpers.
 *
 * Props:
 *   value        – current text
 *   onSave(v)    – async callback when value changes (optional if apiSave is set)
 *   apiSave      – { type: 'content'|'settings'|'translation', ...params }
 *   multiline    – use textarea instead of input
 *   style        – forwarded to the wrapper span/div
 *   inputStyle   – extra styles on the input
 *   tag          – wrapper element tag when not editing (default: 'span')
 */
export default function EditableText({ value, onSave, apiSave, multiline, style, inputStyle, tag: Tag = 'span', children }) {
  const { editMode } = useEditMode();
  const ref = useRef(null);

  const handleSave = async (newVal) => {
    if (newVal === value) return;
    if (onSave) { await onSave(newVal); return; }
    if (!apiSave) return;
    const { type, lang, page, key } = apiSave;
    if (type === 'content') {
      // fetch current content first, merge, then save
      const r = await api.get(`/api/content/${page}`);
      const row = r.data.find(c => c.lang === lang) || {};
      const content = (() => { try { return JSON.parse(row.content || '{}'); } catch { return {}; } })();
      if (key === 'title') {
        await api.put(`/api/content/${page}/${lang}`, { title: newVal, content: row.content || '{}' });
      } else {
        content[key] = newVal;
        await api.put(`/api/content/${page}/${lang}`, { title: row.title || '', content: JSON.stringify(content) });
      }
    } else if (type === 'settings') {
      await api.put('/api/settings', { [key]: newVal });
    } else if (type === 'translation') {
      await api.put(`/api/translations/${lang}/${key}`, { value: newVal });
    }
  };

  const sharedStyle = {
    background: 'rgba(254,189,105,0.15)',
    border: '1px dashed #febd69',
    borderRadius: 4,
    outline: 'none',
    padding: '1px 4px',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    color: 'inherit',
    fontFamily: 'inherit',
    width: '100%',
    resize: 'vertical',
    ...inputStyle,
  };

  if (!editMode) {
    return <Tag style={style}>{children ?? value}</Tag>;
  }

  if (multiline) {
    return (
      <textarea ref={ref} defaultValue={value} rows={3}
        style={{ ...sharedStyle, display: 'block', ...style }}
        onBlur={e => handleSave(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) e.target.blur(); }}
      />
    );
  }

  return (
    <input ref={ref} defaultValue={value}
      style={{ ...sharedStyle, ...style }}
      onBlur={e => handleSave(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
    />
  );
}
