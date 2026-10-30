export const EDITABLE_MARKETING_FIELDS = {
  home_hero_title: { label: "Homepage headline", help: "The large welcome headline.", multiline: false, image: false },
  home_hero_subtitle: { label: "Homepage introduction", help: "Text under the main headline.", multiline: true, image: false },
  home_hero_image_url: { label: "Homepage hero image", help: "Optional photo in the app preview and homepage.", multiline: false, image: true },
  home_app_title: { label: "Media app preview headline", help: "Title above the media-app preview.", multiline: false, image: false },
  home_app_description: { label: "Media app preview description", help: "Description next to the media-app preview.", multiline: true, image: false },
  home_membership_title: { label: "Membership section headline", help: "Heading above the membership button.", multiline: false, image: false },
  home_membership_description: { label: "Membership description", help: "Text above membership plans.", multiline: true, image: false },
  brand_logo_url: { label: "Teens2Inspire brand logo", help: "The logo used in the main website and media-app header. Transparent PNG is recommended.", multiline: false, image: true },
  footer_tagline: { label: "Website footer tagline", help: "Short note next to the logo.", multiline: true, image: false },
  mission_title: { label: "Mission headline", help: "The title of the About page mission section.", multiline: false, image: false },
  mission_body: { label: "Mission description", help: "The About page mission description.", multiline: true, image: false },
  about_headline: { label: "About page title", help: "Top headline on the About page.", multiline: false, image: false },
  about_intro: { label: "About page introduction", help: "Introductory paragraph on the About page.", multiline: true, image: false },
  founder_bio: { label: "Founder biography", help: "About page biography. Only publish information you want public.", multiline: true, image: false },
  podcast_hero_title: { label: "Podcast page headline", help: "Top headline on the podcast page.", multiline: false, image: false },
  podcast_description: { label: "Podcast description", help: "Introductory paragraph on the podcast page.", multiline: true, image: false },
} as const;
export type EditableMarketingKey = keyof typeof EDITABLE_MARKETING_FIELDS;
