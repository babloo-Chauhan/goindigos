import CompareJobs from "../components/CompareJobs";

export const metadata = {
  title: "Compare jobs",
  description: "Compare up to 3 sample aviation jobs side by side.",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return <CompareJobs />;
}
