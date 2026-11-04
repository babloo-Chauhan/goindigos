This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Photo credits

All photos come from Wikimedia Commons, in `public/images`, and were cropped to remove people's faces and logos.

| File | Source | Author | Licence |
| --- | --- | --- | --- |
| `hero-runway.jpg` | [A Golden Airport](https://commons.wikimedia.org/wiki/File:A_Golden_Airport_(Unsplash).jpg) | Chris Leipelt | CC0 |
| `career-cockpit.jpg` | [Cockpit of airbus](https://commons.wikimedia.org/wiki/File:Cockpit_of_airbus.jpg) | Andrew McMillan | Public domain |
| `career-terminal.jpg` | [Narita International Airport Security Check](https://commons.wikimedia.org/wiki/File:Narita_International_Airport_Security_Check.JPG) | Abasaa | Public domain |
| `career-wing.jpg` | [Sunset from an airplane](https://commons.wikimedia.org/wiki/File:Sunset_from_an_airplane.jpg) | JoyD Smiths PTMr8 | CC0 |

## Admin panel

Open `/admin` to change the logo, public email, phone and contact form link, and to add, edit or delete job listings. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD` (12 or more characters) and `ADMIN_SESSION_SECRET` (32 or more characters) first, see `.env.example`. The panel stays locked without them.

There is no sign-up. Saved jobs, settings and uploaded logos are kept in MongoDB, using `MONGODB_URI` and `MONGODB_DB` (default `aerocareer`). This can be a MongoDB on your own machine or a hosted one such as Atlas. The sample jobs in `app/data/jobs.js` are shown until the first job is added, edited or deleted, and are then copied into the database. Without `MONGODB_URI` the public site still shows the samples, but the admin panel cannot save. If MongoDB is set but unreachable, pages that need fresh content show an error. Back up the database.

Unit tests need a running MongoDB at `MONGODB_TEST_URI` (default `mongodb://127.0.0.1:27017`), and use throwaway databases.

The public email, phone and contact form link are for display. Messages sent through the site's own form are saved as contact leads under `/admin/leads`, and are also emailed to `MAIL_TO` when SMTP is set up. A saved lead counts as received even if the email fails. Leads hold personal details, so delete ones you no longer need. Application forms are still only emailed.

## Going live

Set `NEXT_PUBLIC_SITE_URL` to your real domain before running `npm run build` (see `.env.example`). Canonical URLs, the sitemap, `robots.txt`, social previews, `llms.txt` and structured data all use it, so without it they point at localhost.

Job listings are samples. Sample job pages are marked `noindex` and no `JobPosting` markup is emitted. Contact messages and application details (including an optional PDF resume) are emailed to the address in `MAIL_TO`; this does not submit an application to an airline. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `MAIL_TO` from `.env.example` in your local environment or deployment secrets. Keep SMTP credentials server-side and never prefix them with `NEXT_PUBLIC_`.
