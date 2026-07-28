"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="system-page">
      <span className="eyebrow">Señal interrumpida</span>
      <h1>Algo no terminó de cobrar vida.</h1>
      <p>Podés intentar de nuevo. Si continúa, no se guardó ninguna acción incompleta.</p>
      <button type="button" className="button button--dark" onClick={() => reset()}>
        Reintentar
      </button>
    </section>
  );
}
