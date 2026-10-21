"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { Scenario } from "@/engine/types";
import { useScenario } from "@/engine/useScenario";
import { unlockAudio } from "@/audio/sounds";
import IPhoneFrame from "./iPhoneFrame";
import StatusBar from "./StatusBar";
import ConversationHeader from "./ConversationHeader";
import MessageList from "./MessageList";
import InputBar from "./InputBar";
import Keyboard from "./Keyboard";
import HomeIndicator from "./HomeIndicator";
import Controls from "./Controls";
import SettingsModal from "./SettingsModal";
import { phoneSize, phoneVariables } from "@/lib/tokens";
import { presets } from "@/lib/scenarios";
import ScenarioPicker from "./ScenarioPicker";
import ScenarioEditor from "./ScenarioEditor";
import { useScenarioLibrary } from "@/lib/useScenarioLibrary";
import { useContactAvatars } from "@/lib/useContactAvatars";
import ZoomControl from "./ZoomControl";
export default function Stage() {
  const [scenario, setScenario] = useState<Scenario>(presets[0].scenario);
  const [revision, setRevision] = useState(0);
  const [muted, setMuted] = useState(false);
  const [fitScale, setFitScale] = useState(0.72);
  const [zoom, setZoom] = useState(100);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyboardLayout, setKeyboardLayout] = useState<"qwerty" | "azerty">(
    "qwerty",
  );
  const [meta, setMeta] = useState(scenario.meta);
  const stageRef = useRef<HTMLElement>(null);
  const phoneViewportRef = useRef<HTMLDivElement>(null);
  const scale = fitScale * zoom / 100;
  const player = useScenario(scenario, muted);
  const avatars = useContactAvatars();
  const avatar = avatars.get(meta.contact);
  useEffect(() => {
    const resize = () =>
      setFitScale(
        Math.max(
          0.2,
          Math.min(
            1,
            (window.innerHeight - 260) / phoneSize.height,
            ((phoneViewportRef.current?.clientWidth ?? window.innerWidth) - 20) /
              phoneSize.width,
          ),
        ),
      );
    const observer = new ResizeObserver(resize);
    if (stageRef.current) observer.observe(stageRef.current);
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);
  function play() {
    void unlockAudio().catch(() => {});
    player.play();
  }
  function applyScenario(next: Scenario, autoplay: boolean) {
    player.reset();
    setScenario(next);
    setMeta(next.meta);
    setRevision((value) => value + 1);
    if (autoplay) play();
  }
  const library = useScenarioLibrary(applyScenario);
  const progress = player.duration > 0
    ? Math.min(100, Math.max(0, player.elapsed / player.duration * 100))
    : 0;
  return (
    <main className="studio">
      <header className="studio-header">
        <Link className="brand" href="/">
          iMessage<span>studio</span>
          <i>by code-ste</i>
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-[1000px] flex-1 px-6 sm:px-20">
        <section
          ref={stageRef}
          className="stage"
          aria-label="Simulateur iMessage"
        >
          <div className="phone-preview">
            <div className="phone-viewport" ref={phoneViewportRef}>
              <div
                className="phone-space"
                style={{
                  ...phoneVariables,
                  width: phoneSize.width * scale,
                  height: phoneSize.height * scale,
                }}
              >
                <div
                  className="phone-scale"
                  style={{ transform: `scale(${scale})` }}
                >
                  <IPhoneFrame>
                    <StatusBar status={meta.statusBar} />
                    <ConversationHeader name={meta.contact.name} avatar={avatar} onBack={player.reset} />
                    <MessageList key={revision} player={player} />
                    <InputBar
                      draft={player.draft}
                      keyboardVisible={player.started}
                      playing={player.playing}
                    />
                    <AnimatePresence>
                      {player.started && (
                        <Keyboard
                          key="keyboard"
                          keyPress={player.keyPress}
                          elapsed={player.elapsed}
                          playing={player.playing}
                          draft={player.draft}
                          speed={player.speed}
                          layout={keyboardLayout}
                        />
                      )}
                    </AnimatePresence>
                    <HomeIndicator keyboardVisible={player.started} />
                    {!player.started && (
                      <div className="absolute inset-x-0 top-[calc(64px+var(--conversation-header-height))] bottom-20 z-[3] flex flex-col bg-white px-6 pt-4 pb-5">
                        <div className="shrink-0 text-center">
                          <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-1px] text-[#25252b]">
                            Conversations
                          </h1>
                        </div>
                        <ScenarioPicker library={library} scenario={scenario} getAvatar={avatars.get} />
                        <div className="mt-4 shrink-0 text-center">
                          <span className="mb-3 block text-[11px] text-[#a4a4ac]">
                            {meta.contact.name} ·{" "}
                            {
                              scenario.events.filter((e) => e.type === "message")
                                .length
                            }{" "}
                            messages
                          </span>
                          <button type="button" onClick={play} className="flex w-full items-center justify-center gap-2 rounded-full border-0 bg-[#0a84ff] px-5 py-4 text-[14px] font-medium text-white">
                            <Play size={16} fill="currentColor" aria-hidden="true" /> Démarrer
                          </button>
                        </div>
                      </div>
                    )}
                  </IPhoneFrame>
                </div>
              </div>
            </div>
          </div>
          <div className="player-panel">
            <div
              className="mx-1.5 mb-3 h-0.5 overflow-hidden rounded-full bg-[#d9d6de]"
              role="progressbar"
              aria-label="Progression du scénario"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[#8f8a9c]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Controls
              player={player}
              onPlay={play}
              muted={muted}
              onMute={() => setMuted(!muted)}
            />
          </div>
        </section>
      </div>
      <ZoomControl value={zoom} onChange={setZoom} settingsOpen={settingsOpen} onOpenSettings={() => setSettingsOpen(true)} />
      <footer className="studio-footer">
        <span>Fait pour raconter, message après message.</span>
        <span>iPhone 17 · Vue de face</span>
      </footer>
      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal
            key="settings"
            onClose={() => setSettingsOpen(false)}
            muted={muted}
            onSoundChange={(enabled) => {
              if (enabled) void unlockAudio().catch(() => {});
              setMuted(!enabled);
            }}
            speed={player.speed}
            onSpeedChange={player.setSpeed}
            meta={meta}
            onMetaChange={setMeta}
            avatar={avatar}
            onAvatarChange={next => avatars.set(meta.contact.name, next)}
            keyboardLayout={keyboardLayout}
            onKeyboardLayoutChange={setKeyboardLayout}
            scenarioEditor={<ScenarioEditor library={library} onPreview={() => setSettingsOpen(false)} />}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
