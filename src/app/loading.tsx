export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span aria-hidden="true">V</span>
      <p>La señal está tomando forma…</p>
    </div>
  );
}
