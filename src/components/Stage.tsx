"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
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
import ScenarioPanel from "./ScenarioPanel";
export default function Stage() {
  const [scenario, setScenario] = useState<Scenario>(presets[0].scenario);
  const [revision, setRevision] = useState(0);
  const [muted, setMuted] = useState(false);
  const [scale, setScale] = useState(0.72);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyboardLayout, setKeyboardLayout] = useState<"qwerty" | "azerty">(
    "qwerty",
  );
  const [meta, setMeta] = useState(scenario.meta);
  const stageRef = useRef<HTMLElement>(null);
  const player = useScenario(scenario, muted);
  useEffect(() => {
    const resize = () =>
      setScale(
        Math.max(
          0.2,
          Math.min(
            1,
            (window.innerHeight - 210) / phoneSize.height,
            ((stageRef.current?.clientWidth ?? window.innerWidth) - 40) /
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
  const finished = player.started && player.elapsed >= player.duration;
  return (
    <main className="studio">
      <header className="studio-header">
        <Link className="brand" href="/">
          iMessage<span>studio</span>
          <i>by code-ste</i>
        </Link>
        <div className="studio-header-actions">
          <button
            type="button"
            className="settings-button rounded-xl"
            aria-label="Ouvrir les paramètres"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            aria-controls={settingsOpen ? "app-settings" : undefined}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={19} strokeWidth={1.7} />
          </button>
        </div>
      </header>
      <div className="studio-workspace">
        <ScenarioPanel onApply={applyScenario} />
        <section
          ref={stageRef}
          className="stage"
          aria-label="Simulateur iMessage"
        >
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
                <ConversationHeader name={meta.contact.name} />
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
                  <div className="start-overlay">
                    <div className="start-card">
                      <div className="start-symbol">•••</div>
                      <h1>
                        Une conversation.
                        <br />
                        Un petit film.
                      </h1>
                      <p>
                        Les mots, les silences, les réactions.
                        <br />
                        Lancez le scénario pour les voir vivre.
                      </p>
                      <button onClick={play}>▶ Toucher pour démarrer</button>
                      <span>
                        {meta.contact.name} ·{" "}
                        {
                          scenario.events.filter((e) => e.type === "message")
                            .length
                        }{" "}
                        messages
                      </span>
                    </div>
                  </div>
                )}
              </IPhoneFrame>
            </div>
          </div>
          <div className="player-panel">
            <div className="scenario-caption">
              <span>
                <i className={player.playing ? "live" : ""} />
                {player.playing
                  ? "En lecture"
                  : finished
                    ? "Terminé"
                    : player.started
                      ? "En pause"
                      : "Prêt à jouer"}
              </span>
              <span>{scenario.meta.title}</span>
            </div>
            <Controls
              player={player}
              onPlay={play}
              muted={muted}
              onMute={() => setMuted(!muted)}
            />
            <div
              className="progress"
              role="progressbar"
              aria-label="Progression du scénario"
              aria-valuenow={Math.round(
                (player.elapsed / player.duration) * 100,
              )}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                style={{
                  width: `${(player.elapsed / player.duration) * 100}%`,
                }}
              />
            </div>
          </div>
        </section>
      </div>
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
            keyboardLayout={keyboardLayout}
            onKeyboardLayoutChange={setKeyboardLayout}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
