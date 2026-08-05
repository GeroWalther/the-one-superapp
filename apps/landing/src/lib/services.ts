/**
 * The seven verticals, shared by the public teaser (blurred) and the members
 * grid (unlocked) so the two views can never drift apart.
 *
 * `messageKey` resolves under the `services` namespace; `focusKey` links a card
 * back to the focus areas a member picked during enrolment.
 */
export type Service = {
  messageKey: string;
  focusKey: string;
  image: string;
  tint: string;
  /* Grid placement on >= sm. */
  span?: string;
};

const unsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

export const SERVICES: Service[] = [
  {
    messageKey: "healthLongevity",
    focusKey: "health",
    image: unsplash("1544367567-0f2fcb009e0b", 1000, 1000),
    tint: "#0f4a45",
    span: "sm:col-span-2 sm:row-span-2",
  },
  {
    messageKey: "beautySkincare",
    focusKey: "beauty",
    image: unsplash("1570172619644-dfd03ed5d881", 600, 480),
    tint: "#4a2b3a",
  },
  {
    messageKey: "wellnessResorts",
    focusKey: "wellness",
    image: unsplash("1571896349842-33c89424de2d", 600, 480),
    tint: "#1f4536",
  },
  {
    messageKey: "luxuryHotels",
    focusKey: "hotels",
    image: unsplash("1566073771259-6a8506099945", 600, 480),
    tint: "#3d2c17",
  },
  {
    messageKey: "lifestyle",
    focusKey: "lifestyle",
    image: unsplash("1507003211169-0a1dd7228f2d", 600, 480),
    tint: "#1c3345",
  },
  {
    messageKey: "realEstate",
    focusKey: "property",
    image: unsplash("1600596542815-ffad4c1539a9", 900, 480),
    tint: "#221f33",
    span: "sm:col-span-2",
  },
  {
    messageKey: "insurance",
    focusKey: "insurance",
    image: unsplash("1454165804606-c3d57bc86b40", 900, 480),
    tint: "#1b2c3d",
    span: "sm:col-span-2",
  },
];
