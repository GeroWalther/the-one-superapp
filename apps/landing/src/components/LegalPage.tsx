import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import type { LegalBlock, LegalDocument } from "@/content/legal";

/**
 * The shared shell for the imprint, the privacy policy and the giveaway
 * terms: the site's header and footer around a plain, readable column.
 *
 * Legal text is read, not scanned, so it gets a narrow measure and generous
 * leading, and nothing decorative competes with it.
 */
export function LegalPage({ doc, locale }: { doc: LegalDocument; locale: string }) {
  return (
    <>
      <SiteHeader />

      <main className="relative flex-1 pb-24 pt-[126px] sm:pt-[150px]">
        <article className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="font-display text-[34px] font-medium leading-[1.12] text-[#052226] sm:text-[44px]">
            {doc.title}
          </h1>
          {doc.intro && (
            <p className="mt-4 text-[16px] leading-[1.7] text-ink-soft">{doc.intro}</p>
          )}
          <hr className="rule-accent mt-8 w-full max-w-xs" />

          <div className="mt-10 space-y-10">
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-[22px] font-semibold leading-[1.25] text-[#005252] sm:text-[24px]">
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3 text-[15.5px] leading-[1.75] text-[#37414d]">
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} locale={locale} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-12 text-[14px] text-ink-faint">{doc.updated}</p>
        </article>
      </main>

      <Footer />
    </>
  );
}

function Block({ block, locale }: { block: LegalBlock; locale: string }) {
  if (typeof block === "string") return <p>{block}</p>;

  if ("list" in block) {
    return (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-[#005252]">
        {block.list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if ("lines" in block) {
    /* Address-style blocks: one fact per line, no paragraph spacing. */
    return (
      <p>
        {block.lines.map((line, i) => (
          <span key={line} className={i === 0 ? "block font-semibold text-[#052226]" : "block"}>
            {line}
          </span>
        ))}
      </p>
    );
  }

  return (
    <p>
      <Link
        href={`/${locale}/${block.link.path}`}
        className="font-semibold text-[#005252] underline decoration-[#005252]/35 underline-offset-4 transition-colors hover:decoration-[#005252]"
      >
        {block.link.label}
      </Link>
    </p>
  );
}
