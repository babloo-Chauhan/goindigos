import {
  Briefcase,
  Headset,
  Laptop,
  Package,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export const categories = [
  { id: "cabin-crew", icon: Plane, en: "Cabin crew", hi: "केबिन क्रू" },
  { id: "pilots", icon: PlaneTakeoff, en: "Pilots", hi: "पायलट" },
  { id: "ground-staff", icon: Users, en: "Ground staff", hi: "ग्राउंड स्टाफ" },
  { id: "engineering", icon: Wrench, en: "Engineering and maintenance", hi: "इंजीनियरिंग और मेंटेनेंस" },
  { id: "cargo", icon: Package, en: "Cargo operations", hi: "कार्गो ऑपरेशंस" },
  { id: "customer-service", icon: Headset, en: "Customer service", hi: "कस्टमर सर्विस" },
  { id: "security", icon: ShieldCheck, en: "Airport security", hi: "एयरपोर्ट सिक्योरिटी" },
  { id: "hr-finance", icon: Briefcase, en: "HR and finance", hi: "एचआर और फाइनेंस" },
  { id: "it-corporate", icon: Laptop, en: "IT and corporate", hi: "आईटी और कॉर्पोरेट" },
];

export const jobs = [
  {
    id: "1",
    audience: "airline",
    category: "cabin-crew",
    employment: "fullTime",
    featured: true,
    title: { en: "Cabin Crew", hi: "केबिन क्रू" },
    company: { en: "Leading Indian Airline", hi: "प्रमुख भारतीय एयरलाइन" },
    location: { en: "Delhi", hi: "दिल्ली" },
    qualification: { en: "12th pass", hi: "12वीं पास" },
    eligibility: { en: "Age 18 to 27, fresher", hi: "आयु 18 से 27 वर्ष, फ्रेशर" },
    summary: {
      en: "Look after passenger safety and comfort on domestic flights, from boarding checks to in-flight service.",
      hi: "घरेलू उड़ानों में बोर्डिंग जांच से लेकर इन-फ्लाइट सेवा तक यात्रियों की सुरक्षा और सुविधा का ध्यान रखें।",
    },
    expiresAt: "2026-12-31",
  },
  {
    id: "2",
    audience: "airport",
    category: "ground-staff",
    employment: "fullTime",
    title: { en: "Airport Operations Executive", hi: "एयरपोर्ट ऑपरेशंस एग्जीक्यूटिव" },
    company: { en: "Airport Services Partner", hi: "एयरपोर्ट सर्विसेज पार्टनर" },
    location: { en: "Mumbai", hi: "मुंबई" },
    qualification: { en: "Graduate", hi: "स्नातक" },
    eligibility: { en: "0 to 2 years, shift work", hi: "0 से 2 वर्ष, शिफ्ट में काम" },
    summary: {
      en: "Coordinate check-in, gates and baggage teams so that flights leave the terminal on time.",
      hi: "चेक-इन, गेट और बैगेज टीमों के बीच तालमेल रखें, ताकि उड़ानें समय पर रवाना हों।",
    },
    expiresAt: "2026-12-20",
  },
  {
    id: "3",
    audience: "airport",
    category: "customer-service",
    employment: "fullTime",
    title: { en: "Customer Service Associate", hi: "कस्टमर सर्विस एसोसिएट" },
    company: { en: "Aviation Services Group", hi: "एविएशन सर्विसेज ग्रुप" },
    location: { en: "Bengaluru", hi: "बेंगलुरु" },
    qualification: { en: "Graduate", hi: "स्नातक" },
    eligibility: { en: "Fresher, clear spoken English", hi: "फ्रेशर, अंग्रेज़ी में स्पष्ट बातचीत" },
    summary: {
      en: "Help passengers with tickets, delays and baggage questions at the airport service desk.",
      hi: "एयरपोर्ट सर्विस डेस्क पर टिकट, देरी और बैगेज से जुड़े सवालों में यात्रियों की मदद करें।",
    },
    expiresAt: "2026-12-15",
  },
  {
    id: "4",
    audience: "airline",
    category: "engineering",
    employment: "fullTime",
    featured: true,
    title: { en: "Aircraft Maintenance Technician", hi: "एयरक्राफ्ट मेंटेनेंस टेक्नीशियन" },
    company: { en: "Aviation Engineering Co.", hi: "एविएशन इंजीनियरिंग कंपनी" },
    location: { en: "Hyderabad", hi: "हैदराबाद" },
    qualification: { en: "Diploma or AME", hi: "डिप्लोमा या AME" },
    eligibility: { en: "1 to 3 years in maintenance", hi: "मेंटेनेंस में 1 से 3 वर्ष" },
    summary: {
      en: "Inspect and service aircraft systems under licensed engineers, and record every task for compliance.",
      hi: "लाइसेंस प्राप्त इंजीनियरों की देखरेख में एयरक्राफ्ट सिस्टम की जांच और सर्विसिंग करें, और हर काम का रिकॉर्ड रखें।",
    },
    expiresAt: "2026-12-28",
  },
  {
    id: "5",
    audience: "airline",
    category: "pilots",
    employment: "fullTime",
    featured: true,
    title: { en: "First Officer", hi: "फर्स्ट ऑफिसर" },
    company: { en: "Regional Airline", hi: "रीजनल एयरलाइन" },
    location: { en: "Pune", hi: "पुणे" },
    qualification: { en: "CPL with ATPL theory", hi: "CPL और ATPL थ्योरी" },
    eligibility: { en: "Valid DGCA licence and medical", hi: "वैध DGCA लाइसेंस और मेडिकल" },
    summary: {
      en: "Fly regional routes alongside the captain, sharing flight planning and cockpit duties.",
      hi: "कैप्टन के साथ रीजनल रूट पर उड़ान भरें, और फ्लाइट प्लानिंग व कॉकपिट की ज़िम्मेदारियां साझा करें।",
    },
    expiresAt: "2026-12-22",
  },
  {
    id: "6",
    audience: "airport",
    category: "cargo",
    employment: "contract",
    title: { en: "Cargo Operations Assistant", hi: "कार्गो ऑपरेशंस असिस्टेंट" },
    company: { en: "Air Cargo Logistics", hi: "एयर कार्गो लॉजिस्टिक्स" },
    location: { en: "Kolkata", hi: "कोलकाता" },
    qualification: { en: "12th pass", hi: "12वीं पास" },
    eligibility: { en: "0 to 2 years, shift work", hi: "0 से 2 वर्ष, शिफ्ट में काम" },
    summary: {
      en: "Check, label and track air freight as it moves between the warehouse and the aircraft.",
      hi: "वेयरहाउस से एयरक्राफ्ट तक जाने वाले एयर फ्रेट की जांच, लेबलिंग और ट्रैकिंग करें।",
    },
    expiresAt: "2026-12-18",
  },
  {
    id: "7",
    audience: "airport",
    category: "security",
    employment: "fullTime",
    title: { en: "Aviation Security Officer", hi: "एविएशन सिक्योरिटी ऑफिसर" },
    company: { en: "Airport Security Services", hi: "एयरपोर्ट सिक्योरिटी सर्विसेज" },
    location: { en: "Chennai", hi: "चेन्नई" },
    qualification: { en: "Graduate", hi: "स्नातक" },
    eligibility: { en: "Basic AVSEC training preferred", hi: "बेसिक AVSEC ट्रेनिंग को प्राथमिकता" },
    summary: {
      en: "Screen passengers and bags, and follow airport security procedures at each checkpoint.",
      hi: "यात्रियों और बैग की जांच करें, और हर चेकपॉइंट पर एयरपोर्ट सुरक्षा प्रक्रियाओं का पालन करें।",
    },
    expiresAt: "2026-12-24",
  },
  {
    id: "8",
    audience: "airline",
    category: "hr-finance",
    employment: "fullTime",
    title: { en: "HR Executive", hi: "एचआर एग्जीक्यूटिव" },
    company: { en: "Regional Airline", hi: "रीजनल एयरलाइन" },
    location: { en: "Gurugram", hi: "गुरुग्राम" },
    qualification: { en: "MBA in HR", hi: "एचआर में MBA" },
    eligibility: { en: "1 to 3 years in recruitment", hi: "भर्ती में 1 से 3 वर्ष" },
    summary: {
      en: "Run hiring for crew and airport teams, from screening resumes to scheduling interviews.",
      hi: "क्रू और एयरपोर्ट टीमों की भर्ती संभालें, रिज़्यूमे की जांच से इंटरव्यू शेड्यूल करने तक।",
    },
    expiresAt: "2026-12-26",
  },
  {
    id: "9",
    audience: "airport",
    category: "it-corporate",
    employment: "fullTime",
    title: { en: "IT Support Engineer", hi: "आईटी सपोर्ट इंजीनियर" },
    company: { en: "Airport Systems Partner", hi: "एयरपोर्ट सिस्टम्स पार्टनर" },
    location: { en: "Ahmedabad", hi: "अहमदाबाद" },
    qualification: { en: "BCA or B.Tech", hi: "BCA या B.Tech" },
    eligibility: { en: "1 to 2 years in IT support", hi: "आईटी सपोर्ट में 1 से 2 वर्ष" },
    summary: {
      en: "Keep check-in counters, display screens and terminal networks running through every shift.",
      hi: "हर शिफ्ट में चेक-इन काउंटर, डिस्प्ले स्क्रीन और टर्मिनल नेटवर्क चालू रखें।",
    },
    expiresAt: "2026-12-29",
  },
];

export const EMPTY_FILTERS = { query: "", category: "", location: "" };
export const DEFAULT_JOB_VIEW = { filters: EMPTY_FILTERS, sort: "closing", employment: "", savedOnly: false };
const SORTS = ["closing", "title"];
export const EMPLOYMENT_TYPES = ["fullTime", "contract"];
export const AUDIENCES = ["airline", "airport"];

/** The URL form of a job list view, so a search can be shared. Default values stay out of the address. */
export function jobViewToQuery({ filters, sort, employment, savedOnly }) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (sort !== DEFAULT_JOB_VIEW.sort) params.set("sort", sort);
  if (employment) params.set("type", employment);
  if (savedOnly) params.set("saved", "1");
  return params.toString();
}

