import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { profile, tripTypes } from '../../config.js';
import { usePageMeta } from '../../hooks.js';
import CarCard from '../../components/CarCard.jsx';

export default function Home() {
  usePageMeta(`${profile.name} - Car rental and outstation cabs`);
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

  return (
    <>
      <section className="hero">
        {profile.photo ? (
          <img className="avatar" src={profile.photo} alt={profile.name} />
        ) : (
          <div className="avatar avatar-text">{profile.initials}</div>
        )}
        <h1>{profile.name}</h1>
        <p className="tagline">{profile.tagline}</p>
        <p className="bio">{profile.bio}</p>
        <div className="hero-btns">
          <Link className="btn btn-primary" to="/book">Book a car</Link>
          <Link className="btn" to="/cars">View all cars</Link>
          <a className="btn btn-ig" href={profile.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Popular cars</h2>
          {cars.length > 3 && <Link className="link-inline" to="/cars">See all</Link>}
        </div>
        {state === 'loading' && <p className="muted">Loading cars...</p>}
        {state === 'error' && <p className="muted">Could not load cars right now. You can still call us or send an inquiry.</p>}
        {state === 'ready' && !cars.length && <p className="muted">Cars will be listed here soon. Call us for rates.</p>}
        <div className="cars">
          {cars.slice(0, 3).map((c) => (
            <CarCard key={c.id} car={c} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Types of booking</h2>
        <div className="chips wrap">
          {tripTypes.map((t) => (
            <Link key={t.value} className="chip" to="/book">{t.label}</Link>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <ol className="steps">
          <li><strong>Pick a car.</strong> See the rate per km for each car.</li>
          <li><strong>Send your trip details.</strong> Pickup, drop, date and passengers.</li>
          <li><strong>We call you back</strong> with the fare and confirm your booking.</li>
        </ol>
      </section>
    </>
  );
}
