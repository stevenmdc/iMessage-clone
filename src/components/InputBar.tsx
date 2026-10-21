import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function InputBar({ draft, keyboardVisible, playing }: { draft: string; keyboardVisible: boolean; playing: boolean }) {
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (text.current) text.current.scrollTop = text.current.scrollHeight; }, [draft]);
  return <div className={`input-bar ${playing ? "" : "input-paused"}`} aria-hidden="true"><span className="glass-icon plus">+</span><div className={`message-input ${draft ? "has-draft" : ""}`}><span ref={text} className="draft-text">{draft || <span className="input-placeholder">iMessage</span>}{keyboardVisible && <i className="input-caret"/>}</span>{draft ? <span className="send-indicator"><ArrowUp size={20} strokeWidth={3}/></span> : <svg width="20" height="22" viewBox="0 0 20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 9v4M6 5v12M10 2v18M14 6v10M18 9v4"/></svg>}</div></div>;
}
