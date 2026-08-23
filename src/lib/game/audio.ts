let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.7;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.7, ctx.currentTime, 0.02);
  }
}

export function unlockAudio() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume();
  }
  unlocked = true;
}

function envGain(ac: AudioContext, duration: number, peak: number): GainNode {
  const g = ac.createGain();
  const t = ac.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  return g;
}

function tone(
  ac: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType,
  peak: number,
  dest: AudioNode,
) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = (Math.random() * 2 - 1) * 18;
  const g = envGain(ac, duration, peak);
  osc.connect(g);
  g.connect(dest);
  osc.start();
  osc.stop(ac.currentTime + duration);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function noiseBurst(ac: AudioContext, duration: number, peak: number, dest: AudioNode) {
  const n = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, n, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 600;
  filter.Q.value = 0.8;
  const g = envGain(ac, duration, peak);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start();
  src.stop(ac.currentTime + duration);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

function play(fn: (ac: AudioContext, dest: AudioNode) => void) {
  if (muted || !unlocked) return;
  const ac = getCtx();
  if (!ac || !master) return;
  if (ac.state === "suspended") return;
  fn(ac, master);
}

export const sfx = {
  plate() {
    play((ac, dest) => {
      noiseBurst(ac, 0.09, 0.18, dest);
      tone(ac, 140 + Math.random() * 40, 0.12, "triangle", 0.12, dest);
      tone(ac, 920, 0.04, "square", 0.03, dest);
    });
  },
  click() {
    play((ac, dest) => {
      tone(ac, 2100, 0.035, "square", 0.05, dest);
    });
  },
  correct() {
    play((ac, dest) => {
      tone(ac, 90, 0.22, "sine", 0.28, dest);
      tone(ac, 420, 0.14, "triangle", 0.12, dest);
      setTimeout(() => tone(ac, 640, 0.16, "triangle", 0.1, dest), 70);
    });
  },
  wrong() {
    play((ac, dest) => {
      tone(ac, 160, 0.18, "sawtooth", 0.1, dest);
      tone(ac, 110, 0.22, "sine", 0.14, dest);
    });
  },
  streak() {
    play((ac, dest) => {
      tone(ac, 440, 0.1, "triangle", 0.12, dest);
      setTimeout(() => tone(ac, 554, 0.1, "triangle", 0.12, dest), 80);
      setTimeout(() => tone(ac, 659, 0.16, "triangle", 0.14, dest), 160);
    });
  },
  remove() {
    play((ac, dest) => {
      noiseBurst(ac, 0.06, 0.1, dest);
      tone(ac, 220, 0.08, "triangle", 0.06, dest);
    });
  },
};