/** Reads a job list view from the URL. Anyone can edit an address, so unknown values fall back to the defaults. */
export function queryToJobView(params) {
  const category = params.get("category") ?? "";
  const sort = params.get("sort");
  const employment = params.get("type");
  return {
    filters: {
      query: params.get("q") ?? "",
      category: categories.some((item) => item.id === category) ? category : "",
      location: params.get("location") ?? "",
    },
    sort: SORTS.includes(sort) ? sort : DEFAULT_JOB_VIEW.sort,
    employment: EMPLOYMENT_TYPES.includes(employment) ? employment : "",
    savedOnly: params.get("saved") === "1",
  };
}

const SCHOOL_UP = ["12th", "diploma", "graduate", "postgraduate"];
const GRADUATE_UP = ["graduate", "postgraduate"];

/** Sample requirements behind the eligibility checker, keyed by job id. */
const JOB_REQUIREMENTS = {
  1: { accepts: SCHOOL_UP, minYears: 0 },
  2: { accepts: GRADUATE_UP, minYears: 0 },
  3: { accepts: GRADUATE_UP, minYears: 0 },
  4: { accepts: ["diploma"], minYears: 1 },
  5: { accepts: ["cpl"], minYears: 0 },
  6: { accepts: SCHOOL_UP, minYears: 0 },
  7: { accepts: GRADUATE_UP, minYears: 0 },
  8: { accepts: ["postgraduate"], minYears: 1 },
  9: { accepts: GRADUATE_UP, minYears: 1 },
};

