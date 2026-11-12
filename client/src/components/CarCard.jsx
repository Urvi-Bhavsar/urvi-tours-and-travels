import { Link } from 'react-router-dom';
import { assetUrl } from '../api.js';

export default function CarCard({ car }) {
  return (
    <article className="car-card">
      <Link to={`/cars/${car.id}`} className="car-img-link" aria-label={`${car.name} details`}>
        {car.image_url ? (
          <img className="car-img" src={assetUrl(car.image_url)} alt={car.name} loading="lazy" />
        ) : (
          <div className="car-img car-img-empty">{car.type}</div>
        )}
      </Link>
      <div className="car-body">
        <div className="car-row">
          <h3>{car.name}</h3>
          <span className="car-type">{car.type}</span>
        </div>
        <div className="car-rate">
          <strong>&#8377;{car.rate_per_km}</strong>/km
        </div>
        <div className="muted small">
          {car.seats} seats{car.min_km_per_day ? ` · min ${car.min_km_per_day} km/day` : ''}
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
