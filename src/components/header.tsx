"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { primaryNavigation } from "@/lib/site";
import { BrandMark } from "./brand-mark";
import { useCart } from "./cart-provider";
import { Icon } from "./icon";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { hydrated, itemCount } = useCart();
  const pathname = usePathname();
  const darkHero = pathname === "/drops" && !scrolled && !open;
  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/catalogo" && pathname.startsWith("/producto/"));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  return (
    <header
      className={`site-header${scrolled || open ? " site-header--solid" : ""}${darkHero ? " site-header--dark" : ""}`}
    >
      <div className="site-header__inner">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Navegación principal">
          {primaryNavigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              prefetch={false}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="button button--small button--dark header-cta" href="/catalogo">
            Comprar
          </Link>
          <Link
            href="/carrito"
            prefetch={false}
            className="cart-link"
            // El número visible tiene que estar dentro del nombre accesible: si el
            // enlace muestra "0" y el label dice "Carrito vacío", quien navega por voz
            // dice "carrito vacío" y el comando no encuentra el control (WCAG 2.5.3).
            aria-label={`Carrito, ${hydrated ? itemCount : 0} ${
              (hydrated ? itemCount : 0) === 1 ? "producto" : "productos"
            }`}
          >
            <Icon name="cart" size={21} />
            <span aria-live="polite">{hydrated ? itemCount : 0}</span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        className={`mobile-nav${open ? " mobile-nav--open" : ""}`}
        aria-label="Navegación móvil"
      >
        {primaryNavigation.map((item, index) => (
          <Link
            href={item.href}
            key={item.href}
            prefetch={false}
            aria-label={item.label}
            aria-current={isActive(item.href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <span aria-hidden="true">0{index + 1}</span>
            {item.label}
            <Icon name="arrow" />
          </Link>
        ))}
      </nav>
    </header>
  );
}
