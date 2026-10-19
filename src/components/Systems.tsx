"use client";

import { systems } from "@/lib/content";
import { race } from "@/lib/race";

// The car's systems, each standing for a group of skills. Pointing at one lights that
// part of the 3D car and fades the rest.
export default function Systems() {
  const focus = (part: string) => () => {
    race.focus = part;
  };

  return (
    <ul className="systems" onPointerLeave={focus("")}>
      {systems.map((s, i) => (
        <li
          key={s.part}
          className="system reveal"
          tabIndex={0}
          onPointerEnter={focus(s.part)}
          onFocus={focus(s.part)}
          onBlur={focus("")}
        >
          <span className="system__no mono">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 className="system__name">
              {s.name} <small className="mono">{s.role}</small>
            </h3>
            <p className="system__items">{s.items.join(" · ")}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
