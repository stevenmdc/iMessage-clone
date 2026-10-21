export default function HomeIndicator({ keyboardVisible = false }: { keyboardVisible?: boolean }) {
  return <div className={`home-area ${keyboardVisible ? "bg-[#e6e6ea]" : ""}`} aria-hidden="true" />;
}
