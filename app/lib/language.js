"use client";

import { useSyncExternalStore } from "react";
import { copy } from "../data/copy";

const STORAGE_KEY = "aerocareer-language";
const listeners = new Set();
let selectedLanguage = null;

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredLanguage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

function getLanguage() {
  if (!selectedLanguage) selectedLanguage = readStoredLanguage();
  return selectedLanguage;
}

function getServerLanguage() {
  return "en";
}

function setLanguage(language) {
  selectedLanguage = language;
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Without storage the choice still applies until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getLanguage, getServerLanguage);
  return { language, setLanguage, t: copy[language] };
}
