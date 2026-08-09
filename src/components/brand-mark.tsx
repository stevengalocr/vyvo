import Image from "next/image";
import Link from "next/link";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      // Sin prefetch: el logo aparece en el header y en el footer de todas las rutas,
      // así que Next se traía el RSC del home en cada página — 155 KB por una vuelta
      // atrás que casi nadie da desde el propio home.
      prefetch={false}
      className={`brand-mark${inverse ? " brand-mark--inverse" : ""}`}
      aria-label="VYVO, página de inicio"
    >
      <Image
        src="/brand/vyvo-mark-placeholder.svg"
        alt=""
        width={38}
        height={38}
        priority
      />
      <span aria-hidden="true">VYVO</span>
    </Link>
  );
}
