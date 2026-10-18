/*
 * Renders a JSON-LD block.
 *
 * `JSON.stringify` output is escaped before it reaches the DOM: a `<` inside a
 * string value would otherwise let content close the script tag early, which
 * is the one way a data-only block like this can become script execution. The
 * values here come from our own database, but a listing title is typed by an
 * operator and this costs nothing.
 */
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
