"use client";

import { useRef } from "react";
import { useScrollReveal } from "../lib/pageMotion";

export default function RevealScope({ children }) {
  const scopeRef = useRef(null);
  useScrollReveal(scopeRef);
  return <div ref={scopeRef}>{children}</div>;
}
