import type { Scenario } from "./types";

const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function parseScenario(source: string): Scenario {
  let value: unknown;
  try { value = JSON.parse(source); } catch { throw new Error("JSON invalide : vérifiez les virgules, guillemets et accolades."); }
  if (!record(value) || !record(value.meta)) throw new Error("Le scénario doit contenir meta et events.");
  const { meta, events } = value;
  if (typeof meta.title !== "string" || !meta.title.trim() || meta.title.length > 100) throw new Error("meta.title : renseignez un titre (100 caractères maximum).");
  if (meta.theme !== "light") throw new Error('meta.theme : seul le thème "light" est disponible.');
  if (!record(meta.contact) || typeof meta.contact.name !== "string" || !meta.contact.name.trim() || meta.contact.name.length > 30 || !(meta.contact.avatar === null || typeof meta.contact.avatar === "string")) throw new Error("meta.contact : nom requis (30 caractères maximum) et avatar null ou texte.");
  const status = meta.statusBar;
  if (!record(status) || typeof status.time !== "string" || !status.time.trim() || typeof status.network !== "string" || typeof status.wifi !== "boolean" || typeof status.charging !== "boolean" || typeof status.battery !== "number" || !Number.isFinite(status.battery) || status.battery < 0) throw new Error("meta.statusBar : heure libre non vide, réseau, Wi-Fi, batterie positive ou nulle et charging requis.");
  if (!Array.isArray(events) || events.length === 0 || events.length > 200) throw new Error("events : ajoutez entre 1 et 200 événements.");
  let messages = 0;
  let duration = 0;
  events.forEach((event: unknown, index) => {
    const fail = (detail: string): never => { throw new Error(`Événement ${index + 1} : ${detail}`); };
    if (!record(event)) return fail("objet attendu.");
    for (const field of ["delay", "typing"]) if (event[field] !== undefined && (typeof event[field] !== "number" || !Number.isFinite(event[field]) || event[field] < 0 || event[field] > 60000)) fail(`${field} doit être entre 0 et 60000 ms.`);
    duration += Number(event.delay ?? 0) + Number(event.typing ?? 0);
    switch (event.type) {
      case "timestamp": if (typeof event.label !== "string" || event.label.length > 100) fail("label attendu (100 caractères maximum)."); break;
      case "message":
        if (event.image !== undefined) {
          const image = event.image;
          if (!record(image) || typeof image.id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(image.id)
            || !Number.isInteger(image.width) || Number(image.width) < 1 || Number(image.width) > 4096
            || !Number.isInteger(image.height) || Number(image.height) < 1 || Number(image.height) > 4096
            || image.alt !== undefined && (typeof image.alt !== "string" || image.alt.length > 200)) fail("image : identifiant local, dimensions valides et description facultative (200 caractères maximum) attendus.");
        }
        if (!["me", "them"].includes(String(event.from)) || typeof event.text !== "string" || event.text.length > 1000 || !event.text.trim() && !event.image) fail("from doit être me/them ; text doit contenir un texte (1000 caractères maximum) ou être accompagné d’une image.");
        messages++; break;
      case "tapback":
      case "status":
        if (!Number.isInteger(event.target) || Number(event.target) < 0 || Number(event.target) >= messages) fail("target doit viser un message déjà présent (index à partir de 0).");
        if (event.type === "tapback" && (!["me", "them"].includes(String(event.from)) || !["heart", "thumbsUp", "thumbsDown", "haha", "exclamation", "question"].includes(String(event.kind)))) fail("réaction ou expéditeur inconnu.");
        if (event.type === "status" && !["delivered", "read"].includes(String(event.value))) fail("statut delivered/read attendu.");
        break;
      default: fail("type inconnu.");
    }
  });
  if (!messages) throw new Error("Ajoutez au moins un message.");
  if (duration > 600000) throw new Error("Les délais cumulés ne doivent pas dépasser 10 minutes.");
  return value as unknown as Scenario;
}
