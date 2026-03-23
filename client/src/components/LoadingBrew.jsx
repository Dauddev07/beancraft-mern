/**
 * Branded loading state for menu and account views.
 */
function LoadingBrew({ message = "Brewing the menu…", className = "" }) {
  return (
    <div
      className={`loading-brew ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-brew__visual" aria-hidden="true">
        <span className="loading-brew__steam loading-brew__steam--1" />
        <span className="loading-brew__steam loading-brew__steam--2" />
        <span className="loading-brew__steam loading-brew__steam--3" />
        <span className="loading-brew__cup" />
      </div>
      <p className="loading-brew__text">{message}</p>
    </div>
  );
}

export default LoadingBrew;
