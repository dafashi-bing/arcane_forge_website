import { PrivateLink } from "@/components/crm/ui";
export default function NotFound() { return <div className="crm-gate"><p className="crm-eyebrow">PRIVATE CRM</p><h1>Contact not found</h1><p>This contact record could not be found.</p><PrivateLink href="/internal/crm/relationships" className="crm-button">All relationships</PrivateLink></div>; }
