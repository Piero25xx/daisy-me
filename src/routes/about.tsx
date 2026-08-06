import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The House of Daisy — Our Story" },
      {
        name: "description",
        content:
          "Daisy is a small studio making fluid tailoring from considered materials, produced in limited runs with partners we know by name.",
      },
      { property: "og:title", content: "The House of Daisy — Our Story" },
      {
        property: "og:description",
        content: "A small studio making fluid tailoring from considered materials, in limited runs.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-24">
      <p className="label-mono mb-4 text-accent">Our Story</p>
      <h1 className="mb-10 font-display text-5xl leading-tight md:text-6xl">
        Clothing that stays <span className="italic">longer than the season</span>
      </h1>
      <img
        src="/images/fabric-detail.jpg"
        alt="Close detail of undyed linen woven for the Daisy collection"
        loading="lazy"
        width={1200}
        height={800}
        className="mb-12 aspect-3/2 w-full object-cover"
      />
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Daisy began in a two-room studio with a single question: what would a wardrobe look like if nothing in it
          needed replacing? The answer became a discipline — fewer pieces, better cloth, and silhouettes drawn to move
          with the body rather than against it.
        </p>
        <p>
          Every garment is developed over months, not weeks. We work with mills in Portugal and Japan whose linen,
          wool and cotton we can trace to the field. Production happens in limited runs, so nothing is made
          speculatively and very little is wasted.
        </p>
        <p>
          Our objects — the totes, belts and scarves — follow the same rule. They are finished by hand, stamped
          quietly, and built to soften rather than fray.
        </p>
      </div>

      <div className="mt-16 grid gap-8 border-t border-border pt-12 md:grid-cols-3">
        {[
          { title: "Traceable cloth", body: "Mills named on every product page, from field to finish." },
          { title: "Limited runs", body: "Made to demand in small batches, never speculatively." },
          { title: "Repair, don't replace", body: "Complimentary repairs for the life of the garment." },
        ].map((item) => (
          <div key={item.title}>
            <h2 className="mb-2 font-display text-xl">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
