"use client";

const STORAGE_KEY = "aerocareer-application-draft";
// The resume and the consent box are left out: a file cannot be restored, and consent must be given each time.
const DRAFT_FIELDS = ["name", "mobile", "email", "currentCity", "preferredLocation", "qualification", "experience", "skills"];

/** Keeps answers in this tab only, so closing it removes them from a shared computer. */
export function saveDraft(form) {
  const draft = Object.fromEntries(DRAFT_FIELDS.map((name) => [name, form.elements[name]?.value ?? ""]));
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Without storage the form still works, but answers are lost on reload.
  }
}

export function restoreDraft(form) {
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
    if (!draft) return;
    DRAFT_FIELDS.forEach((name) => {
      const field = form.elements[name];
      if (field && typeof draft[name] === "string") field.value = draft[name];
    });
  } catch {
    // A damaged draft is ignored and the form starts empty.
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing was stored.
  }
}
