"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Info, X } from "lucide-react";
import { clearDraft, restoreDraft, saveDraft } from "../lib/applicationDraft";
import { clearFieldMessage, handleInvalidField } from "../lib/formMessages";
import { popInElement } from "../lib/pageMotion";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const INDIAN_MOBILE_PATTERN = "(\\+91[ \\-]?)?[6-9][0-9]{9}";

function getResumeError(file, t) {
  if (!file) return "";
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return t.resumeType;
  return file.size > MAX_RESUME_BYTES ? t.resumeSize : "";
}

function ApplicationSteps({ current, steps, t }) {
  return (
    <div className="stepper">
      <p className="stepper-label">{t.stepLabel(current + 1, steps.length)}: {steps[current]}</p>
      <ol aria-hidden="true">
        {steps.map((step, index) => (
          <li className={index <= current ? "step-reached" : undefined} key={step}>
            <span className="step-dot">{index < current ? <Check size={14} /> : index + 1}</span>
            <span className="step-name">{step}</span>
          </li>
        ))}
      </ol>
      <span aria-hidden="true" className="stepper-track">
        <motion.span animate={{ scaleX: (current + 1) / steps.length }} className="stepper-fill" initial={false} />
      </span>
    </div>
  );
}

export default function ApplicationDialog({ job, language, onClose, t }) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const successRef = useRef(null);
  const successHeadingRef = useRef(null);
  const pressStartedOnBackdrop = useRef(false);
  const hasChangedStep = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [step, setStep] = useState(0);
  const lastStep = t.applySteps.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      dialog.close();
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    restoreDraft(formRef.current);
  }, []);

  useEffect(() => {
    if (!submitted) return;
    clearDraft();
    successHeadingRef.current?.focus();
    popInElement(successRef.current);
  }, [submitted]);

  useEffect(() => {
    if (!hasChangedStep.current) return;
    const fieldset = formRef.current?.querySelector(`[data-step="${step}"]`);
    fieldset?.querySelector("input, select")?.focus();
    popInElement(fieldset);
  }, [step]);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current && pressStartedOnBackdrop.current) onClose();
  }

  function handleResumeChange(event) {
    const error = getResumeError(event.target.files?.[0], t);
    event.target.setCustomValidity(error);
    setResumeError(error);
  }

  function goToStep(nextStep) {
    hasChangedStep.current = true;
    setStep(nextStep);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const fields = formRef.current.querySelectorAll(`[data-step="${step}"] input, [data-step="${step}"] select`);
    if (![...fields].every((field) => field.reportValidity())) return;
    if (step < lastStep) goToStep(step + 1);
    else {
      setIsSending(true);
      setSendError(false);
      const formData = new FormData(formRef.current);
      formData.set("type", "application");
      formData.set("jobTitle", jobTitle);

      try {
        const response = await fetch("/api/forms", { method: "POST", body: formData });
        if (!response.ok) throw new Error(`Application submission failed (${response.status}).`);
        setSubmitted(true);
      } catch (error) {
        console.error("[application] Submission failed:", error);
        setSendError(true);
      } finally {
        setIsSending(false);
      }
    }
  }

  const jobTitle = job.title[language];

  return (
    <motion.dialog
      animate={{ opacity: 1, y: 0 }}
      aria-labelledby="application-title"
      className="application-dialog"
      data-lenis-prevent
      exit={{ opacity: 0, y: 16 }}
      initial={{ opacity: 0, y: 24 }}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      onMouseDown={(event) => { pressStartedOnBackdrop.current = event.target === dialogRef.current; }}
      ref={dialogRef}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="dialog-body">
        <button aria-label={t.close} className="dialog-close" onClick={onClose} type="button">
          <X aria-hidden="true" size={20} />
        </button>
        {submitted ? (
          <div ref={successRef} role="status">
            <h2 id="application-title" ref={successHeadingRef} tabIndex={-1}>{t.successTitle}</h2>
            <p className="dialog-text">{t.successText}</p>
            <button className="button button-navy" onClick={onClose} type="button">{t.close}</button>
          </div>
        ) : (
          <>
            <h2 id="application-title">{t.modalApply} {jobTitle}</h2>
            <p className="demo-notice">
              <Info aria-hidden="true" size={18} />
              <span>{t.modalDemo}</span>
            </p>
            <ApplicationSteps current={step} steps={t.applySteps} t={t} />
            <form
              noValidate
              onInputCapture={(event) => {
                clearFieldMessage(event);
                saveDraft(formRef.current);
              }}
              onInvalidCapture={(event) => handleInvalidField(event, t)}
              onSubmit={handleSubmit}
              ref={formRef}
            >
              <fieldset className="form-grid" data-step="0" hidden={step !== 0}>
                <legend className="visually-hidden">{t.applySteps[0]}</legend>
                <label>{t.fullName}<input autoComplete="name" name="name" required /></label>
                <label>
                  {t.mobile}
                  <input autoComplete="tel" inputMode="tel" name="mobile" pattern={INDIAN_MOBILE_PATTERN} required />
                  <span className="field-note">{t.mobileHint}</span>
                </label>
                <label>{t.email}<input autoComplete="email" name="email" required type="email" /></label>
                <label>{t.currentCity}<input name="currentCity" required /></label>
              </fieldset>
              <fieldset className="form-grid" data-step="1" hidden={step !== 1}>
                <legend className="visually-hidden">{t.applySteps[1]}</legend>
                <label>{t.preferredLocation}<input name="preferredLocation" required /></label>
                <label>{t.position}<input defaultValue={jobTitle} name="position" required /></label>
                <label>{t.qualificationField}<input name="qualification" required /></label>
                <label>
                  {t.experienceField}
                  <select defaultValue="" name="experience" required>
                    <option disabled value="">{t.selectOption}</option>
                    {t.experienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="form-wide">{t.skills}<input name="skills" placeholder={t.skillsHint} /></label>
              </fieldset>
              <fieldset className="form-grid" data-step="2" hidden={step !== 2}>
                <legend className="visually-hidden">{t.applySteps[2]}</legend>
                <label className="form-wide">
                  {t.resume}
                  <input
                    accept="application/pdf,.pdf"
                    aria-describedby={resumeError ? "resume-error" : undefined}
                    aria-invalid={Boolean(resumeError)}
                    name="resume"
                    onChange={handleResumeChange}
                    type="file"
                  />
                  {resumeError && <span className="field-error" id="resume-error">{resumeError}</span>}
                </label>
                <label className="consent form-wide">
                  <input name="consent" required type="checkbox" />
                  <span>{t.consent}</span>
                </label>
              </fieldset>
              <div className="form-actions">
                {step > 0 && (
                  <button className="button button-quiet" disabled={isSending} onClick={() => goToStep(step - 1)} type="button">{t.previousStep}</button>
                )}
                {sendError && <p className="field-error" role="alert">{t.formSendFailed}</p>}
                <button className="button button-navy" disabled={isSending} type="submit">
                  {isSending ? t.formSending : step < lastStep ? t.nextStep : t.submit}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </motion.dialog>
  );
}
