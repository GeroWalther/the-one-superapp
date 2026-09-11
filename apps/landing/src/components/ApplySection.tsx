import { useTranslations } from "next-intl";
import { ApplyChooser } from "./ApplyChooser";

/**
 * Where the landing page's calls to action land.
 *
 * The form lives on the page rather than behind a navigation: everything a
 * visitor needs to decide is directly above it, and sending them elsewhere to
 * fill it in means losing the argument that convinced them.
 */
export function ApplySection({ inviteCode }: { inviteCode?: string }) {
  const t = useTranslations("enroll");
  /* The brand block was written for the about page and never placed. It says
     who is asking before the page asks for an application, which is the job
     the eyebrow and the subtitle were doing badly. */
  const tBrand = useTranslations("preview.about");

  return (
    <section id="apply" className="scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-6 lg:px-8">
        <div data-reveal className="text-center">
          <p className="font-display text-[22px] font-medium tracking-[0.02em] text-[#004444] sm:text-[26px]">
            {tBrand("brandName")}
          </p>
          {/* The claim is set the way the page's other claims are — caps,
              tracked out, in the dark petrol — so it reads as the brand
              speaking rather than as a subtitle to the wordmark. */}
          <p className="mt-3 font-display text-[clamp(19px,5.2vw,28px)] font-bold tracking-[0.05em] text-[#004444]">
            {tBrand("brandClaim")}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-[1.7] text-[#004444] sm:text-[17px]">
            {tBrand("brandBody")}
          </p>

          <h2 className="mt-12 font-display text-[30px] font-light leading-tight text-ink sm:text-[38px]">
            {t("chooser.title")}
          </h2>
        </div>

        <div data-reveal data-reveal-delay="120" className="mt-10">
          {/* The filled cards, the same as the hero's: two outlined cards on
              the page's pale ground had nothing to sit against and read as
              empty boxes, where the gradient states plainly that this is the
              thing to act on. */}
          <ApplyChooser inviteCode={inviteCode} tone="fill" />
        </div>
      </div>
    </section>
  );
}
