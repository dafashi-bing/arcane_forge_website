"use client";
export default function CrmError({ reset }: { error: Error; reset: () => void }) { return <div className="crm-gate"><p className="crm-eyebrow">PRIVATE CRM</p><h1>Workspace unavailable</h1><p>The request could not be completed. Your private records are protected.</p><button type="button" className="crm-button" onClick={reset}>Try again</button></div>; }
