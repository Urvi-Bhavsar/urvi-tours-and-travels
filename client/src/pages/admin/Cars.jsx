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
      {loading && (
        <div className="inline-loader" aria-label="Loading">
          <span className="spinner" />
        </div>
      )}
      {!loading && !cars.length && !error && <p className="muted">No cars yet. Tap "Add car" to add your first one.</p>}

      {cars.map((c) => {
        const rate = c.is_ac ? c.rate_per_km : c.rate_per_km_non_ac || c.rate_per_km;
        const primaryPhoto = c.image_url || c.photos?.[0] || null;

        return (
          <div className={`car-row-admin ${c.active ? '' : 'inactive'}`} key={c.id}>
            {primaryPhoto ? (
              <div className="thumb-collage">
                <img className="thumb thumb-photo thumb-photo-main" src={assetUrl(primaryPhoto)} alt="" />
              </div>
            ) : (
              <div className="thumb thumb-empty">{c.is_ac ? 'AC' : 'N'}</div>
            )}
            <div className="car-info">
              <strong>{c.name}</strong>
              <div className="muted small">
                {c.seats} seats{c.min_km_per_day ? ` · min ${c.min_km_per_day} km/day` : ''}
              </div>
              <div className="car-price">
                {c.rate_per_km ? <>₹{c.rate_per_km}/km <span className="muted small">AC</span></> : null}
                {c.rate_per_km_non_ac ? <>
                  {c.rate_per_km ? ' · ' : ''}₹{c.rate_per_km_non_ac}/km <span className="muted small">Non-AC</span>
                </> : null}
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
  const [img, setImg] = useState({
    primary: car?.image_url ? assetUrl(car.image_url) : null,
    gallery: car?.photos?.length ? car.photos.filter((p) => p !== car.image_url).map((p) => assetUrl(p)) : [],
    primaryData: car?.image_url ? car.image_url : null,
    galleryData: car?.photos?.length ? car.photos.filter((p) => p !== car.image_url) : [],
    primaryChanged: false,
    galleryChanged: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function removePrimaryPhoto() {
    setImg((prev) => ({ ...prev, primary: null, primaryData: null, primaryChanged: true }));
  }

  function removeGalleryPhoto(index) {
    setImg((prev) => {
      const nextGallery = prev.gallery.filter((_, i) => i !== index);
      const nextGalleryData = prev.galleryData.filter((_, i) => i !== index);
      return { ...prev, gallery: nextGallery, galleryData: nextGalleryData, galleryChanged: true };
    });
  }

  async function pickPrimaryImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const data = await resizeImage(file);
      setImg((prev) => ({ ...prev, primary: data, primaryData: data, primaryChanged: true }));
    } catch (err) {
      setError(err.message);
    }
    e.target.value = '';
  }

  async function pickGalleryImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');
    try {
      const data = await Promise.all(files.map((file) => resizeImage(file)));
      setImg((prev) => ({
        ...prev,
        gallery: [...prev.gallery, ...data],
        galleryData: [...prev.galleryData, ...data],
        galleryChanged: true,
      }));
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

    const isAc = !f.rate_per_km_non_ac || Number(f.rate_per_km_non_ac) === 0;
    const payload = {
      name: f.name,
      is_ac: isAc,
      seats: Number(f.seats) || 4,
      rate_per_km: rate,
      rate_per_km_non_ac: f.rate_per_km_non_ac ? nonAcRate : 0,
      driver_batta_per_day: f.driver_batta_per_day ? Number(f.driver_batta_per_day) : 0,
      min_km_per_day: f.min_km_per_day ? Number(f.min_km_per_day) : null,
      description: f.description,
      active: f.active,
    };
    if (img.primaryChanged) {
      payload.image = img.primaryData || null;
    }
    if (img.galleryChanged) {
      payload.photos = img.galleryData;
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
          Seats
          <input type="number" inputMode="numeric" min={1} max={60} required value={f.seats} onChange={set('seats')} />
        </label>
        <div />
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
        <div className="photo-panel">
          <span className="label-text">Primary photo</span>
          {img.primary ? (
            <div className="photo-tile photo-tile-primary">
              <img className="photo-preview photo-preview-primary" src={img.primary} alt="Primary car preview" />
              <button type="button" className="photo-remove photo-remove-primary" onClick={removePrimaryPhoto} aria-label="Remove primary photo">×</button>
            </div>
          ) : (
            <div className="photo-empty-box">
              <span>No primary photo selected</span>
            </div>
          )}

          {img.primary && (
            <label className="btn btn-small file-btn compact-btn">
              Change primary photo
              <input type="file" accept="image/*" onChange={pickPrimaryImage} hidden />
            </label>
          )}
          {!img.primary && (
            <label className="btn btn-small file-btn compact-btn">
              Choose primary photo
              <input type="file" accept="image/*" onChange={pickPrimaryImage} hidden />
            </label>
          )}
        </div>

        <div className="photo-panel">
          <span className="label-text">Gallery photos</span>
          {img.gallery.length > 0 && (
            <div className="multi-photo-preview">
              {img.gallery.map((src, index) => (
                <div key={`${src}-${index}`} className="photo-tile">
                  <img className="photo-preview" src={src} alt={`Car gallery ${index + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => removeGalleryPhoto(index)}
                    aria-label={`Remove gallery photo ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {!img.gallery.length && (
            <div className="photo-empty-box photo-empty-box-small">
              <span>No gallery photos yet</span>
            </div>
          )}
          <div className="photo-btns">
            <label className="btn btn-small file-btn">
              Add gallery photos
              <input type="file" accept="image/*" multiple onChange={pickGalleryImages} hidden />
            </label>
            {img.gallery.length > 0 && (
              <button type="button" className="btn btn-small" onClick={() => setImg((prev) => ({ ...prev, gallery: [], galleryData: [], galleryChanged: true }))}>
                Clear gallery
              </button>
            )}
          </div>
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
