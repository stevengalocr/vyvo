export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  draft = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  draft?: boolean;
}) {
  return (
    <article className="content-page">
      <div className="container">
        <header className="content-page__header">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>
        <div className="prose">
          {draft ? (
            <p className="notice">
              Documento operativo provisional. Debe revisarse con la razón social,
              contacto y marco legal definitivos antes de publicar comercialmente.
            </p>
          ) : null}
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
