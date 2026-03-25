import React from "react";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}

const sizes = {
  sm: { icon: 32, fontSize: 13, gap: 8 },
  md: { icon: 44, fontSize: 17, gap: 10 },
  lg: { icon: 56, fontSize: 22, gap: 14 },
};

export default function Logo({
  variant = "light",
  size = "md",
  showWordmark = true,
}: LogoProps) {
  const { icon, fontSize, gap } = sizes[size];
  const isDark = variant === "dark";

  const iconBg = isDark ? "#1a3a5c" : "#0f4c8a";
  const ringColor = "#ffffff";
  const alertRed = "#e84040";
  const textMain = isDark ? "#ffffff" : "#0f1923";
  const textAccent = isDark ? "#7eb8f7" : "#0f4c8a";

  const r = icon / 2;
  const outerR = r * 0.58;
  const innerR = r * 0.23;
  const dotR = r * 0.08;
  const spokeLong = r * 0.25;
  const spokeShort = r * 0.16;

  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <svg
        width={icon}
        height={icon}
        viewBox={`0 0 ${icon} ${icon}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width={icon} height={icon} rx={icon * 0.18} fill={iconBg} />
        <circle
          cx={r}
          cy={r}
          r={outerR}
          fill="none"
          stroke={ringColor}
          strokeWidth={icon * 0.035}
        />
        {[
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ].map(([dx, dy], i) => (
          <line
            key={i}
            x1={r + dx * outerR}
            y1={r + dy * outerR}
            x2={r + dx * (outerR + spokeLong)}
            y2={r + dy * (outerR + spokeLong)}
            stroke={ringColor}
            strokeWidth={icon * 0.035}
            strokeLinecap="round"
          />
        ))}
        {[
          [-1, -1],
          [1, 1],
          [-1, 1],
          [1, -1],
        ].map(([dx, dy], i) => {
          const d = Math.SQRT1_2;
          return (
            <line
              key={i}
              x1={r + dx * d * outerR}
              y1={r + dy * d * outerR}
              x2={r + dx * d * (outerR + spokeShort)}
              y2={r + dy * d * (outerR + spokeShort)}
              stroke={ringColor}
              strokeWidth={icon * 0.025}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={r} cy={r} r={innerR} fill={alertRed} />
        <circle cx={r} cy={r} r={dotR} fill="#ffffff" />
      </svg>

      {showWordmark && (
        <div style={{ lineHeight: 1.1 }}>
          <div
            style={{
              fontSize,
              fontWeight: 700,
              color: textMain,
              letterSpacing: "-0.02em",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            Outage
          </div>
          <div
            style={{
              fontSize,
              fontWeight: 400,
              color: textAccent,
              letterSpacing: "-0.02em",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            Intel
          </div>
        </div>
      )}
    </div>
  );
}
