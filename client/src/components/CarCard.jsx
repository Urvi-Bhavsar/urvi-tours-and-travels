import { Link } from 'react-router-dom';
import { assetUrl } from '../api.js';

export default function CarCard({ car }) {
  const primaryPhoto = car.image_url || car.photos?.[0] || null;

  return (
    <article className="car-card">
      <Link to={`/cars/${car.id}`} className="car-img-link" aria-label={`${car.name} details`}>
        {primaryPhoto ? (
          <div className="car-collage">
            <img className="car-collage-photo car-collage-photo-main" src={assetUrl(primaryPhoto)} alt={car.name} loading="lazy" />
          </div>
        ) : (
          <div className="car-img car-img-empty">{car.is_ac ? 'AC' : 'Non-AC'}</div>
        )}
      </Link>
      <div className="car-body">
        <div className="car-row">
          <h3>{car.name}</h3>
        </div>
        <div className="car-rate">
          {car.rate_per_km ? <div><strong>&#8377;{car.rate_per_km}</strong>/km <span className="muted small">AC</span></div> : null}
          {car.rate_per_km_non_ac ? (
            <div><strong>&#8377;{car.rate_per_km_non_ac}</strong>/km <span className="muted small">Non-AC</span></div>
          ) : (
            car.rate_per_km ? <div><strong>&#8377;{car.rate_per_km}</strong>/km <span className="muted small">Non-AC</span></div> : null
          )}
        </div>
        <div className="muted small">
          {car.seats} seats{car.min_km_per_day ? ` · min ${car.min_km_per_day} km/day` : ''}
          {car.driver_batta_per_day ? ` · driver ₹${car.driver_batta_per_day}/day` : ''}
        </div>
        {car.description && <p className="car-desc">{car.description}</p>}
        <div className="car-btns">
          <Link className="btn btn-primary" to={`/book?car=${car.id}`}>Book this car</Link>
          <Link className="btn" to={`/cars/${car.id}`}>Details</Link>
        </div>
      </div>
    </article>
  );
}
