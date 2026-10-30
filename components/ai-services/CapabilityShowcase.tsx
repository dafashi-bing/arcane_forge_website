import type { CSSProperties } from "react";
import {
  PiCheckCircleDuotone,
  PiDiamondsFourDuotone,
  PiFlagCheckeredDuotone,
  PiMonitorPlayDuotone,
  PiRobotDuotone,
  PiShieldCheckDuotone,
  PiStarFourDuotone,
  PiUsersThreeDuotone,
  PiWaveformDuotone,
} from "react-icons/pi";

const capabilities = [
  { kind: "characters", title: "NPCs & companions", detail: "Dialogue, memory & character behavior", accent: "var(--cyan)" },
  { kind: "stories", title: "Quests & stories", detail: "Adaptive campaigns & AI game masters", accent: "var(--amber)" },
  { kind: "progression", title: "Items, skills & tech trees", detail: "Generated content within your rules", accent: "color-mix(in srgb,var(--cyan) 65%,var(--amber))" },
  { kind: "safety", title: "Moderation & anti-cheat", detail: "Safer text, voice & multiplayer", accent: "color-mix(in srgb,var(--cyan) 75%,#2dd4bf)" },
  { kind: "players", title: "Matchmaking & difficulty", detail: "Skill, challenge & player analytics", accent: "color-mix(in srgb,var(--cyan) 45%,var(--amber))" },
  { kind: "production", title: "Testing & creative tools", detail: "QA agents, voice, animation & content", accent: "color-mix(in srgb,var(--amber) 75%,var(--cyan))" },
] as const;

type CapabilityKind = (typeof capabilities)[number]["kind"];

