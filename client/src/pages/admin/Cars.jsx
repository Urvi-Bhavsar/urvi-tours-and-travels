import { useEffect, useRef, useState } from 'react';
import { api, assetUrl } from '../../api.js';

// Shrink a phone photo to ~800px wide JPEG so it is small enough to store (~100 KB)
function resizeImage(file, maxW = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image. Try a JPG or PNG photo.'));
    };
    img.src = url;
  });
}

const blank = {
  name: '',
  is_ac: true,
  seats: '4',
  rate_per_km: '',
  rate_per_km_non_ac: '',
  driver_batta_per_day: '',
  min_km_per_day: '',
  description: '',
  active: true,
};

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const formTop = useRef(null);

  async function load() {
    setError('');
    try {
      setCars((await api.adminCars()).cars);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openForm(id) {
    setEditing(id);
    setTimeout(() => formTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function toggleActive(car) {
    try {
      await api.updateCar(car.id, { active: !car.active });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(car) {
    if (!window.confirm(`Delete ${car.name}? Old inquiries keep the car name and rate.`)) return;
    try {
      await api.deleteCar(car.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="row-between">
        <p className="muted">Cars shown on your public page with AC / Non-AC pricing and driver allowance.</p>
        <button className="btn btn-small btn-primary" onClick={() => openForm('new')}>+ Add car</button>
      </div>

      <div ref={formTop} />
      {editing && (
        <CarForm
          key={editing}
          car={editing === 'new' ? null : cars.find((c) => c.id === editing)}
          onCancel={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !cars.length && !error && <p className="muted">No cars yet. Tap "Add car" to add your first one.</p>}

      {cars.map((c) => {
        const rate = c.is_ac ? c.rate_per_km : c.rate_per_km_non_ac || c.rate_per_km;
        return (
          <div className={`car-row-admin ${c.active ? '' : 'inactive'}`} key={c.id}>
            {c.image_url ? (
              <img className="thumb" src={assetUrl(c.image_url)} alt="" />
            ) : (
              <div className="thumb thumb-empty">{c.is_ac ? 'AC' : 'N'}</div>
            )}
            <div className="car-info">
              <strong>{c.name}</strong>
              <div className="muted small">
                {c.is_ac ? 'AC' : 'Non-AC'} · {c.seats} seats{c.min_km_per_day ? ` · min ${c.min_km_per_day} km/day` : ''}
              </div>
              <div className="car-price">
                &#8377;{rate}/km
                {c.driver_batta_per_day ? ` · driver ₹${c.driver_batta_per_day}/day` : ''}
                {!c.active && <span className="badge badge-closed">Hidden</span>}
              </div>
            </div>
            <div className="car-actions">
              <button className="btn btn-small" onClick={() => openForm(c.id)}>Edit</button>
              <button className="btn btn-small" onClick={() => toggleActive(c)}>{c.active ? 'Hide' : 'Show'}</button>
              <button className="btn btn-small danger-btn" onClick={() => remove(c)}>Delete</button>
            </div>
          </div>
        );
      })}
    </>
  );
}

function CarForm({ car, onCancel, onSaved }) {
  const [f, setF] = useState(
    car
      ? {
          name: car.name,
          is_ac: !!car.is_ac,
          seats: String(car.seats),
          rate_per_km: String(car.rate_per_km ?? ''),
          rate_per_km_non_ac: String(car.rate_per_km_non_ac ?? ''),
          driver_batta_per_day: String(car.driver_batta_per_day ?? ''),
          min_km_per_day: car.min_km_per_day ? String(car.min_km_per_day) : '',
          description: car.description || '',
          active: car.active,
        }
      : blank
  );
  const [img, setImg] = useState({ preview: car?.image_url ? assetUrl(car.image_url) : null, changed: false, data: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function pickImage(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    try {
      const data = await Promise.all(files.map((file) => resizeImage(file)));
      setImg({ preview: data[0], changed: true, data });
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  }

  async function save(e) {
    e.preventDefault();
    setError('');

    const rate = Number(f.rate_per_km);
    const nonAcRate = Number(f.rate_per_km_non_ac || 0);
    if (!Number.isFinite(rate) || rate < 0) return setError('Enter a valid AC rate per km');
    if (f.rate_per_km_non_ac && (!Number.isFinite(nonAcRate) || nonAcRate < 0)) return setError('Enter a valid non-AC rate per km');

    const payload = {
      name: f.name,
      is_ac: Boolean(f.is_ac),
      seats: Number(f.seats) || 4,
      rate_per_km: rate,
      rate_per_km_non_ac: f.rate_per_km_non_ac ? nonAcRate : 0,
      driver_batta_per_day: f.driver_batta_per_day ? Number(f.driver_batta_per_day) : 0,
      min_km_per_day: f.min_km_per_day ? Number(f.min_km_per_day) : null,
      description: f.description,
      active: f.active,
    };
    if (img.changed) {
      payload.photos = img.data;
      payload.image = img.data[0] || null;
    }

    setBusy(true);
    try {
      if (car) await api.updateCar(car.id, payload);
      else await api.createCar(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form car-form" onSubmit={save}>
      <h3>{car ? 'Edit car' : 'Add a car'}</h3>

      <label>
        Car name
        <input required minLength={2} maxLength={100} value={f.name} onChange={set('name')} placeholder="e.g. Swift Dzire" />
      </label>

      <div className="two">
        <label>
          Category
          <select value={f.is_ac ? 'ac' : 'non_ac'} onChange={(e) => setF({ ...f, is_ac: e.target.value === 'ac' })}>
            <option value="ac">AC</option>
            <option value="non_ac">Non-AC</option>
          </select>
        </label>
        <label>
          Seats
          <input type="number" inputMode="numeric" min={1} max={60} required value={f.seats} onChange={set('seats')} />
        </label>
      </div>

      <div className="two">
        <label>
          AC rate per km (&#8377;)
          <input type="number" inputMode="decimal" step="0.5" min={0} required value={f.rate_per_km} onChange={set('rate_per_km')} placeholder="e.g. 12" />
        </label>
        <label>
          Non-AC rate per km (&#8377;)
          <input type="number" inputMode="decimal" step="0.5" min={0} value={f.rate_per_km_non_ac} onChange={set('rate_per_km_non_ac')} placeholder="e.g. 9" />
        </label>
      </div>

      <div className="two">
        <label>
          Driver allowance per day (&#8377;)
          <input type="number" inputMode="decimal" step="0.5" min={0} value={f.driver_batta_per_day} onChange={set('driver_batta_per_day')} placeholder="e.g. 500" />
        </label>
        <label>
          Min km per day (optional)
          <input type="number" inputMode="numeric" min={0} value={f.min_km_per_day} onChange={set('min_km_per_day')} placeholder="e.g. 250" />
        </label>
      </div>

      <label>
        Short description (optional)
        <textarea rows={2} maxLength={500} value={f.description} onChange={set('description')} placeholder="4 bags, full-time driver, air conditioning..." />
      </label>

      <div className="photo-field">
        <span className="label-text">Photos (optional)</span>
        {img.preview && <img className="photo-preview" src={img.preview} alt="Car preview" />}
        <div className="photo-btns">
          <label className="btn btn-small file-btn">
            {img.preview ? 'Add more photos' : 'Choose photos'}
            <input type="file" accept="image/*" multiple onChange={pickImage} hidden />
          </label>
          {img.preview && (
            <button type="button" className="btn btn-small" onClick={() => setImg({ preview: null, changed: true, data: [] })}>
              Remove photos
            </button>
          )}
        </div>
      </div>

      <label className="check">
        <input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
        Show this car on the public page
      </label>

      {error && <p className="error">{error}</p>}
      <div className="form-btns">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : car ? 'Save changes' : 'Add car'}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
