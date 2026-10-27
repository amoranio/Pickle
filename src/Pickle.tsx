export function Pickle({
  pose = "welcome",
}: {
  pose?: "welcome" | "think" | "celebrate";
}) {
  return (
    <svg
      className={`pickle pickle-${pose}`}
      viewBox="0 0 400 390"
      role="img"
      aria-label={`Pickle the green dinosaur, ${pose === "think" ? "thinking" : pose === "celebrate" ? "celebrating" : "waving"}`}
    >
      <ellipse
        cx="206"
        cy="352"
        rx="134"
        ry="19"
        fill="#15281d"
        opacity=".12"
      />
      <g
        stroke="#17251c"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M253 218q78 53 112-14 12 103-102 104" fill="#55b947" />
        <path d="m270 240 21-18 8 31 23-17 3 29" fill="#ffbd37" />
        <path
          d="M130 184q-37 36-32 91l-15 46q-7 20 23 23h47l13-20 42 2 3 20h53q24-1 15-22l-23-51q5-62-32-93"
          fill="#74d64d"
        />
        <path
          d="M225 205q35 48 14 101l25 26h-40l-12-21-47 2-16 19h-38l23-29q-23-44 7-90"
          fill="#54b745"
          stroke="none"
        />
        <path d="M151 231q-29 23-15 63 28 27 78 2 16-47-16-65" fill="#d3ee8d" />
        <path
          d="m111 101-19-25 36-5-9-30 37 9 9-27 26 25 21-22 14 34"
          fill="#ffbd37"
        />
        <path
          d="M120 66q46-31 97 0 25 17 27 49 52 1 57 33 9 44-53 61l-77 4q-74-1-76-65-3-54 25-82Z"
          fill="#74d64d"
        />
        <path
          d="M102 152q16 48 78 44l69-5q30-7 45-27-2 36-48 45l-75 4q-61-1-69-61Z"
          fill="#4eaf40"
          stroke="none"
        />
        <path d="M144 99q7-25 24-11 12 14 3 36-21 7-27-7Z" fill="white" />
        <path d="M197 99q5-24 21-10 11 17 2 34-20 6-22-8Z" fill="white" />
        <ellipse cx="163" cy="108" rx="5" ry="9" fill="#17251c" stroke="none" />
        <ellipse cx="215" cy="109" rx="5" ry="9" fill="#17251c" stroke="none" />
        <path
          d={pose === "think" ? "M204 169q16-9 33-2" : "M183 166q25 27 57 0"}
          fill={pose === "think" ? "none" : "#17251c"}
        />
        {pose !== "think" && (
          <path d="m203 177 10 10 10-12" fill="white" strokeWidth="3" />
        )}
        <path d="m261 143 1 1m-23-4 1 1" strokeWidth="8" />
        <path
          d="M111 222q-36 8-51-27l-14-34q-4-13 7-16 10-3 15 14l10 18-1-27q1-14 12-11 8 2 8 19l3 25 11 1"
          fill="#74d64d"
        />
        <path
          d={
            pose === "celebrate"
              ? "M244 226q36-16 44-49l11-29q8-12 16-4 8 8-1 25l-4 14 14-13q11-9 17 0 4 8-11 20l-30 35q-20 23-49 24"
              : pose === "think"
                ? "M241 237q36 2 34-23l-27-37q-10-10-18-1-6 7 3 19l8 13-17 4"
                : "M244 229q32 27 46 12 10-14-11-27l-22-16"
          }
          fill="#74d64d"
        />
        <path
          d="m103 335 2-10m15 10 3-10m112 14-2-10m18 10-3-10"
          fill="none"
          strokeWidth="4"
        />
      </g>
      <g fill="#fff9dc" stroke="#17251c" strokeWidth="3">
        <path d="m331 67 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" />
        <path d="m49 270 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" />
      </g>
    </svg>
  );
}
