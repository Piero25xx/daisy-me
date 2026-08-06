import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/fitting-room")({
  head: () => ({
    meta: [
      { title: "AI Fitting Room — Daisy Size Guide" },
      {
        name: "description",
        content:
          "Share your measurements and fit preference, and the Daisy fitting room recommends the size and silhouette that suits you.",
      },
      { property: "og:title", content: "AI Fitting Room — Daisy Size Guide" },
      { property: "og:description", content: "Get a size recommendation tailored to your measurements." },
    ],
  }),
  component: FittingRoom,
});

const FITS = ["Close", "True to size", "Relaxed"] as const;

function recommend(chest: number, waist: number, fit: (typeof FITS)[number]): string {
  const base = Math.max(chest, waist + 8);
  const scale = base < 88 ? 0 : base < 96 ? 1 : base < 104 ? 2 : base < 112 ? 3 : 4;
  const adjust = fit === "Close" ? -1 : fit === "Relaxed" ? 1 : 0;
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  return sizes[Math.min(Math.max(scale + adjust, 0), sizes.length - 1)] ?? "M";
}

function FittingRoom() {
  const [chest, setChest] = useState(96);
  const [waist, setWaist] = useState(80);
  const [fit, setFit] = useState<(typeof FITS)[number]>("True to size");
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="mx-auto grid max-w-5xl gap-16 px-6 py-20 md:grid-cols-2">
      <div>
        <p className="label-mono mb-4 text-accent">Smart Concierge</p>
        <h1 className="font-display text-5xl">Fitting Room</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Our garments are cut with generous ease through the shoulder and a narrow line at the waist. Enter your
          measurements in centimetres for a recommendation across the collection.
        </p>
        <img
          src="/images/packaging.jpg"
          alt="Daisy garment tags and folded tissue"
          loading="lazy"
          width={1000}
          height={1200}
          className="mt-10 aspect-4/5 w-full object-cover"
        />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setResult(recommend(chest, waist, fit));
        }}
        className="md:sticky md:top-28 md:h-fit"
      >
        <div className="space-y-8 border border-border bg-surface p-8">
          <div>
            <label htmlFor="chest" className="label-mono mb-3 block text-muted-foreground">
              Chest · {chest} cm
            </label>
            <input
              id="chest"
              type="range"
              min={72}
              max={130}
              value={chest}
              onChange={(event) => setChest(Number(event.target.value))}
              className="w-full accent-foreground"
            />
          </div>
          <div>
            <label htmlFor="waist" className="label-mono mb-3 block text-muted-foreground">
              Waist · {waist} cm
            </label>
            <input
              id="waist"
              type="range"
              min={58}
              max={120}
              value={waist}
              onChange={(event) => setWaist(Number(event.target.value))}
              className="w-full accent-foreground"
            />
          </div>
          <div>
            <p className="label-mono mb-3 text-muted-foreground">Preferred fit</p>
            <div className="flex gap-2">
              {FITS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFit(option)}
                  aria-pressed={fit === option}
                  className={`flex-1 border px-3 py-2 text-[11px] uppercase transition-colors ${
                    fit === option ? "border-foreground bg-foreground text-background" : "border-input"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-accent py-4 text-xs uppercase tracking-[0.2em] text-accent-foreground transition-all hover:brightness-110"
          >
            Get recommendation
          </button>
          <p aria-live="polite" className="text-center">
            {result ? (
              <span className="font-display text-3xl">
                Your size: <span className="italic">{result}</span>
              </span>
            ) : (
              <span className="label-mono text-muted-foreground">Recommendation appears here</span>
            )}
          </p>
        </div>
      </form>
    </div>
  );
}
