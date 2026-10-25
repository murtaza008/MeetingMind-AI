/**
 * Regenerates the recordings for the seeded demo meetings.
 *
 *   npx tsx scripts/demo-audio/generate.mts
 *
 * Windows only: every transcript line in lib/demo-data.ts is spoken with the
 * built-in OneCore voices (free, offline) via tts.ps1, each speaker getting a
 * consistent voice/pitch/rate. Lines are joined with short pauses into one
 * MP3 per meeting (prisma/demo-audio/*.mp3), and the real start/end second of
 * every line is written to lib/demo-audio.json so the seeded transcript
 * timestamps match the audio exactly. Re-run after editing any transcript.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Mp3Encoder } from "@breezystack/lamejs";
import { DEMO_MEETINGS } from "../../lib/demo-data";

const SAMPLE_RATE = 16000;
const MP3_KBPS = 32;
const GAP_SECONDS = 0.45;
const ROOT = join(import.meta.dirname, "..", "..");

type Voice = { voice: "David" | "Mark" | "Zira"; pitch: string; rate: string };

// Three voices ship with Windows, so pitch and rate tell same-voice speakers apart.
const VOICES: Record<string, Voice> = {
  "Jordan Ellis": { voice: "Mark", pitch: "+0%", rate: "0%" },
  "Sam Okafor": { voice: "David", pitch: "+0%", rate: "0%" },
  "Tom Becker": { voice: "David", pitch: "-10%", rate: "-5%" },
  "Diego Alvarez": { voice: "Mark", pitch: "-10%", rate: "+5%" },
  "Marcus Lee": { voice: "Mark", pitch: "+8%", rate: "0%" },
  "Maya Chen": { voice: "Zira", pitch: "-10%", rate: "0%" },
  "Rachel Kim": { voice: "Zira", pitch: "+8%", rate: "0%" },
  "Aisha Rahman": { voice: "Zira", pitch: "+14%", rate: "+5%" },
  "Nina Patel": { voice: "Zira", pitch: "+2%", rate: "+8%" },
  "Elena Petrova": { voice: "Zira", pitch: "+5%", rate: "-5%" },
  "Grace Liu": { voice: "Zira", pitch: "+12%", rate: "0%" },
};

function readPcm(path: string): Int16Array {
  const buf = readFileSync(path);
  let offset = 12;
  let format: { channels: number; rate: number; bits: number } | null = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") {
      format = { channels: buf.readUInt16LE(offset + 10), rate: buf.readUInt32LE(offset + 12), bits: buf.readUInt16LE(offset + 22) };
    }
    if (id === "data") {
      if (!format || format.channels !== 1 || format.rate !== SAMPLE_RATE || format.bits !== 16) {
        throw new Error(`${path}: expected 16 kHz mono 16-bit PCM, got ${JSON.stringify(format)}`);
      }
      const data = buf.subarray(offset + 8, offset + 8 + size);
      return new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
    }
    offset += 8 + size;
  }
  throw new Error(`${path}: no data chunk`);
}

/** Drop the synthesizer's leading/trailing near-silence so pauses are uniform. */
function trimSilence(samples: Int16Array, threshold = 300): Int16Array {
  let start = 0;
  let end = samples.length;
  while (start < end && Math.abs(samples[start]) < threshold) start++;
  while (end > start && Math.abs(samples[end - 1]) < threshold) end--;
  const pad = Math.round(SAMPLE_RATE * 0.05);
  return samples.subarray(Math.max(0, start - pad), Math.min(samples.length, end + pad));
}

function encodeMp3(samples: Int16Array): Buffer {
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < samples.length; i += 1152) chunks.push(encoder.encodeBuffer(samples.subarray(i, i + 1152)));
  chunks.push(encoder.flush());
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

const slug = (title: string) =>
  title.split(" — ")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const manifest: Record<string, { file: string; durationSeconds: number; segments: [number, number][] }> = {};
const work = mkdtempSync(join(tmpdir(), "demo-audio-"));
try {
  for (const meeting of DEMO_MEETINGS) {
    const jobs = meeting.turns.map(([speaker, text], i) => {
      const voice = VOICES[speaker];
      if (!voice) throw new Error(`No voice assigned to "${speaker}" — add one to VOICES.`);
      return { file: `${meeting.id}-${String(i).padStart(3, "0")}.wav`, text, ...voice };
    });
    const jobsPath = join(work, `${meeting.id}.json`);
    writeFileSync(jobsPath, JSON.stringify(jobs));
    execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", join(import.meta.dirname, "tts.ps1"), jobsPath, work], {
      stdio: "inherit",
    });

    const gap = new Int16Array(Math.round(SAMPLE_RATE * GAP_SECONDS));
    const parts: Int16Array[] = [];
    const segments: [number, number][] = [];
    let cursor = 0;
    for (const job of jobs) {
      const clip = trimSilence(readPcm(join(work, job.file)));
      const start = cursor / SAMPLE_RATE;
      parts.push(clip, gap);
      cursor += clip.length;
      segments.push([Math.round(start * 10) / 10, Math.round((cursor / SAMPLE_RATE) * 10) / 10]);
      cursor += gap.length;
    }
    const all = new Int16Array(cursor);
    let at = 0;
    for (const part of parts) {
      all.set(part, at);
      at += part.length;
    }

    const file = `${slug(meeting.title)}.mp3`;
    const mp3 = encodeMp3(all);
    writeFileSync(join(ROOT, "prisma", "demo-audio", file), mp3);
    manifest[meeting.id] = { file, durationSeconds: Math.round(cursor / SAMPLE_RATE), segments };
    console.log(`${file}: ${(cursor / SAMPLE_RATE / 60).toFixed(1)} min, ${(mp3.length / 1024).toFixed(0)} KB`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

writeFileSync(join(ROOT, "lib", "demo-audio.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Wrote lib/demo-audio.json");
