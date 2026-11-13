import { Link } from 'react-router-dom';
import { assetUrl } from '../api.js';

export default function CarCard({ car }) {
  return (
    <article className="car-card">
      <Link to={`/cars/${car.id}`} className="car-img-link" aria-label={`${car.name} details`}>
        {car.image_url ? (
          <img className="car-img" src={assetUrl(car.image_url)} alt={car.name} loading="lazy" />
        ) : (
          <div className="car-img car-img-empty">{car.is_ac ? 'AC' : 'Non-AC'}</div>
        )}
      </Link>
      <div className="car-body">
        <div className="car-row">
          <h3>{car.name}</h3>
          <span className="car-type">{car.is_ac ? 'AC' : 'Non-AC'}</span>
        </div>
        <div className="car-rate">
          <strong>&#8377;{car.is_ac ? car.rate_per_km : car.rate_per_km_non_ac || car.rate_per_km}</strong>/km
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
