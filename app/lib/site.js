const LOCAL_URL = "http://localhost:3000";
const VERCEL_HOST = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || (VERCEL_HOST && `https://${VERCEL_HOST}`) || LOCAL_URL).replace(/\/$/, "");
export const SITE_NAME = "AeroCareer Hub";
export const SITE_DESCRIPTION =
  "Explore aviation career paths, eligibility and sample job listings for pilots, cabin crew, ground staff and engineers across airlines and airports in India.";

export const INDEXED_ROUTES = ["/", "/jobs", "/airlines-jobs", "/airport-jobs", "/careers", "/about", "/contact"];

const SHARE_IMAGE = { url: "/images/hero-runway.jpg", alt: "An airport runway at sunset" };

/**
 * Metadata for an indexed page. Next.js replaces a parent's openGraph object rather than merging it,
 * so each page repeats the shared fields or its social preview loses its title and image.
 * @param {{ title?: string, description?: string, path: string }} page
 */
export function pageMetadata({ title, description = SITE_DESCRIPTION, path }) {
  const shareTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Your Gateway to Aviation Careers`;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title: shareTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [SHARE_IMAGE.url] },
  };
}
