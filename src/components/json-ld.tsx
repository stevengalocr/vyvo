type JsonLdProps = {
  /** Grafo ya armado con `buildGraph()` de @/lib/seo/structured-data. */
  graph: Record<string, unknown>;
};

/**
 * `application/ld+json` no se ejecuta como script, pero igual entra al HTML: se escapa
 * `<` para que un texto de producto que traiga `</script>` no pueda cerrar la etiqueta
 * antes de tiempo.
 */
export function JsonLd({ graph }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
