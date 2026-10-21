import type { Scenario } from "@/engine/types";
export default function StatusBar({ status }: { status: Scenario["meta"]["statusBar"] }) {
  return <div className="status-bar"><span>{status.time}</span><div className="status-icons">
    <svg width="19" height="15" viewBox="0 0 19 15" aria-label={status.network}><path d="M1 13V10M6 13V7M11 13V4M16 13V1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
    {status.wifi ? <svg width="19" height="15" viewBox="0 0 20 16" aria-label="Wi-Fi"><path d="M2 5Q10-1 18 5M5 8Q10 4 15 8M8 11Q10 9 12 11" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/><circle cx="10" cy="14" r="1.3"/></svg> : <small>{status.network}</small>}
    <div className="battery overflow-visible" aria-label={`Batterie ${status.battery}%${status.charging ? ', en charge' : ''}`}><span style={{ width: `${Math.max(0, status.battery)}%`, backgroundColor: status.battery > 100 ? "#34c759" : undefined }}/><b>{status.charging ? 'ϟ' : status.battery}</b></div>
  </div></div>;
}
