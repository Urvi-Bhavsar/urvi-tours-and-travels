import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { tripLabel } from '../../config.js';

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  follow_up: 'Follow-up',
  converted: 'Converted',
  closed: 'Closed',
};

function toLocal(ts) {
  if (!ts) return '';
  const d = new Date(ts); // server sends ISO timestamps (UTC)
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

// 'YYYY-MM-DD' -> '12 Nov 2026' (no timezone shifting)
function fmtDay(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export default function Inquiries() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ new: 0, due: 0 });
  const [filter, setFilter] = useState('all'); // all | today | <status>
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const params = {};
    if (filter === 'today') params.followup = 'today';
    else if (filter !== 'all') params.status = filter;
    if (q.trim()) params.q = q.trim();
    try {
      const data = await api.listInquiries(params);
      setItems(data.inquiries);
      setCounts(data.counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  const tabs = [
    ['all', 'All'],
    ['today', `Due today${counts.due ? ` (${counts.due})` : ''}`],
    ['new', `New${counts.new ? ` (${counts.new})` : ''}`],
    ['contacted', 'Contacted'],
    ['follow_up', 'Follow-up'],
    ['converted', 'Converted'],
    ['closed', 'Closed'],
  ];

  return (
    <>
      <div className="row-between">
        <input
          className="search"
          placeholder="Search name, phone, car, pickup, drop"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-small" onClick={() => api.downloadCsv().catch((e) => setError(e.message))}>Export CSV</button>
      </div>

      <div className="tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={`tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? <p className="muted">Loading...</p> : null}
      {!loading && !items.length && !error ? <p className="muted">No inquiries here yet.</p> : null}

      {items.map((it) => (
        <InquiryCard key={it.id} it={it} onChanged={load} />
      ))}
    </>
  );
}

function InquiryCard({ it, onChanged }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  const wa = `https://wa.me/91${it.phone}?text=${encodeURIComponent(`Hi ${it.name}, thanks for your car booking inquiry!`)}`;

  async function patch(data) {
    setErr('');
    try {
      await api.updateInquiry(it.id, data);
      onChanged();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function loadNotes() {
    try {
      setNotes((await api.listNotes(it.id)).notes);
    } catch (e) {
      setErr(e.message);
    }
  }

  function toggle() {
    if (!open) loadNotes();
    setOpen(!open);
  }

  async function addNote(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await api.addNote(it.id, text.trim());
      setText('');
      loadNotes();
      onChanged();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete inquiry from ${it.name}?`)) return;
    try {
      await api.deleteInquiry(it.id);
      onChanged();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className={`inq ${it.status === 'new' ? 'inq-new' : ''}`}>
      <div className="inq-head">
        <div>
          <strong>{it.name}</strong>
          <div className="muted">{it.phone}{it.email ? ` · ${it.email}` : ''}</div>
          <div className="muted small">{toLocal(it.created_at)} · {it.source}</div>
        </div>
        <span className={`badge badge-${it.status}`}>{STATUS_LABELS[it.status]}</span>
      </div>

      <div className="trip">
        <div className="trip-car">
          {it.car_name ? (
            <>
              <strong>{it.car_name}</strong> <span className="muted">({it.car_type})</span>
              {it.car_rate != null && <span className="trip-rate"> &#8377;{it.car_rate}/km</span>}
            </>
          ) : (
            <span className="muted">No car chosen</span>
          )}
        </div>
        <div>
          <span className="trip-tag">{tripLabel(it.trip_type)}</span>
          {it.pickup}{it.drop ? ` → ${it.drop}` : ''}
        </div>
        <div className="muted small">
          {it.travel_date ? `Travel: ${fmtDay(it.travel_date)}` : 'Date not given'}
          {it.passengers ? ` · ${it.passengers} passenger${it.passengers > 1 ? 's' : ''}` : ''}
        </div>
      </div>

      {it.message && <p className="inq-msg">{it.message}</p>}

      <div className="inq-actions">
        <a className="btn btn-call btn-small" href={`tel:+91${it.phone}`}>Call</a>
        <a className="btn btn-wa btn-small" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        {it.email && <a className="btn btn-small" href={`mailto:${it.email}`}>Email</a>}
      </div>

      <div className="inq-controls">
        <label>
          Status
          <select value={it.status} onChange={(e) => patch({ status: e.target.value })}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Follow-up date
          <input
            type="date"
            value={it.follow_up_date || ''}
            onChange={(e) =>
              patch({
                follow_up_date: e.target.value || null,
                ...(e.target.value && it.status === 'new' ? { status: 'follow_up' } : {}),
              })
            }
          />
        </label>
      </div>

      {err && <p className="error">{err}</p>}

      <button className="link" onClick={toggle}>
        {open ? 'Hide notes' : `Notes${it.note_count ? ` (${it.note_count})` : ''}`}
      </button>

      {open && (
        <div className="notes">
          <form onSubmit={addNote} className="note-form">
            <input placeholder="Add a note, e.g. called, quoted Rs 4500, will confirm Friday" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
            <button className="btn btn-small btn-primary">Add</button>
          </form>
          {notes.map((n) => (
            <div className="note" key={n.id}>
              <div>{n.note}</div>
              <div className="muted small">{toLocal(n.created_at)}</div>
            </div>
          ))}
          <button className="link danger" onClick={remove}>Delete this inquiry</button>
        </div>
      )}
    </div>
  );
}
