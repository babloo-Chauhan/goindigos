"use client";

import { shakeElement } from "./pageMotion";

function getValidationMessage(field, t) {
  if (field.validity.valueMissing) return t.fieldRequired;
  if (field.validity.typeMismatch) return t.emailInvalid;
  if (field.validity.patternMismatch) return t.mobileHint;
  return "";
}

/** Replaces the browser's own message with one in the site's language. The resume field sets its own. */
export function handleInvalidField(event, t) {
  const field = event.target;
  if (field.type !== "file") field.setCustomValidity(getValidationMessage(field, t));
  shakeElement(field.closest("label"));
}

export function clearFieldMessage(event) {
  if (event.target.type !== "file") event.target.setCustomValidity("");
}
