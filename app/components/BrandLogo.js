"use client";

import Image from "next/image";
import { SITE_NAME } from "../lib/site";
import { useSiteSettings } from "../lib/siteData";

export default function BrandLogo() {
  const { logo } = useSiteSettings();
  if (!logo) return <span className="brand-wordmark">{SITE_NAME}</span>;
  return (
    <Image
      alt=""
      aria-hidden="true"
      className="brand-logo"
      height={58}
      src={logo}
      unoptimized={logo.startsWith("/uploads/")}
      width={112}
    />
  );
}
