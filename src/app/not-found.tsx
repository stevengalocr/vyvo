import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="system-page">
      <span className="eyebrow">404 · Fuera de transmisión</span>
      <h1>Esa idea todavía no vive acá.</h1>
      <p>Origins 007 tampoco tiene una ruta: está reservado intencionalmente.</p>
      <Link className="button button--dark" href="/catalogo">Volver al catálogo</Link>
    </section>
  );
}
