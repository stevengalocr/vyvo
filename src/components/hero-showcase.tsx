"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { BilbildinMode } from "@/lib/bilbildin/config";
import { formatMoney } from "@/lib/commerce/cart";
import { getCommerceExperience } from "@/lib/commerce/experience";
import {
  advanceHeroPreview,
  clearHeroSelection,
  createHeroShowcaseState,
  getHeroKeyboardTarget,
  moveHero,
  selectHeroProduct,
  type HeroDirection,
} from "@/lib/hero/showcase-state";
import type { StorefrontProduct } from "@/types/commerce";
import { Icon } from "./icon";

const HERO_PREVIEW_INTERVAL = 4800;

export function HeroShowcase({
  products,
  mode,
}: {
  products: StorefrontProduct[];
  mode: BilbildinMode;
}) {
  const experience = getCommerceExperience(mode);
  const hasPurchasableProduct = products.some(
    (product) => product.commerce.purchasable,
  );
  const [showcase, setShowcase] = useState(createHeroShowcaseState);
  const [visible, setVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [stageImageFailed, setStageImageFailed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const heroRef = useRef<HTMLElement>(null);
  const productTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusProduct = products[showcase.previewIndex] ?? null;
  const selectedProduct =
    showcase.selectedIndex === null
      ? null
      : (products[showcase.selectedIndex] ?? null);
  const stageAssetSlug = selectedProduct?.slug.replace(/^vyvo-/, "");
  const stageSource = selectedProduct
    ? stageImageFailed
      ? selectedProduct.image
      : `/products/${stageAssetSlug}/hero-transparent.png`
    : "/landing/hero-family-concept-v1.png";
  const stageAccent =
    selectedProduct?.accent ?? focusProduct?.accent ?? "purple";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (
      showcase.selectedIndex !== null ||
      prefersReducedMotion ||
      !visible ||
      products.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        setShowcase((current) =>
          advanceHeroPreview(current, products.length),
        );
      }
    }, HERO_PREVIEW_INTERVAL);

    return () => window.clearInterval(timer);
  }, [
    prefersReducedMotion,
    products.length,
    showcase.selectedIndex,
    visible,
  ]);

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

  useEffect(() => {
    setStageImageFailed(false);
  }, [selectedProduct?.slug]);

  const selectProduct = useCallback(
    (index: number) => {
      const product = products[index];
      if (!product) return;

      setShowcase((current) =>
        selectHeroProduct(current, index, products.length),
      );
      setAnnouncement(`${product.name} seleccionado como protagonista.`);
    },
    [products],
  );

  const selectFamily = useCallback(() => {
    setShowcase((current) => clearHeroSelection(current));
    setAnnouncement("Familia VYVO seleccionada.");
  }, []);

  const move = useCallback(
    (direction: HeroDirection) => {
      setShowcase((current) => moveHero(current, direction, products.length));
    },
    [products.length],
  );

  const handleProductKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const target = getHeroKeyboardTarget(event.key, index, products.length);
    if (target === null) return;

    event.preventDefault();
    selectProduct(target);
    window.requestAnimationFrame(() => productTabRefs.current[target]?.focus());
  };

  const handleFamilyKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }
    if (products.length === 0) return;

    event.preventDefault();
    const target =
      event.key === "ArrowLeft" || event.key === "End"
        ? products.length - 1
        : 0;
    selectProduct(target);
    window.requestAnimationFrame(() => productTabRefs.current[target]?.focus());
  };

  return (
    <section
      className={`hero accent-${stageAccent}`}
      ref={heroRef}
      aria-labelledby="hero-title"
      data-hero-state={selectedProduct ? "product" : "family"}
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
              {hasPurchasableProduct ? "Comprar Origins" : "Explorar Origins"}{" "}
              <Icon name="arrow" />
            </Link>
            <Link className="button button--ghost" href="/personalizar">
              Crear mi figura
            </Link>
          </div>
          <p className="hero__trust">
            {experience.hero.trust[0]} <i /> {experience.hero.trust[1]} <i />{" "}
            {experience.hero.trust[2]}
          </p>
        </div>

        <div className="hero__visual">
          <div className="hero__image-wrap hero__stage">
            <span className="concept-label">
              {selectedProduct ? "Personaje seleccionado" : "Familia Origins"}
            </span>
            <span className="hero__stage-signal" aria-hidden="true" />
            <span className="hero__stage-orbit" aria-hidden="true" />
            <div
              className={`hero__stage-media ${
                selectedProduct
                  ? "hero__stage-media--product"
                  : "hero__stage-media--family"
              }`}
              data-direction={showcase.direction}
              key={selectedProduct?.slug ?? "family"}
            >
              <Image
                src={stageSource}
                alt={
                  selectedProduct
                    ? `${selectedProduct.name}, figura de la colección Origins de VYVO.`
                    : "Familia conceptual de figuras VYVO compartiendo una escena de estudio."
                }
                fill
                priority={!selectedProduct}
                sizes="(max-width: 900px) 100vw, 62vw"
                className="hero__image"
                onError={
                  selectedProduct && !stageImageFailed
                    ? () => setStageImageFailed(true)
                    : undefined
                }
              />
            </div>
          </div>

          <div
            className={`hero-focus accent-${focusProduct?.accent ?? "purple"}`}
            data-automatic={showcase.selectedIndex === null}
          >
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
                  <div className="hero-focus__details">
                    <span>Origins {focusProduct.originsNumber}</span>
                    <strong>{focusProduct.name}</strong>
                    <p>{focusProduct.descriptor}</p>
                    {focusProduct.commerce.price ? (
                      <small>
                        {experience.hero.pricePrefix}
                        {formatMoney(focusProduct.commerce.price)}
                      </small>
                    ) : null}
                  </div>
                  <Link
                    href={`/producto/${focusProduct.slug}`}
                    aria-label={`Explorar ${focusProduct.name}`}
                  >
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
            {showcase.selectedIndex === null &&
            products.length > 1 &&
            !prefersReducedMotion ? (
              <span
                className="hero-focus__progress"
                key={`progress-${showcase.previewIndex}`}
                aria-hidden="true"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="container hero-controls">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label={
            selectedProduct
              ? "Seleccionar personaje anterior"
              : "Ver personaje anterior en la tarjeta"
          }
          disabled={products.length < 2}
        >
          <Icon name="chevron" />
        </button>

        <div className="hero-chips" role="tablist" aria-label="Personajes VYVO">
          {products.map((product, index) => {
            const isSelected = showcase.selectedIndex === index;
            const isPreviewing =
              showcase.selectedIndex === null &&
              showcase.previewIndex === index;

            return (
              <button
                key={product.slug}
                ref={(node) => {
                  productTabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="hero-character-stage"
                tabIndex={isSelected ? 0 : -1}
                data-previewing={isPreviewing || undefined}
                className={[
                  isSelected ? "is-selected" : "",
                  isPreviewing ? "is-previewing" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectProduct(index)}
                onKeyDown={(event) => handleProductKeyDown(event, index)}
              >
                <span>{product.originsNumber}</span>
                {product.name}
              </button>
            );
          })}
          <button
            type="button"
            role="tab"
            aria-selected={showcase.selectedIndex === null}
            aria-controls="hero-character-stage"
            tabIndex={showcase.selectedIndex === null ? 0 : -1}
            className={
              showcase.selectedIndex === null ? "is-selected" : undefined
            }
            onClick={selectFamily}
            onKeyDown={handleFamilyKeyDown}
          >
            Familia
          </button>
        </div>

        <button
          className="next"
          type="button"
          onClick={() => move(1)}
          aria-label={
            selectedProduct
              ? "Seleccionar personaje siguiente"
              : "Ver personaje siguiente en la tarjeta"
          }
          disabled={products.length < 2}
        >
          <Icon name="chevron" />
        </button>
      </div>

      <span className="sr-only" id="hero-character-stage" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}
