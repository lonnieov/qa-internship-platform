import type { CSSProperties } from "react";

type ConfettiPiece = readonly [
  x: string,
  y: string,
  rotation: string,
  duration: string,
  delay: string,
  size: string,
  color: string,
  shape?: "dot" | "strip",
];

type ConfettiStyle = CSSProperties & {
  "--confetti-x": string;
  "--confetti-y": string;
  "--confetti-rotation": string;
  "--confetti-duration": string;
  "--confetti-delay": string;
  "--confetti-size": string;
  "--confetti-color": string;
};

const confettiPieces = [
  ["-46vw", "-16vh", "-250deg", "1.1s", "0s", "14px", "#2dd4bf"],
  ["-42vw", "4vh", "210deg", "1.34s", "0.04s", "8px", "#f9a8d4", "strip"],
  ["-39vw", "18vh", "-160deg", "1.55s", "0.16s", "6px", "#22c55e", "dot"],
  ["-36vw", "-1vh", "115deg", "1.24s", "0.08s", "7px", "#67e8f9", "dot"],
  ["-34vw", "25vh", "-310deg", "1.62s", "0.2s", "15px", "#818cf8"],
  ["-31vw", "9vh", "280deg", "1.38s", "0.02s", "9px", "#f87171", "strip"],
  ["-29vw", "-24vh", "-70deg", "1.18s", "0.1s", "12px", "#5eead4"],
  ["-27vw", "31vh", "155deg", "1.7s", "0.18s", "10px", "#a78bfa"],
  ["-25vw", "14vh", "-205deg", "1.48s", "0.07s", "13px", "#86efac"],
  ["-23vw", "2vh", "70deg", "1.32s", "0.12s", "5px", "#f0abfc", "dot"],
  ["-21vw", "-10vh", "255deg", "1.2s", "0.05s", "11px", "#bae6fd", "strip"],
  ["-19vw", "21vh", "-145deg", "1.6s", "0.22s", "8px", "#34d399"],
  ["-17vw", "8vh", "305deg", "1.42s", "0.09s", "12px", "#fca5a5"],
  ["-15vw", "28vh", "-95deg", "1.66s", "0.13s", "7px", "#c4b5fd", "strip"],
  ["-13vw", "-6vh", "185deg", "1.28s", "0.03s", "10px", "#5eead4"],
  ["-11vw", "16vh", "-265deg", "1.5s", "0.15s", "6px", "#93c5fd", "dot"],
  ["-9vw", "5vh", "140deg", "1.36s", "0.06s", "14px", "#22c55e"],
  ["-7vw", "24vh", "-340deg", "1.64s", "0.19s", "9px", "#f9a8d4"],
  ["-5vw", "-18vh", "75deg", "1.16s", "0.01s", "8px", "#fde047", "strip"],
  ["-3vw", "11vh", "-185deg", "1.44s", "0.11s", "12px", "#fb7185"],
  ["0vw", "29vh", "320deg", "1.68s", "0.24s", "6px", "#f0abfc", "dot"],
  ["2vw", "-9vh", "-120deg", "1.26s", "0.05s", "13px", "#2dd4bf"],
  ["4vw", "17vh", "240deg", "1.52s", "0.14s", "8px", "#c4b5fd", "strip"],
  ["6vw", "7vh", "-285deg", "1.37s", "0.08s", "10px", "#60a5fa"],
  ["8vw", "25vh", "105deg", "1.63s", "0.2s", "14px", "#34d399"],
  ["10vw", "-2vh", "-60deg", "1.31s", "0.02s", "5px", "#67e8f9", "dot"],
  ["12vw", "14vh", "195deg", "1.46s", "0.12s", "12px", "#f87171"],
  ["14vw", "33vh", "-230deg", "1.74s", "0.25s", "7px", "#a78bfa", "strip"],
  ["16vw", "-15vh", "335deg", "1.14s", "0.06s", "9px", "#86efac"],
  ["18vw", "6vh", "-155deg", "1.35s", "0.1s", "13px", "#fbcfe8"],
  ["20vw", "20vh", "260deg", "1.58s", "0.17s", "11px", "#5eead4", "strip"],
  ["22vw", "11vh", "-315deg", "1.43s", "0.04s", "7px", "#818cf8"],
  ["24vw", "29vh", "145deg", "1.67s", "0.21s", "5px", "#22c55e", "dot"],
  ["26vw", "-7vh", "-95deg", "1.25s", "0.07s", "14px", "#fde047"],
  ["28vw", "16vh", "225deg", "1.5s", "0.13s", "9px", "#f0abfc"],
  ["30vw", "4vh", "-255deg", "1.33s", "0.09s", "8px", "#bae6fd", "strip"],
  ["32vw", "25vh", "85deg", "1.61s", "0.19s", "12px", "#34d399"],
  ["35vw", "-19vh", "-175deg", "1.17s", "0.03s", "6px", "#93c5fd", "dot"],
  ["38vw", "9vh", "300deg", "1.4s", "0.11s", "13px", "#c4b5fd"],
  ["41vw", "19vh", "-215deg", "1.56s", "0.18s", "10px", "#fb7185", "strip"],
  ["44vw", "-3vh", "125deg", "1.3s", "0.06s", "7px", "#67e8f9"],
  ["47vw", "27vh", "-330deg", "1.72s", "0.23s", "11px", "#22c55e"],
] satisfies readonly ConfettiPiece[];

export function CompletionConfetti() {
  return (
    <div aria-hidden="true" className="completion-confetti">
      {confettiPieces.map(
        ([x, y, rotation, duration, delay, size, color, shape], index) => {
          const style: ConfettiStyle = {
            "--confetti-x": x,
            "--confetti-y": y,
            "--confetti-rotation": rotation,
            "--confetti-duration": duration,
            "--confetti-delay": delay,
            "--confetti-size": size,
            "--confetti-color": color,
          };

          return (
            <span
              className="completion-confetti__piece"
              data-shape={shape}
              key={`${x}-${y}-${index}`}
              style={style}
            />
          );
        },
      )}
    </div>
  );
}
