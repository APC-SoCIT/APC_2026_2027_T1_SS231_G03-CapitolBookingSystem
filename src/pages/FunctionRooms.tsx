import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const GALLERY_SLIDES = [
  "Private Dining Room",
  "Event Setup",
  "Banquet Arrangement",
];
const rooms = [
  {
    title: "Private Dining Room",
    detail:
      "An intimate space for up to 30 guests. Perfect for board meetings, small family celebrations, birthdays, baptisms, or private dinners."
  }
];
const amenities = [
  "Tables & Chairs",
  "Air Conditioning",
  "Sound System",
  "Projector & Screen",
  "Event Coordination",
  "Parking Space",
];

export function FunctionRooms() {
  const [galleryIndex, setGalleryIndex] = useState(0);

  return (
    <div className="function-rooms-page">
      <section className="fr-landing-hero" aria-labelledby="function-rooms-title">
        <div className="fr-landing-hero__content">
          <p className="fr-kicker">Private events at Capitol</p>
          <h1 id="function-rooms-title">Celebrate at Capitol.</h1>
          <p className="fr-landing-hero__intro">
            Birthdays, debuts, gatherings, hosted in our function rooms in our
            main branch.
          </p>
          <div className="fr-landing-hero__actions">
            <Link
              className="button button--red fr-primary-cta"
              to="/function-rooms/reserve"
            >
              <CalendarDays size={17} /> Reserve a room <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div
          className="fr-landing-hero__visual"
          role="img"
          aria-label="Function room photo placeholder"
        />
      </section>

      <section className="section fr-gallery-section" aria-labelledby="fr-gallery-title">
        <div className="fr-gallery-header">
          <h2 id="fr-gallery-title">Inside our rooms.</h2>
          <p>Take a look around before you book.</p>
        </div>
        <div className="fr-gallery">
          <div className="fr-gallery__viewport">
            <div
              className="fr-gallery__track"
              style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
            >
              {GALLERY_SLIDES.map((label, index) => (
                <div
                  className="fr-gallery__slide"
                  key={label}
                  role="img"
                  aria-label={`${label} — photo placeholder`}
                  aria-hidden={index !== galleryIndex}
                />
              ))}
            </div>
          </div>
          <div className="fr-gallery__controls">
            <button
              aria-label="Previous photo"
              onClick={() =>
                setGalleryIndex(
                  (current) =>
                    (current - 1 + GALLERY_SLIDES.length) % GALLERY_SLIDES.length,
                )
              }
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="fr-gallery__dots">
              {GALLERY_SLIDES.map((label, index) => (
                <button
                  aria-label={`Show photo ${index + 1} of ${GALLERY_SLIDES.length}: ${label}`}
                  className={
                    index === galleryIndex
                      ? "fr-gallery__dot fr-gallery__dot--active"
                      : "fr-gallery__dot"
                  }
                  key={label}
                  onClick={() => setGalleryIndex(index)}
                  type="button"
                />
              ))}
            </div>
            <button
              aria-label="Next photo"
              onClick={() =>
                setGalleryIndex((current) => (current + 1) % GALLERY_SLIDES.length)
              }
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="section fr-info-section" aria-labelledby="fr-info-title">
        <h2 className="content-heading" id="fr-info-title">
          About Our Rooms
        </h2>
        {rooms.map((room) => (
          <article className="room-card" key={room.title}>
            <div
              className="room-card__media"
              role="img"
              aria-label={`${room.title} — photo placeholder`}
            />
            <h3>{room.title}</h3>
            <p>{room.detail}</p>
            <div
              className="room-card__media room-card__media--plan"
              role="img"
              aria-label={`${room.title} floor plan placeholder`}
            />
          </article>
        ))}
        <div className="amenities-card">
          <h3>Included Amenities</h3>
          <ul>
            {amenities.map((item) => (
              <li key={item}>
                <Check size={15} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
