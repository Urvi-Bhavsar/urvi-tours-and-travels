import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, assetUrl } from '../../api.js';
import { usePageMeta } from '../../hooks.js';

export default function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing | error
  usePageMeta(car ? `${car.name} - Urvi Tours & Travells` : 'Car - Urvi Tours & Travells');

  useEffect(() => {
    setState('loading');
    api
      .getCar(id)
      .then((d) => {
        setCar(d.car);
        setState('ready');
      })
      .catch((e) => setState(/not found/i.test(e.message) ? 'missing' : 'error'));
  }, [id]);

  if (state === 'loading') return <p className="muted section">Loading...</p>;
  if (state === 'missing')
    return (
      <section className="section">
        <h2>Car not found</h2>
        <p className="muted">This car is no longer available.</p>
        <Link className="btn btn-primary spaced" to="/cars">See other cars</Link>
      </section>
    );
  if (state === 'error')
    return (
      <section className="section">
        <h2>Something went wrong</h2>
        <p className="muted">Could not load this car. Please try again, or call us.</p>
        <Link className="btn spaced" to="/cars">Back to cars</Link>
      </section>
    );

  return (
    <section className="section detail">
      <Link className="link-inline" to="/cars">&larr; All cars</Link>
      {car.image_url ? (
        <img className="detail-img" src={assetUrl(car.image_url)} alt={car.name} />
      ) : (
        <div className="detail-img car-img-empty">{car.type}</div>
      )}
      <div className="car-row">
        <h2>{car.name}</h2>
        <span className="car-type">{car.type}</span>
      </div>
      <div className="car-rate">
        <strong>&#8377;{car.rate_per_km}</strong>/km
      </div>
      <ul className="facts">
        <li>{car.seats} seats</li>
        {car.min_km_per_day ? <li>Minimum {car.min_km_per_day} km per day</li> : null}
      </ul>
      {car.description && <p>{car.description}</p>}
      <p className="privacy left">Final fare depends on distance, tolls, parking and driver allowance. We will confirm on call.</p>
      <Link className="btn btn-primary btn-wide" to={`/book?car=${car.id}`}>Book this car</Link>
    </section>
  );
}