/** Jobs saved from the admin panel carry their own requirements. The samples fall back to the table above. */
export function getJobRequirements(job) {
  return job.requirements ?? JOB_REQUIREMENTS[job.id];
}

export function isEligible(job, { qualification, years }) {
  const requirement = getJobRequirements(job);
  return Boolean(requirement) && requirement.accepts.includes(qualification) && years >= requirement.minYears;
}

export function sortJobs(list, sort, language = "en") {
  const sorted = [...list];
  if (sort === "title") {
    return sorted.sort((first, second) => first.title[language].localeCompare(second.title[language], language));
  }
  return sorted.sort((first, second) => first.expiresAt.localeCompare(second.expiresAt));
}

export function getRelatedJobs(job, list, limit = 3) {
  const others = list.filter((item) => item.id !== job.id);
  const rank = (item) => (item.category === job.category ? 0 : item.audience === job.audience ? 1 : 2);
  return [...others].sort((first, second) => rank(first) - rank(second)).slice(0, limit);
}

export function getJobStats(list) {
  return {
    roles: list.length,
    departments: new Set(list.map((job) => job.category)).size,
    cities: new Set(list.map((job) => job.location.en)).size,
  };
}

export function getJob(id, list = jobs) {
  return list.find((job) => job.id === id);
}

export function getOpenJobs(today, list = jobs) {
  return list.filter((job) => !today || job.expiresAt >= today);
}

export function matchesFilters(job, filters) {
  const category = categories.find((item) => item.id === job.category);
  const searchText = [job.title.en, job.title.hi, job.company.en, job.company.hi, category?.en, category?.hi]
    .join(" ")
    .toLowerCase();
  const locationText = `${job.location.en} ${job.location.hi}`.toLowerCase();
  return (
    searchText.includes(filters.query.trim().toLowerCase()) &&
    locationText.includes(filters.location.trim().toLowerCase()) &&
    (!filters.category || job.category === filters.category)
  );
}

export function formatClosingDate(expiresAt, language) {
  return new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(expiresAt));
}
