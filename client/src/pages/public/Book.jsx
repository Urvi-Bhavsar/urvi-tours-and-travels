import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import { tripTypes } from '../../config.js';
import { usePageMeta } from '../../hooks.js';

// ?utm_source=instagram in your bio link is saved as the inquiry source.
// Read once at load and kept in session storage, because moving between pages drops the query string.
function readSource() {
  const fromUrl = new URLSearchParams(window.location.search).get('utm_source');
  try {
    if (fromUrl) sessionStorage.setItem('utm_source', fromUrl);
    return fromUrl || sessionStorage.getItem('utm_source') || 'direct';
  } catch {
    return fromUrl || 'direct';
  }
}
const source = readSource();

// Today's date in India as YYYY-MM-DD (for the date picker's minimum)
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

export default function Book() {
  usePageMeta('Book a car - Urvi Tours & Travells');
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({
    name: '', phone: '', trip_type: 'one_way', pickup: '', drop: '',
    travel_date: '', passengers: '', car_id: params.get('car') || '', message: '', website: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listCars()
      .then((d) => {
        setCars(d.cars);
        // a car id from the link that is hidden or deleted should not be sent
        setForm((f) => (f.car_id && !d.cars.some((c) => c.id === f.car_id) ? { ...f, car_id: '' } : f));
      })
      .catch(() => {}); // the form still works without the car list ("suggest me one")
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.submitInquiry({
        name: form.name,
        phone: form.phone,
        trip_type: form.trip_type,
        pickup: form.pickup,
        drop: form.trip_type === 'local' ? undefined : form.drop,
        travel_date: form.travel_date || undefined,
        passengers: form.passengers ? Number(form.passengers) : undefined,
        car_id: form.car_id || undefined,
        message: form.message || undefined,
        website: form.website,
        source,
      });
      const car = cars.find((c) => c.id === form.car_id);
      navigate('/thank-you', { replace: true, state: { car: car?.name || null } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <h2>Book or ask for a quote</h2>
      <form onSubmit={submit} className="form">
        {/* honeypot: hidden from people, bots fill it */}
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={set('website')}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hp"
        />

        <label>
          Car
          <select value={form.car_id} onChange={set('car_id')}>
            <option value="">Not sure - suggest me one</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Type of booking
          <select value={form.trip_type} onChange={set('trip_type')}>
            {tripTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>

        <label>
          Pickup location
          <input required minLength={2} maxLength={200} value={form.pickup} onChange={set('pickup')} placeholder="City, area or address" />
        </label>

        {form.trip_type !== 'local' && (
          <label>
            {form.trip_type === 'airport' ? 'Drop location (or airport)' : 'Drop location'}
            <input required minLength={2} maxLength={200} value={form.drop} onChange={set('drop')} placeholder="Where do you want to go?" />
          </label>
        )}

        <div className="two">
          <label>
            Travel date
            <input type="date" min={today} value={form.travel_date} onChange={set('travel_date')} />
          </label>
          <label>
            Passengers
            <input type="number" inputMode="numeric" min={1} max={60} value={form.passengers} onChange={set('passengers')} placeholder="e.g. 4" />
          </label>
        </div>

        <label>
          Your name
          <input required minLength={2} maxLength={100} value={form.name} onChange={set('name')} autoComplete="name" />
        </label>
        <label>
          Mobile number
          <input
            required
            type="tel"
            inputMode="numeric"
            placeholder="98765 43210"
            value={form.phone}
            onChange={set('phone')}
            autoComplete="tel"
          />
        </label>
        <label>
          Message (optional)
          <textarea rows={3} maxLength={2000} placeholder="Return date, luggage, any special request..." value={form.message} onChange={set('message')} />
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending...' : 'Send inquiry'}</button>
        <p className="privacy">We only use your details to contact you about your booking.</p>
      </form>
    </section>
  );
}
