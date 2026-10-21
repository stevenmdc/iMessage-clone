import { Check, Trash2 } from "lucide-react";
import { presets } from "@/lib/scenarios";
import type { ScenarioLibrary } from "@/lib/useScenarioLibrary";
import type { Scenario } from "@/engine/types";

export default function ScenarioPicker({ library, scenario }: {
  library: ScenarioLibrary;
  scenario: Scenario;
}) {
  const hasCustom = !presets.some(item => item.id === library.selected)
    && !library.saved.some(item => item.id === library.selected);
  const choices = [
    ...(hasCustom ? [{ id: library.selected, scenario, description: "Votre conversation personnalisée", personal: false }] : []),
    ...presets.map(item => ({ ...item, personal: false })),
    ...library.saved.map(item => ({ ...item, description: `${item.scenario.meta.contact.name} · Scénario enregistré`, personal: true })),
  ];

  return (
    <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]" role="group" aria-label="Choisir un scénario">
      <div className="flex flex-col gap-2">
        {choices.map(item => (
          <div key={item.id} className="flex items-center gap-1">
            <button
              type="button"
              aria-pressed={library.selected === item.id}
              onClick={() => library.select(item.id, item.scenario)}
              className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border p-3 text-left ${library.selected === item.id ? "border-[#0a84ff] bg-[#eff6ff]" : "border-[#e9e9ed] bg-[#f8f8fa] hover:bg-[#f1f1f5]"}`}
            >
              <span className="min-w-0">
                <strong className="block text-[14px] leading-[18px] font-semibold text-[#25252b]">{item.scenario.meta.title}</strong>
                <span className="mt-1 block text-[11px] leading-[15px] text-[#85858d]">{item.description}</span>
              </span>
              {library.selected === item.id && <Check size={17} className="shrink-0 text-[#0a84ff]" aria-hidden="true" />}
            </button>
            {item.personal && (
              <button type="button" onClick={() => library.remove(item.id)} aria-label={`Supprimer ${item.scenario.meta.title}`} className="grid size-8 shrink-0 place-items-center rounded-full border-0 bg-transparent text-[#99939f] hover:text-[#a65569]">
                <Trash2 size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      {library.notice && <p role="status" className="mt-3 text-[11px] leading-relaxed text-[#8e7b9b]">{library.notice}</p>}
    </div>
  );
}
