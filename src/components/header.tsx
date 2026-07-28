"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { primaryNavigation } from "@/lib/site";
import { BrandMark } from "./brand-mark";
import { useCart } from "./cart-provider";
import { Icon } from "./icon";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { hydrated, itemCount } = useCart();

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
      className={`site-header${scrolled || open ? " site-header--solid" : ""}`}
    >
      <div className="site-header__inner">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Navegación principal">
          {primaryNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
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
            className="cart-link"
            aria-label={`Carrito${itemCount ? `, ${itemCount} productos` : " vacío"}`}
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
          <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
            <span>0{index + 1}</span>
            {item.label}
            <Icon name="arrow" />
          </Link>
        ))}
        <Link href="/personalizar" className="button button--purple" onClick={() => setOpen(false)}>
          Crear mi figura
        </Link>
        <Link href="/carrito" className="mobile-cart-link" onClick={() => setOpen(false)}>
          <Icon name="cart" />
          Ver carrito
          <span>{hydrated ? itemCount : 0}</span>
        </Link>
      </nav>
    </header>
  );
}
