import type { ReactNode } from "react";
export default function IPhoneFrame({ children }: { children: ReactNode }) {
  return <div className="phone-frame"><i className="side-button action"/><i className="side-button volume-up"/><i className="side-button volume-down"/><i className="side-button power"/><div className="phone-screen"><div className="dynamic-island"><i/></div>{children}</div></div>;
}
