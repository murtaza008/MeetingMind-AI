"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Pause, Play, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/app-shell";
import { useWorkspace } from "@/lib/hooks/use-org";
import { useUploadMeeting } from "@/lib/hooks/use-meetings";
import { Waveform } from "@/components/meetings/Waveform";
import { ProcessingSteps } from "@/components/meetings/ProcessingSteps";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NewMeetingPage() {
  const router = useRouter();
  const { workspace, workspaces, org } = useWorkspace();
  const upload = useUploadMeeting();

  const [tab, setTab] = useState<"upload" | "record">("upload");
  const [title, setTitle] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const orgWorkspaces = workspaces.filter((w) => w.membership.org.id === org?.id);
  const activeWorkspace = workspaceId || workspace?.id || orgWorkspaces[0]?.id || "";

  async function submit(blob: Blob, durationSeconds: number, filename: string) {
    if (!activeWorkspace) {
      toast.error("Create a workspace in Settings first.");
      return;
    }
    setBusy(true);
    try {
      const result = await upload.mutateAsync({
        file: blob,
        filename,
        title: title.trim() || filename.replace(/\.[^.]+$/, "") || "Untitled meeting",
        workspaceId: activeWorkspace,
        durationSeconds,
      });
      router.push(`/meetings/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setBusy(false);
    }
  }

  const handleFile = async (file: File) => {
    const duration = await readDuration(file);
    void submit(file, duration, file.name);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const node = ctx.createAnalyser();
      node.fftSize = 1024;
      source.connect(node);
      setAnalyser(node);

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setPaused(false);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access is needed to record.");
    }
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      recorder.resume();
      setPaused(false);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    const duration = elapsed;
    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctxRef.current?.close();
      setAnalyser(null);
      setRecording(false);
      if (blob.size < 2048) {
        toast.error("That recording was empty — please try again.");
        return;
      }
      void submit(blob, duration, `recording.${ext}`);
    };
    recorder.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (busy) {
    return (
      <AppShell title="New meeting">
        <div className="mx-auto max-w-md px-5 py-20">
          <h1 className="font-display text-2xl">Processing your meeting</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This runs while you wait — you can leave once it lands on the meeting page. A short
            recording usually takes well under a minute.
          </p>
          <div className="mt-7 rounded-lg border border-border bg-card p-5">
            <ProcessingSteps />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="New meeting">
      <div className="mx-auto max-w-2xl px-5 py-8 md:px-8">
        <h1 className="font-display text-2xl">New meeting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a recording or capture one now. Processing starts as soon as the audio lands.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q4 launch sync"
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Workspace</span>
            <select
              value={activeWorkspace}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {orgWorkspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex gap-0.5 rounded-md border border-input bg-card p-0.5">
          {(
            [
              ["upload", "Upload audio file"],
              ["record", "Record now"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "flex-1 rounded-[5px] px-3 py-1.5 text-[13px] transition-colors",
                tab === value
                  ? "bg-secondary font-medium text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
            className={cn(
              "mt-4 rounded-lg border border-dashed p-10 text-center transition-colors",
              dragging ? "border-primary bg-accent/40" : "border-border-strong bg-card",
            )}
          >
            <Upload className="mx-auto size-5 text-muted-foreground" strokeWidth={1.8} />
            <p className="mt-3 text-sm">Drag an audio file here</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              mp3, m4a, wav or webm
            </p>
            <label className="mt-4 inline-block cursor-pointer rounded-md border border-border-strong bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary">
              Choose file
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-card p-6">
            <Waveform analyser={analyser} active={recording && !paused} />
            <p className="mt-3 text-center font-mono text-2xl tabular-nums">{formatDuration(elapsed)}</p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {recording
                ? paused
                  ? "Paused"
                  : "Recording — transcription runs after you stop"
                : "Nothing recorded yet"}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Mic className="size-4" /> Start recording
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="inline-flex items-center gap-2 rounded-md border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                    {paused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <Square className="size-3.5" /> Stop and process
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {upload.isPending && <Loader2 className="mt-4 size-4 animate-spin" />}
      </div>
    </AppShell>
  );
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
}
