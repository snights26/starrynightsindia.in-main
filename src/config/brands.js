export const FOOTER_BRANDS = [
  {
    slug: "holidays",
    brandName: "Holidays",
    title: "Starry Nights Holidays",
    logo: "/Starry-Nights-Holidays.png",
    description: "Expertly curated premium tours covering leisure travel, weekend getaways, and customized holiday experiences designed for comfort and memorable journeys."
  },
  {
    slug: "adventures",
    brandName: "Adventures",
    title: "Starry Nights Adventures",
    logo: "/Starry-Nights-Adventures.png",
    description: "High-energy adventure experiences including trekking, camping, hiking, and outdoor expeditions crafted for thrill seekers and nature lovers."
  },
  {
    slug: "group-tours",
    brandName: "GroupTour",
    title: "Paulkhuna by Starry Nights",
    logo: "/Paulkhuna-By-Starry-Nights.png",
    description: "A specialized unit focused on group tours, cultural journeys, and exclusive batch experiences that bring people together through travel."
  }
];

export const brandBySlug = (slug) =>
  FOOTER_BRANDS.find((brand) => brand.slug === String(slug || "").trim().toLowerCase());
