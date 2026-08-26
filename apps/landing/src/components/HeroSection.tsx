import Image from "next/image";
import { useTranslations } from "next-intl";
import { GoldWaves } from "./GoldWaves";

export function HeroSection() {
  const t = useTranslations("hero");

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
  ];

  return (
    <section className="grain relative overflow-hidden pb-28 pt-[92px] sm:pb-36 lg:pt-[104px]">
      <div className="silk"></div>

      {/* Gold ribbons over the wash, still behind the content. */}
      <GoldWaves />

      {/* Fine grid, masked to a soft ellipse. Aqua rather than ink — on paper a
          grey grid reads as dirt, a tinted one reads as structure. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(46,156,168,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(46,156,168,.13) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 90% 62% at 50% 32%, #000 20%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 62% at 50% 32%, #000 20%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-8">
        {/* The mark leads. It is the strongest brand asset here, and a visitor
            who arrives from an ad or an app listing should recognise it before
            reading a word. */}
        <div data-reveal className="flex justify-center">
          <div className="float-slow relative">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-full bg-aqua-200/40 blur-3xl"
            />
            <Image
              src="/images/theone-lockup.png"
              alt="TheONE Super App"
              width={252}
              height={384}
              priority
              /* Next's image optimiser re-encodes transparent PNGs to a palette
                 whose alpha the browser does not honour, which brings the white
                 background back. Served as-is instead. */
              unoptimized
              /* Height-driven so the lockup's own proportions decide the width;
                 no drop-shadow, since the artwork already carries one under the
                 icon and a second would fall across the wordmark too. */
              className="relative h-[250px] w-auto sm:h-[310px]"
            />
          </div>
        </div>
      <h1
          data-reveal
          data-reveal-delay="120"
          className="mx-auto max-w-6xl font-display text-[24px] font-bold leading-[1.3] tracking-[0.08em] text-[#0a2f34] sm:text-[28px]"
        >
          {t("titleLine1")}{" "}
          {/* Inline, not a block: the two halves are one sentence, and forcing
              a break mid-phrase made it read as two. It still wraps naturally
              on narrow viewports. */}
          {/* Flat, and a darker gold than the mark's own: #b8914a sat too close
              in value to the pale hero behind it to read comfortably at this
              size. No gradient — it thinned the phrase mid-word. */}
          <span className="text-[#8a6420]">{t("titleAccent")}</span>
        </h1>
        {/* Directly under the mark, so the claim reads as part of the lockup.
            Set in the display face rather than tracked uppercase — the badge
            below is already that, and two tracked lines stacked fight. */}
        <p
          data-reveal
          data-reveal-delay="40"
          /* No CSS uppercase: the caps live in the message so "TheONE" keeps
             its brand casing. text-transform would flatten it to "THEONE" and
             lose the split the whole identity is built on. Caps need tracking
             or they set solid. */
          className="mx-auto mt-12 max-w-6xl font-display text-[17px] font-bold leading-[1.45] tracking-[0.09em] text-[#0a2f34] sm:text-[21px]"
        >
          {t("tagline")}
        </p>

  

        {/* Three paragraphs rather than one block: at this length a single
            run is a wall, and the copy already breaks cleanly into what it is,
            what powers it, and what that does for the member. Wider measure
            than the old one-liner, or the lines get uncomfortably short. */}
        <div
          data-reveal
          data-reveal-delay="180"
          className="mx-auto mt-8 max-w-3xl space-y-4 text-center text-[15px] leading-[1.8] text-ink-soft sm:text-[16px]"
        >
          <p>{t("subtitle")}</p>
          <p>{t("subtitle2")}</p>
          <p>{t("subtitle3")}</p>
        </div>

<dl
          data-reveal
          data-reveal-delay="340"
          className="mt-20 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_1px_2px_rgba(43,52,64,.04)]"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-paper px-3 py-6 text-center sm:px-6 sm:py-7"
            >
              <dt className="text-accent font-display text-[30px] font-light leading-none sm:text-[38px]">
                {stat.value}
              </dt>
              <dd className="mt-2 text-[10px] uppercase tracking-[0.14em] text-ink-faint sm:text-[11.5px] sm:tracking-[0.16em]">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
