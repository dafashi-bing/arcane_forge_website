"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { analyticsSlides, portfolioCases } from "./evidence";

const pad = (value: number) => String(value).padStart(2, "0");

export default function ServicesGallery({ analytics = false }: { analytics?: boolean }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const prefix = analytics ? "analytics" : "case";
  const cases = analytics
    ? analyticsSlides.map(item => ({ ...item, slides: [{ ...item, label: item.tab, title: item.detailTitle }] }))
    : portfolioCases;
  const currentCase = cases[caseIndex];
  const slide = currentCase.slides[slideIndex];
  const total = analytics ? cases.length : currentCase.slides.length;
  const position = analytics ? caseIndex : slideIndex;
  const thumbnails = analytics ? analyticsSlides : currentCase.slides;

  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [dialogOpen]);

  function selectCase(index: number) {
    setCaseIndex(index);
    setSlideIndex(0);
  }

  function move(direction: number) {
    if (analytics) selectCase((caseIndex + direction + cases.length) % cases.length);
    else setSlideIndex((slideIndex + direction + currentCase.slides.length) % currentCase.slides.length);
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | undefined;
    if (event.key === "ArrowRight") next = (index + 1) % cases.length;
    if (event.key === "ArrowLeft") next = (index - 1 + cases.length) % cases.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = cases.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectCase(next);
      tabs.current[next]?.focus();
    }
  }

  function onSlideKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    }
  }

  function openDialog() {
    dialog.current?.showModal();
    setDialogOpen(true);
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.current?.close();
    }
  }

  return (
    <div className={analytics ? "analytics-gallery" : "project-gallery"}>
      <div className="case-tabs" role="tablist" aria-label={analytics ? "Analytics examples" : "Select a project"} id={`${prefix}-tabs`} style={{ gridTemplateColumns: `repeat(${cases.length}, 1fr)` }}>
        {cases.map((item, index) => (
          <button key={item.id} ref={element => { tabs.current[index] = element; }} className="case-tab" type="button" role="tab" id={`${prefix}-tab-${item.id}`} aria-controls={`${prefix}-panel`} aria-selected={index === caseIndex} tabIndex={index === caseIndex ? 0 : -1} onClick={() => selectCase(index)} onKeyDown={event => onTabKey(event, index)}>
            <span className="tab-number">{pad(index + 1)}</span><span className="tab-title">{item.tab}</span>
          </button>
        ))}
      </div>
      <div className="case-stage" role="tabpanel" id={`${prefix}-panel`} aria-labelledby={`${prefix}-tab-${currentCase.id}`} tabIndex={0} onKeyDown={event => { if (event.target === event.currentTarget) onSlideKey(event); }}>
        <div className="case-viewer">
          <div className="viewer-toolbar"><span className="viewer-label">{slide.label}</span><span className="viewer-count" aria-live="polite">{pad(position + 1)} / {pad(total)}</span></div>
          <button className="slide-image-button" id={analytics ? "analytics-zoom" : "slide-zoom"} type="button" onClick={openDialog} aria-label={`Enlarge ${analytics ? "analytics " : ""}screenshot: ${slide.title}`} style={analytics ? { aspectRatio: `${analyticsSlides[caseIndex].width} / ${analyticsSlides[caseIndex].height}` } : undefined}>
            <img id={analytics ? "analytics-image" : "slide-image"} src={slide.src} alt={slide.alt} width={analytics ? analyticsSlides[caseIndex].width : 1600} height={analytics ? analyticsSlides[caseIndex].height : 900} loading="lazy" />
            <span className="zoom-icon" aria-hidden="true">⤢</span>
          </button>
          <div className="viewer-bottom"><span>{slide.short}</span><div className="slide-arrows"><button type="button" aria-label={analytics ? "Previous analytics screenshot" : "Previous feature"} onClick={() => move(-1)}><span aria-hidden="true">←</span></button><button type="button" aria-label={analytics ? "Next analytics screenshot" : "Next feature"} onClick={() => move(1)}><span aria-hidden="true">→</span></button></div></div>
        </div>
        <div className="case-commentary">
          <h3 style={{ whiteSpace: "pre-line" }}>{currentCase.title}</h3>
          <p className="case-summary">{currentCase.summary}</p>
          <div className="feature-caption" aria-live="polite"><h4>{slide.title}</h4><p>{slide.description}</p></div>
        </div>
      </div>
      <div className="gallery-footer"><div className="slide-thumbnails" aria-label={analytics ? "Analytics screenshots" : "Feature screenshots"}>
        {thumbnails.map((item, index) => (
          <button key={item.src} type="button" className="thumbnail-button" aria-label={analytics ? `Show analytics screenshot: ${analyticsSlides[index].tab}` : `Show feature ${index + 1}: ${item.title}`} aria-current={index === position ? "true" : "false"} onClick={() => analytics ? selectCase(index) : setSlideIndex(index)}>
            <img src={item.src} alt="" loading="lazy" width={160} height={90} />
          </button>
        ))}
      </div></div>
      <dialog ref={dialog} className="image-dialog" aria-labelledby={`${prefix}-dialog-title`} onClose={() => setDialogOpen(false)} onClick={onBackdropClick} onKeyDown={onSlideKey}>
        <div className="dialog-top"><h2 id={`${prefix}-dialog-title`}>{currentCase.tab}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Close enlarged screenshot">Close <span aria-hidden="true">×</span></button></div>
        <div className="dialog-image-wrap"><img src={slide.src} alt={slide.alt} /></div>
        <p>{slide.title} — {slide.description}</p>
      </dialog>
    </div>
  );
}
