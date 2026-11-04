"use client";

import { useLanguage } from "../lib/language";
import { useSiteSettings } from "../lib/siteData";

/** The public email, phone and form link from the admin settings. Shows nothing until one is saved. */
export default function ContactLinks() {
  const { t } = useLanguage();
  const { contactFormUrl, email, phone } = useSiteSettings();
  if (!email && !phone && !contactFormUrl) return null;

  return (
    <address className="contact-links">
      {email && <span>{t.contactEmailLabel}: <a href={`mailto:${email}`}>{email}</a></span>}
      {phone && <span>{t.contactPhoneLabel}: <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>{phone}</a></span>}
      {contactFormUrl && <a href={contactFormUrl} rel="noopener noreferrer" target="_blank">{t.contactFormLink}</a>}
    </address>
  );
}
