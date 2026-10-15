// Curated from content/paginas/inicio.md and the original property pages.
// Booking, contact, and editorial destinations remain on the source website.
export const SITE_URL = "https://getawayselsalvador.com";

export const categories = [
  {
    title: "Apartments",
    count: "9 stays",
    image: "/getaways/apartments.webp",
    alt: "Modern ocean-facing apartments surrounded by tropical greenery in El Zonte",
    description: "Modern design, thoughtful spaces, and the beach just moments away. Find your place in El Zonte.",
    href: `${SITE_URL}/listing-category/apartments/`,
  },
  {
    title: "Villas",
    count: "1 stay",
    image: "/getaways/villas.webp",
    alt: "A private swimming pool and palm-thatched lounge in a tropical villa garden",
    description: "Room to slow down. Fully equipped villas for time together, close to the Surf City coast.",
    href: `${SITE_URL}/listing-category/villas-for-rent-in-surf-city/`,
  },
] as const;

export type Property = {
  name: string;
  subtitle: string;
  category: "Apartments" | "Villas";
  location: string;
  image: string;
  alt: string;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  href: string;
};

export const properties: Property[] = [
  {
    name: "Zonte Surfside Getaway",
    subtitle: "Oceanview condo in El Zonte",
    category: "Apartments",
    location: "El Zonte, El Salvador",
    image: "/getaways/zonte-surfside.jpg",
    alt: "Bright living room opening onto the Pacific Ocean at Zonte Surfside Getaway",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Ocean view", "Pool", "WiFi"],
    href: `${SITE_URL}/listing/zonte-surfside-getaway/`,
  },
  {
    name: "Solaris",
    subtitle: "Oceanfront escape in Surf City",
    category: "Apartments",
    location: "Surf City, El Salvador",
    image: "/getaways/solaris.jpg",
    alt: "Spacious Solaris apartment with floor-to-ceiling windows and an ocean-facing balcony",
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["Ocean view", "Pool", "WiFi"],
    href: `${SITE_URL}/listing/solaris-3b-3ba-oceanfront-escape-in-surfcity/`,
  },
  {
    name: "Casa Jungla Getaway",
    subtitle: "A private tropical retreat in Xanadu",
    category: "Villas",
    location: "Xanadu, El Salvador",
    image: "/getaways/casa-jungla.jpg",
    alt: "Casa Jungla's private pool and open-air lounge surrounded by tropical trees",
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["Beach access", "Private pool", "WiFi"],
    href: `${SITE_URL}/listing/casa-jungla-getaway/`,
  },
];

export const testimonials = [
  {
    quote: "We stayed at Zonset and had a lovely, memorable experience. The views area incredible and we loved that the living room and bathrooms had full glass with ocean views and access to the deck. The finishes were sleek and modern, the shower was fantastic, and the kitchen was well-appointed.",
    name: "Natasha Afana",
    role: "Frequent traveler",
    image: "/getaways/zonset-amenities-12.jpg",
    alt: "Zonset swimming pool beside a building with a surfing mural",
  },
  {
    quote: "I had a great stay at this place in Zonset. The space was extremely clean and well maintained, and you can tell everything is brand new. One of the highlights was definitely the beautiful balcony overlooking the beach. It was the perfect spot to drink coffee in the morning or just take in the view and listen to the ocean.",
    name: "Nicholas Poli",
    role: "Frequent traveler",
    image: "/getaways/zonset-amenities-11.jpg",
    alt: "Hammocks beneath wooden pergolas beside the pool at Zonset",
  },
  {
    quote: "We spent an amazing vacation, we definitely recommend staying here, the location is perfect, the pool is really nice, and the airbnb has everything you need to spend a great time there. Isabella was very sweet, she took care of us during the whole stay!",
    name: "Emilo Bejot",
    role: "Frequent traveler",
    image: "/getaways/zonset-amenities-2.jpg",
    alt: "Zonset apartment balconies overlooking the swimming pool and gardens",
  },
] as const;

export const articles = [
  {
    title: "Tamanique by ATV: The Waterfalls, Without the Long Hike",
    category: "Getaways guides",
    image: "/getaways/waterfalls.jpg",
    alt: "A waterfall cascading into a natural pool in Tamanique",
    date: "Oct 14, 2026",
    dateTime: "2026-10-14",
    href: `${SITE_URL}/2026/10/14/tamanique-by-atv-the-waterfalls-without-the-long-hike/`,
  },
  {
    title: "Why Surfers Love Rainy Season in El Zonte",
    category: "Local tips",
    image: "/getaways/surf-season.jpg",
    alt: "A surfer walking along the Pacific shore at a golden El Zonte sunset",
    date: "Oct 5, 2026",
    dateTime: "2026-10-05",
    href: `${SITE_URL}/2026/10/05/why-surfers-love-rainy-season-in-el-zonte/`,
  },
  {
    title: "Best Surf Schools in Surf City, El Salvador — Part II",
    category: "Getaways guides",
    image: "/getaways/surf-school.png",
    alt: "A surfer riding a wave beside the rocky Surf City coastline",
    date: "Sep 26, 2026",
    dateTime: "2026-09-26",
    href: `${SITE_URL}/2026/09/26/best-surf-schools-in-surf-city-el-salvador-part-ii/`,
  },
] as const;
