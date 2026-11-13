import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import { usePageMeta } from '../../hooks.js';
import CarCard from '../../components/CarCard.jsx';

export default function Cars() {
  usePageMeta('Our cars and rates - Urvi Tours & Travells');
  const [cars, setCars] = useState([]);
  const [state, setState] = useState('loading'); // loading | ready | error
  useEffect(() => {
    api
      .listCars()
      .then((d) => {
        setCars(d.cars);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const visible = cars;

  return (
    <section className="section">
      <h2>Our cars</h2>
      <p className="muted">Rates are per km. Tap a car to see details or book it.</p>

      {state === 'loading' && <p className="muted">Loading cars...</p>}
      {state === 'error' && <p className="muted">Could not load cars right now. Please try again, or call us.</p>}
      {state === 'ready' && !cars.length && <p className="muted">Cars will be listed here soon. Call us for rates.</p>}

      <div className="cars">
        {visible.map((c) => (
          <CarCard key={c.id} car={c} />
        ))}
      </div>

      {cars.length > 0 && (
        <p className="privacy left">Final fare depends on distance, tolls, parking and driver allowance. We will confirm on call.</p>
      )}
    </section>
  );
}
