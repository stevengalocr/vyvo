import Link from "next/link";
import { BrandMark } from "./brand-mark";

const groups = [
  {
    title: "Descubrir",
    links: [
      ["Catálogo", "/catalogo"],
      ["Personalizar", "/personalizar"],
      ["Drops", "/drops"],
      ["Carrito", "/carrito"],
    ],
  },
  {
    title: "Crear",
    links: [
      ["Personalizar", "/personalizar"],
      ["SHIFT", "/personalizar/vyvo-shift"],
      ["ARENA", "/personalizar/vyvo-arena"],
      ["NEXO", "/personalizar/vyvo-nexo"],
    ],
  },
  {
    title: "Información",
    links: [
      ["Seguir mi pedido", "/rastreo"],
      ["Cuidados", "/cuidados"],
      ["Políticas", "/politicas"],
      ["Privacidad", "/privacidad"],
      ["Términos", "/terminos"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <BrandMark inverse />
          <p>Figuras, personajes y recuerdos hechos VYVO.</p>
          <span>Diseñado y terminado en Costa Rica.</span>
        </div>
        {groups.map((group) => (
          <div key={group.title} className="footer__group">
            <h2>{group.title}</h2>
            {group.links.map(([label, href]) => (
              <Link href={href} key={href} prefetch={false}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} VYVO. Todos los derechos reservados.</p>
        <p>Los productos mostrados son renders conceptuales en desarrollo.</p>
        <p className="footer__credit">
          Un producto de{" "}
          <a
            href="https://galodev.com"
            target="_blank"
            rel="noopener noreferrer author"
          >
            GaloDev
          </a>
        </p>
      </div>
    </footer>
  );
}
