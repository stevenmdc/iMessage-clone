import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ConversationHeader({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <header className="conversation-header">
      <button type="button" className="glass-icon p-0 text-inherit" onClick={onBack} aria-label="Retour au choix des scénarios">
        <ChevronLeft size={30} strokeWidth={2} aria-hidden="true" />
      </button>
      <div className="contact">
        <div className="avatar">{name.slice(0, 1)}</div>
        <div className="contact-name">
          <span>{name}</span>
          <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
        </div>
      </div>
      <span className="glass-icon" aria-hidden="true">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="14" height="14" rx="4" />
          <path d="m16 9 6-3v12l-6-3z" />
        </svg>
      </span>
    </header>
  );
}