function CapabilityIllustration({ kind }: { kind: CapabilityKind }) {
  return (
    <div className="capability-artwork" aria-hidden="true">
      <svg viewBox="0 0 280 112" fill="none" focusable="false">
        {kind === "characters" && <>
          <path className="scene-wire" d="M83 70h27l17 17h24 M88 40h28l12-12" />
          <circle className="scene-orbit" cx="62" cy="55" r="45" />
          <PiRobotDuotone x="27" y="20" size={70} />
          <path className="scene-tile" d="M133 14h97a8 8 0 0 1 8 8v23a8 8 0 0 1-8 8h-65l-17 12V53h-15a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8Z" />
          <path className="scene-ink" d="M143 30h65 M143 39h43" />
          <rect className="scene-tile" x="154" y="73" width="80" height="24" rx="12" />
          <circle className="scene-dot" cx="173" cy="85" r="3" /><circle className="scene-dot" cx="186" cy="85" r="3" /><circle className="scene-dot" cx="199" cy="85" r="3" />
        </>}
        {kind === "stories" && <>
          <path className="scene-wire" d="M30 82h38c15 0 17-21 31-21h34c18 0 15-34 34-34h48 M132 61c17 0 18 27 36 27h47" />
          <circle className="scene-tile" cx="31" cy="82" r="10" />
          <circle className="scene-dot" cx="31" cy="82" r="3" />
          <rect className="scene-tile" x="91" y="37" width="46" height="46" rx="13" />
          <PiStarFourDuotone x="98" y="44" size={32} />
          <rect className="scene-tile" x="204" y="10" width="50" height="42" rx="12" />
          <PiFlagCheckeredDuotone x="212" y="15" size={34} />
          <circle className="scene-tile" cx="231" cy="87" r="15" />
          <path className="scene-ink" d="m226 87 4 4 7-8" />
          <circle className="scene-spark" cx="166" cy="27" r="3" />
        </>}
        {kind === "progression" && <>
          <path className="scene-wire" d="M140 58V19 M140 58H63V32 M140 58h77V32 M140 58v32H71 M140 90h69" />
          <rect className="scene-tile" x="41" y="10" width="44" height="33" rx="9" />
          <path className="scene-ink" d="m55 27 6 5 10-12" />
          <rect className="scene-tile" x="195" y="10" width="44" height="33" rx="9" />
          <path className="scene-ink" d="M210 27h14 M217 20v14" />
          <circle className="scene-tile" cx="140" cy="58" r="31" />
          <PiDiamondsFourDuotone x="110" y="28" size={60} />
          <circle className="scene-dot" cx="140" cy="14" r="5" />
          <rect className="scene-tile" x="44" y="80" width="53" height="21" rx="6" /><rect className="scene-tile" x="183" y="80" width="53" height="21" rx="6" />
          <path className="scene-ink" d="M57 90h27 M196 90h27" />
        </>}
        {kind === "safety" && <>
          <circle className="scene-orbit" cx="70" cy="55" r="43" />
          <PiShieldCheckDuotone x="34" y="19" size={72} />
          <path className="scene-wire" d="M113 55h27 M132 24v63 M132 24h22 M132 87h22" />
          <rect className="scene-tile" x="153" y="10" width="93" height="30" rx="8" />
          <path className="scene-ink" d="M165 25h43" />
          <PiCheckCircleDuotone x="222" y="16" size={18} />
          <rect className="scene-tile" x="153" y="73" width="93" height="30" rx="8" />
          <path className="scene-wave" d="M166 88h5l4-7 5 14 5-19 5 23 5-11h9" />
          <PiCheckCircleDuotone x="222" y="79" size={18} />
          <path className="scene-filter" d="M146 47h97 M165 56h56" />
        </>}
        {kind === "players" && <>
          <rect className="scene-tile" x="20" y="9" width="72" height="64" rx="16" /><rect className="scene-tile" x="188" y="9" width="72" height="64" rx="16" />
          <PiUsersThreeDuotone x="28" y="13" size={56} /><PiUsersThreeDuotone x="196" y="13" size={56} />
          <path className="scene-wire" d="M93 41h29 M158 41h29" />
          <circle className="scene-tile" cx="140" cy="41" r="18" />
          <path className="scene-ink" d="M133 37h14 M133 45h14" />
          <path className="scene-wire" d="M53 94h174" />
          <path className="scene-ink" d="M53 94h91" />
          <circle className="scene-tile" cx="144" cy="94" r="9" /><circle className="scene-dot" cx="144" cy="94" r="3" />
          <path className="scene-tick" d="M53 89v10 M96 90v8 M184 90v8 M227 89v10" />
        </>}
        {kind === "production" && <>
          <rect className="scene-tile" x="29" y="7" width="222" height="98" rx="12" />
          <path className="scene-wire" d="M30 26h220 M128 27v77" />
          <circle className="scene-dot" cx="42" cy="17" r="2" /><circle className="scene-dot" cx="51" cy="17" r="2" /><circle className="scene-dot" cx="60" cy="17" r="2" />
          <PiMonitorPlayDuotone x="44" y="31" size={70} />
          <PiCheckCircleDuotone x="143" y="36" size={21} /><path className="scene-ink" d="M174 46h53" />
          <PiWaveformDuotone x="143" y="63" size={29} />
          <path className="scene-wave" d="M184 79h4l3-8 5 17 5-23 5 25 5-15 4 4h14" />
        </>}
      </svg>
    </div>
  );
}

export default function CapabilityShowcase() {
  return (
    <section className="capabilities-section section-shell" id="capabilities" aria-labelledby="capabilities-title">
      <div className="capabilities-heading">
        <div>
          <p className="eyebrow">POSSIBILITIES TO EXPLORE</p>
          <h2 id="capabilities-title">What if your game<br /><em>could do more?</em></h2>
        </div>
        <p className="capabilities-intro">Characters, worlds, player experiences, and the tools behind them. Bring us your idea.</p>
      </div>
      <div className="capabilities-grid">
        {capabilities.map((capability, index) => (
          <a className="capability-card" href="#contact" key={capability.kind} style={{ "--cap-accent": capability.accent } as CSSProperties}>
            <span className="capability-number" aria-hidden="true">0{index + 1}</span>
            <CapabilityIllustration kind={capability.kind} />
            <h3>{capability.title}</h3>
            <p>{capability.detail}</p>
            <span className="capability-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
      <div className="capabilities-footer">
        <p><span aria-hidden="true" />Custom work, shaped around your game.</p>
        <a className="text-link" href="#contact">What do you have in mind? <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}
