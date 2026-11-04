import HomePage from "./components/HomePage";
import { pageMetadata } from "./lib/site";

export const metadata = pageMetadata({ path: "/" });

export default function Home() {
  return <HomePage />;
}
