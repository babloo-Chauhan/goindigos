"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { formatClosingDate } from "../data/jobs";
import { prefersReducedMotion } from "../lib/pageMotion";

const BOARD_ROWS = 4;
const CYCLE_MS = 4500;

function FlapCell({ value, delay, className = "" }) {
  return (
    <span className={`flap ${className}`}>
      <AnimatePresence initial mode="wait">
        <motion.span
          animate={{ rotateX: 0, transition: { delay, duration: 0.22, ease: "easeOut" } }}
          className="flap-text"
          exit={{ rotateX: 90, transition: { delay, duration: 0.14, ease: "easeIn" } }}
          initial={{ rotateX: -90 }}
          key={value}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function DepartureBoard({ jobs, language, t }) {
  const boardRef = useRef(null);
  const isInView = useInView(boardRef);
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const canCycle = jobs.length > BOARD_ROWS;

  useEffect(() => {
    if (!canCycle || isPaused || !isInView || prefersReducedMotion()) return undefined;
    const timer = setInterval(() => setOffset((current) => current + 1), CYCLE_MS);
    return () => clearInterval(timer);
  }, [canCycle, isInView, isPaused]);

  const rowCount = Math.min(BOARD_ROWS, jobs.length);
  const rows = Array.from({ length: rowCount }, (_, index) => jobs[(offset + index) % jobs.length]);

  return (
    <figure className="board" ref={boardRef}>
      <div aria-hidden="true">
        <div className="board-row board-head">
          <span>{t.boardRole}</span>
          <span className="board-city">{t.boardCity}</span>
          <span>{t.boardCloses}</span>
        </div>
        {rows.map((job, rowIndex) => (
          <div className="board-row" key={rowIndex}>
            <FlapCell delay={rowIndex * 0.09} value={job.title[language]} />
            <FlapCell className="board-city" delay={rowIndex * 0.09 + 0.05} value={job.location[language]} />
            <FlapCell className="flap-date" delay={rowIndex * 0.09 + 0.1} value={formatClosingDate(job.expiresAt, language)} />
          </div>
        ))}
      </div>
      <figcaption className="board-caption">
        <span>{t.boardCaption}</span>
        {canCycle && (
          <button
            aria-label={isPaused ? t.boardPlay : t.boardPause}
            className="board-toggle"
            onClick={() => setIsPaused(!isPaused)}
            type="button"
          >
            {isPaused ? <Play aria-hidden="true" size={15} /> : <Pause aria-hidden="true" size={15} />}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
