import type { Scenario } from "@/engine/types";

export const avatarStorageKey = "imessage-studio.avatars.v1";
export const avatarStorageEvent = "imessage-studio.avatars.changed";
export type ContactAvatars = Record<string, string | null>;

function isAvatar(value: unknown): value is string | null {
  return value === null || typeof value === "string"
    && /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(value);
}

export function contactAvatarKey(name: string) {
  return name.trim().normalize("NFC").toLocaleLowerCase("fr");
}

export function parseContactAvatars(source: string | null): ContactAvatars {
  try {
    const value: unknown = JSON.parse(source ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string | null] => isAvatar(entry[1])));
  } catch { return {}; }
}

export function resolveContactAvatar(avatars: ContactAvatars, contact: Scenario["meta"]["contact"]) {
  const key = contactAvatarKey(contact.name);
  return Object.hasOwn(avatars, key) ? avatars[key] : contact.avatar;
}

export function writeContactAvatar(storage: Pick<Storage, "getItem" | "setItem">, name: string, avatar: string | null) {
  if (!isAvatar(avatar)) throw new Error("Image de profil invalide.");
  const avatars = parseContactAvatars(storage.getItem(avatarStorageKey));
  const next = Object.fromEntries([...Object.entries(avatars), [contactAvatarKey(name), avatar]]);
  storage.setItem(avatarStorageKey, JSON.stringify(next));
}
