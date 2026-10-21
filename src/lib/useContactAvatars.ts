"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Scenario } from "@/engine/types";
import { avatarStorageEvent, avatarStorageKey, parseContactAvatars, resolveContactAvatar, writeContactAvatar } from "./contactAvatars";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(avatarStorageEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(avatarStorageEvent, listener);
  };
}

function getStorage() {
  try { return localStorage.getItem(avatarStorageKey) ?? "{}"; }
  catch { return "{}"; }
}

function getServerStorage() { return "{}"; }

export function useContactAvatars() {
  const source = useSyncExternalStore(subscribe, getStorage, getServerStorage);
  const avatars = useMemo(() => parseContactAvatars(source), [source]);

  function get(contact: Scenario["meta"]["contact"]) {
    return resolveContactAvatar(avatars, contact);
  }

  function set(name: string, avatar: string | null) {
    try {
      writeContactAvatar(localStorage, name, avatar);
      window.dispatchEvent(new Event(avatarStorageEvent));
    } catch {
      throw new Error("Impossible d’enregistrer la photo dans ce navigateur. Vérifiez l’espace de stockage disponible.");
    }
  }

  return { get, set };
}
