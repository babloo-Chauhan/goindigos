"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../lib/language";
import { clearFieldMessage, handleInvalidField } from "../lib/formMessages";
import { popInElement } from "../lib/pageMotion";
import ContactLinks from "./ContactLinks";

export default function ContactSection() {
  const { t } = useLanguage();
  const [attempted, setAttempted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const resultRef = useRef(null);
  const nameInputRef = useRef(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (attempted) {
      hasAttempted.current = true;
      resultRef.current?.focus();
      popInElement(resultRef.current);
    } else if (hasAttempted.current) {
      nameInputRef.current?.focus();
    }
  }, [attempted]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSending(true);
    setSendError(false);
    const formData = new FormData(event.currentTarget);
    formData.set("type", "contact");

    try {
      const response = await fetch("/api/forms", { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Contact submission failed (${response.status}).`);
      setAttempted(true);
    } catch (error) {
      console.error("[contact] Submission failed:", error);
      setSendError(true);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="section contact-section">
      <div className="section-inner contact-layout">
        <div>
          <h2>{t.contactText}</h2>
          <p className="field-note">{t.contactNote}</p>
          <ContactLinks />
        </div>
        {attempted ? (
          <div className="contact-result" ref={resultRef} role="status" tabIndex={-1}>
            <p>{t.messageDemo}</p>
            <button className="button button-navy" onClick={() => setAttempted(false)} type="button">{t.writeAnother}</button>
          </div>
        ) : (
          <form
            className="contact-form"
            onInputCapture={clearFieldMessage}
            onInvalidCapture={(event) => handleInvalidField(event, t)}
            onSubmit={handleSubmit}
          >
            {/* A trap for spam bots, which fill every field. People never see it. */}
            <div aria-hidden="true" className="visually-hidden">
              <label>Leave this empty<input autoComplete="off" name="contact_url_2" tabIndex={-1} /></label>
            </div>
            <label>{t.name}<input autoComplete="name" name="name" ref={nameInputRef} required /></label>
            <label>{t.email}<input autoComplete="email" name="email" required type="email" /></label>
            <label>{t.message}<textarea name="message" required rows={4} /></label>
            {sendError && <p className="field-error" role="alert">{t.formSendFailed}</p>}
            <button className="button button-navy" disabled={isSending} type="submit">
              {isSending ? t.formSending : t.sendMessage}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
