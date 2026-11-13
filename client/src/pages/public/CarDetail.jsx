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

  if (state === 'loading')
    return (
      <section className="section">
        <div className="inline-loader" aria-label="Loading car details">
          <span className="spinner" />
        </div>
      </section>
    );
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

  const primaryPhoto = car.image_url || car.photos?.[0] || null;
  const secondaryPhotos = (car.photos || []).filter((photo) => photo !== primaryPhoto).slice(0, 4);
  const acRate = car.rate_per_km ?? 0;
  const nonAcRate = car.rate_per_km_non_ac ?? acRate;

  return (
    <section className="section detail">
      <Link className="link-inline" to="/cars">&larr; All cars</Link>
      <div className="detail-gallery">
        {primaryPhoto ? (
          <>
            <img className="detail-img detail-img-main" src={assetUrl(primaryPhoto)} alt={car.name} />
            {secondaryPhotos.length > 0 && (
              <div className="detail-subgallery">
                {secondaryPhotos.map((photo, index) => (
                  <img key={`${car.id}-detail-${index}`} className="detail-img detail-img-thumb" src={assetUrl(photo)} alt={`${car.name} ${index + 2}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="detail-img car-img-empty">{car.is_ac ? 'AC' : 'Non-AC'}</div>
        )}
      </div>
      <div className="car-row">
        <h2>{car.name}</h2>
      </div>
      <div className="detail-rates">
        <div className="rate-line"><strong>&#8377;{acRate}</strong>/km  AC</div>
        <div className="rate-line"><strong>&#8377;{nonAcRate}</strong>/km Non-AC</div>
      </div>
      <ul className="facts">
        <li>{car.seats} seats</li>
        {car.min_km_per_day ? <li>Minimum {car.min_km_per_day} km per day</li> : null}
        {car.driver_batta_per_day ? <li>Driver allowance: ₹{car.driver_batta_per_day}/day</li> : null}
      </ul>
      {car.description && <p>{car.description}</p>}
      <p className="detail-note">Tolls and parking are extra and not included in the fare. Final fare depends on distance and driver allowance. We will confirm on call.</p>
      <Link className="btn btn-primary btn-wide" to={`/book?car=${car.id}`}>Book this car</Link>
    </section>
  );
}
