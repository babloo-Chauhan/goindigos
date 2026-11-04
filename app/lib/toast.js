"use client";

import { useSyncExternalStore } from "react";

const TOAST_DURATION_MS = 3200;
const listeners = new Set();
let currentToast = null;
let toastId = 0;
let timer;

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function getToast() {
  return currentToast;
}

function getServerToast() {
  return null;
}

export function showToast(message) {
  toastId += 1;
  currentToast = { id: toastId, message };
  notify();
  clearTimeout(timer);
  timer = setTimeout(() => {
    currentToast = null;
    notify();
  }, TOAST_DURATION_MS);
}

export function useToast() {
  return useSyncExternalStore(subscribe, getToast, getServerToast);
}
