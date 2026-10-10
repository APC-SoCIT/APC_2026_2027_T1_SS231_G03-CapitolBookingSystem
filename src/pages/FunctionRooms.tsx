import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignInModal } from "../components/common";
import { FUNCTION_ROOM_AMENITIES as amenities } from "../constants";
import { useAuth } from "../context/AuthContext";
import { useAuthGate } from "../hooks/useAuthGate";

const GALLERY_SLIDES = [
  { src: "/function-rooms/room1-01.jpg", label: "Stage and event setup" },
  { src: "/function-rooms/room1-02.jpg", label: "Main dining hall" },
  { src: "/function-rooms/room1-03.jpg", label: "Heritage wall" },
  { src: "/function-rooms/room1-04.jpg", label: "Stage and seating" },
  { src: "/function-rooms/room1-05.jpg", label: "Mural wall" },
  { src: "/function-rooms/room1-06.jpg", label: "Stage close-up" },
  { src: "/function-rooms/room2-01.jpg", label: "Celebrations at Capitol" },
  { src: "/function-rooms/room2-02.jpg", label: "Dinner gathering" },
  { src: "/function-rooms/room2-03.jpg", label: "Night at the hall" },
  { src: "/function-rooms/room2-04.jpg", label: "Videoke and dining" },
  { src: "/function-rooms/room2-05.jpg", label: "Group celebration" },
];

export function FunctionRooms() {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { closeSignIn, requireAuth, showSignIn } = useAuthGate();
  const [awaitingReserve, setAwaitingReserve] = useState(false);

  const handleReserve = () => {
    if (requireAuth()) {
      navigate("/function-rooms/reserve");
      return;
    }
    setAwaitingReserve(true);
  };

  // Guest hit "Reserve a room", signed in, closed the dialog: continue into
  // the reservation page instead of making them click again.
  const handleCloseSignIn = () => {
    const goToReserve = awaitingReserve && !!user;
    setAwaitingReserve(false);
    closeSignIn();
    if (goToReserve) navigate("/function-rooms/reserve");
  };

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
            <button
              className="button button--red fr-primary-cta"
              onClick={handleReserve}
              type="button"
            >
              <CalendarDays size={17} /> Reserve a room <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="fr-landing-hero__visual">
          <img
            src="/function-rooms/room1-02.jpg"
            alt="Capitol function room dining hall set for a celebration"
          />
        </div>
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
              {GALLERY_SLIDES.map((slide, index) => (
                <div
                  className="fr-gallery__slide"
                  key={slide.src}
                  aria-hidden={index !== galleryIndex}
                >
                  <img
                    src={slide.src}
                    alt={`${slide.label} at Capitol function rooms`}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
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
              {GALLERY_SLIDES.map((slide, index) => (
                <button
                  aria-label={`Show photo ${index + 1} of ${GALLERY_SLIDES.length}: ${slide.label}`}
                  className={
                    index === galleryIndex
                      ? "fr-gallery__dot fr-gallery__dot--active"
                      : "fr-gallery__dot"
                  }
                  key={slide.src}
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

      <section className="section fr-info-section" aria-labelledby="fr-amenities-title">
        <div className="amenities-card">
          <h3 id="fr-amenities-title">Included Amenities</h3>
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
      {showSignIn && <SignInModal onClose={handleCloseSignIn} />}
    </div>
  );
}
