"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/commerce/cart";
import type { StorefrontProduct } from "@/types/commerce";
import { Icon } from "./icon";

export function HeroShowcase({ products }: { products: StorefrontProduct[] }) {
  const familyIndex = products.length;
  const slideCount = products.length + 1;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  const focusProduct = active === familyIndex ? null : products[active];
  const move = useCallback(
    (direction: number) => {
      setPaused(true);
      setActive((current) => (current + direction + slideCount) % slideCount);
    },
    [slideCount],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      return;
    }

    const timer = window.setInterval(() => {
      if (!paused && visible && !document.hidden) {
        setActive((current) => (current + 1) % slideCount);
      }
    }, 4800);
    return () => window.clearInterval(timer);
  }, [paused, slideCount, visible]);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="hero"
      ref={heroRef}
      aria-labelledby="hero-title"
      data-hero-state={focusProduct ? "product" : "family"}
    >
      <div className="hero__texture" aria-hidden="true" />
      <div
        className="hero__kinetic-layer hero__kinetic-layer--one"
        aria-hidden="true"
      />
      <div
        className="hero__kinetic-layer hero__kinetic-layer--two"
        aria-hidden="true"
      />
      <div className="container hero__layout">
        <div className="hero__copy">
          <span className="eyebrow">Figuras hechas en Costa Rica.</span>
          <h1 id="hero-title">
            Lo imaginás.
            <br />
            Lo hacemos <span>VYVO.</span>
          </h1>
          <p>
            Personas, mascotas, ideas y universos originales convertidos en
            figuras para exhibir, regalar y coleccionar.
          </p>
          <div className="hero__actions">
            <Link className="button button--purple" href="/catalogo">
              Comprar Origins <Icon name="arrow" />
            </Link>
            <Link className="button button--ghost" href="/personalizar">
              Crear mi figura
            </Link>
          </div>
          <p className="hero__trust">
            Compra demo <i /> Sin cobro real <i /> Flujo completo
          </p>
        </div>

        <div className="hero__visual">
          <div className="hero__image-wrap">
            <span className="concept-label">Render conceptual</span>
            <Image
              src="/landing/hero-family-concept-v1.png"
              alt="Familia conceptual de cinco figuras VYVO compartiendo una escena de estudio."
              fill
              priority
              sizes="(max-width: 900px) 100vw, 62vw"
              className="hero__image"
            />
          </div>
          <div className={`hero-focus accent-${focusProduct?.accent ?? "purple"}`}>
            <div
              className="hero-focus__content"
              data-focus-key={focusProduct?.slug ?? "family"}
              key={focusProduct?.slug ?? "family"}
            >
            {focusProduct ? (
              <>
                <div className="hero-focus__thumb">
                  <Image
                    src={focusProduct.image}
                    alt=""
                    fill
                    sizes="96px"
                  />
                </div>
                <div>
                  <span>Origins {focusProduct.originsNumber}</span>
                  <strong>{focusProduct.name}</strong>
                  <p>{focusProduct.descriptor}</p>
                  {focusProduct.commerce.price ? (
                    <small>
                      {focusProduct.commerce.inventory.availableQuantity === null
                        ? "Demo · "
                        : ""}
                      {formatMoney(focusProduct.commerce.price)}
                    </small>
                  ) : null}
                </div>
                <Link href={`/producto/${focusProduct.slug}`} aria-label={`Explorar ${focusProduct.name}`}>
                  <Icon name="arrow" />
                </Link>
              </>
            ) : (
              <div className="hero-focus__family">
                <span>Origins · Familia completa</span>
                <strong>Nueve ideas. Un mismo universo.</strong>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      <div className="container hero-controls">
        <button type="button" onClick={() => move(-1)} aria-label="Personaje anterior">
          <Icon name="chevron" />
        </button>
        <div className="hero-chips" role="tablist" aria-label="Personajes del hero">
          {products.map((product, index) => (
            <button
              key={product.slug}
              type="button"
              role="tab"
              aria-selected={active === index}
              className={active === index ? "is-active" : ""}
              onClick={() => {
                setActive(index);
                setPaused(true);
              }}
            >
              <span>{product.originsNumber}</span>
              {product.name}
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={active === familyIndex}
            className={active === familyIndex ? "is-active" : ""}
            onClick={() => {
              setActive(familyIndex);
              setPaused(true);
            }}
          >
            Familia
          </button>
        </div>
        <button className="next" type="button" onClick={() => move(1)} aria-label="Personaje siguiente">
          <Icon name="chevron" />
        </button>
      </div>
    </section>
  );
}
