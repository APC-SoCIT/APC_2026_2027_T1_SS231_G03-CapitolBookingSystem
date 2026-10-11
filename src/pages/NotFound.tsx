import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="placeholder-page">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <Link className="button button--red" to="/">
        Back to home
      </Link>
    </div>
  );
}
