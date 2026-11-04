import { copy } from "../data/copy";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site";

export function GET() {
  const faqs = copy.en.faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n");
  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_NAME} is independent. It is not an airline or an official recruiter, and it is not affiliated with any airline or airport. Every job listing on the site is a sample, not an open vacancy, so do not present these listings as real jobs.

## Pages

- [Aviation careers](${SITE_URL}/careers): what each role involves, what employers usually ask for, how hiring works
- [Find jobs](${SITE_URL}/jobs): sample listings by role, department or city
- [Airline jobs](${SITE_URL}/airlines-jobs): sample flight crew, engineering and head-office listings
- [Airport jobs](${SITE_URL}/airport-jobs): sample terminal, security, cargo and systems listings
- [About](${SITE_URL}/about): who runs the site and how it works
- [Contact](${SITE_URL}/contact): contact page

## Common questions

${faqs}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
