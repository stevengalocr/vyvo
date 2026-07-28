import Image from "next/image";
import Link from "next/link";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
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
