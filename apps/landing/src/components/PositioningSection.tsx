import { useTranslations } from "next-intl";

const TITLE_TERM = "POWER AI";

/**
 * The client's own description of what the AI does, stated plainly and early.
 *
 * Reads from the `aboutPage` namespace rather than keeping a second copy: this
 * is one brand statement appearing on two surfaces, and two copies of it drift
 * the moment anyone edits one of them.
 */
export function PositioningSection() {
  const t = useTranslations("aboutPage");

  /* Split on the product term rather than on a word count: it is the one token
     both locales share, so the break lands in the same place in either. If the
     copy ever loses the term, the whole string stays on the first span and
     simply wraps as it used to. */
  const title = t("introTitle");
  const splitAt = title.indexOf(TITLE_TERM);
  const titleHead =
    splitAt === -1 ? title : title.slice(0, splitAt + TITLE_TERM.length);
  const titleTail =
    splitAt === -1 ? "" : title.slice(splitAt + TITLE_TERM.length).trim();

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        {/* The claim stays English in the German build, as the page's other
            claims do — "YOUR WORLD YOUR MATCH", "ONE WORLD ONE POWER AI". */}
        <h2
          data-reveal
          /* Two lines on a phone, one from sm up. Breaking after the product
             term is what buys the size: each half is about half the string, so
             the type can be set nearly twice as large as a single nowrap line
             would allow — it is set to fill the column, the size the hero's
             "YOUR WORLD UNDERSTOOD" is set at, which is the weight this claim
             wants next to it. From sm up the halves rejoin and the size
             follows the viewport as before (the claim needs 20.1x its own
             font-size to set on one line, so 4.7vw is the largest that always
             fits), capped at 34px. -mx-4 gives back
             most of the section's gutter on a phone. */
          className="-mx-4 font-display text-[clamp(23.4px,8.1vw,46.8px)] font-bold leading-[1.2] tracking-[0.05em] text-[#004444] sm:mx-0 sm:whitespace-nowrap sm:text-[min(4.23vw,30.6px)]"
        >
          <span className="block whitespace-nowrap sm:inline">{titleHead}</span>{" "}
          <span className="block whitespace-nowrap sm:inline">{titleTail}</span>
        </h2>

        {/* This is the message the client most wants read, so it is stated
            the loudest thing on the page: the two paragraphs are lifted out of
            the white and set in solid petrol, white on dark, and the block is
            the one thing here that moves — it lands, it breathes, a halo turns
            behind it and a sheen crosses it. The motion lives in globals.css
            under "The important-message panel", where it can be read as one
            piece and switched off in one place for reduced motion. */}
        <div
          data-reveal
          data-reveal-delay="80"
          className="msg-halo mt-10 sm:mt-12"
        >
          <div className="msg-panel rounded-3xl bg-[#004444] px-6 py-10 sm:px-12 sm:py-14">
            {/* One paragraph, opening on the phrase the client wants read
                first. It is set the way the hero's paragraph under "YOUR WORLD
                UNDERSTOOD" is set — the body sans at a normal weight,
                text-pretty, leading 1.7 — so the two read as the same voice,
                a step larger here because this block is the loud one.

                The scene-setting paragraph above it is not gone from the site:
                the about page still opens with `intro`, which is why the key
                stays in the message files. */}
            <p className="msg-line mx-auto max-w-2xl text-pretty text-[18.7px] leading-[1.7] text-white sm:text-[25.5px]">
              {t.rich("intro2", {
                /* The one phrase the client wants picked out, set in the
                   brand gold so it lifts off the petrol without breaking the
                   line. The tag lives in the message file because the phrase
                   sits in a different place in each locale. */
                gold: (chunks) => (
                  <span className="text-gold-gradient text-[22px] font-medium sm:text-[30px]">
                    {chunks}
                  </span>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
