export default function ConversationHeader({ name }: { name: string }) {
  return <header className="conversation-header">
    <span className="glass-icon back" aria-hidden="true">‹</span>
    <div className="contact"><div className="avatar">{name.slice(0, 1)}</div><div className="contact-name">{name}<span> ›</span></div></div>
    <span className="glass-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="14" height="14" rx="4"/><path d="m16 9 6-3v12l-6-3z"/></svg></span>
  </header>;
}
