import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

// All AI features run on the Gemini free tier (GOOGLE_GENERATIVE_AI_API_KEY —
// get one at aistudio.google.com/apikey, no card required). Gemini accepts
// audio natively as an inline file part, so transcription, speaker
// segmentation, summarization, decision/action-item extraction and the
// follow-up email draft all happen in ONE model call — no separate
// Whisper/transcription step, no second provider.

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "AI is not configured. Add a free GOOGLE_GENERATIVE_AI_API_KEY from aistudio.google.com/apikey to enable it.",
    );
    this.name = "AiNotConfiguredError";
  }
}

function requireAi() {
  if (!isAiConfigured()) throw new AiNotConfiguredError();
}

function describeGeminiError(caught: unknown): string {
  const message = caught instanceof Error ? caught.message : String(caught);
  if (message.includes("429") || message.toLowerCase().includes("quota")) {
    return "Gemini free-tier rate limit reached. Wait a few seconds and try again.";
  }
  if (message.includes("401") || message.includes("403") || message.toLowerCase().includes("api key")) {
    return "Gemini rejected the API key. Check GOOGLE_GENERATIVE_AI_API_KEY.";
  }
  return `AI processing failed: ${message.slice(0, 300)}`;
}

const AnalysisSchema = z.object({
  segments: z
    .array(
      z.object({
        speaker: z.string(),
        start: z.number(),
        end: z.number(),
        text: z.string(),
      }),
    )
    .describe("Speaker-labelled turns covering the whole recording, in chronological order."),
  summary: z.string().describe("A factual 3-6 sentence summary of what happened. No hype, no filler."),
  keyTopics: z.array(z.string()).max(8).describe("3-6 key topics as short noun phrases."),
  decisions: z
    .array(z.object({ description: z.string(), context: z.string() }))
    .describe("Only decisions that were explicitly made out loud."),
  actionItems: z
    .array(
      z.object({
        description: z.string(),
        assignee: z.string().describe("The person's name if stated, otherwise 'Unassigned'."),
        dueDate: z.string().nullable().describe("ISO date YYYY-MM-DD only if a date was stated, otherwise null."),
        at: z.number().describe("Approximate second in the recording where this was raised."),
      }),
    )
    .describe("Only commitments that were actually spoken — never invent owners or dates."),
  followupEmail: z
    .string()
    .describe(
      "A plain-text follow-up email recapping the meeting: direct tone, no emoji, no exclamation marks, includes decisions and action items.",
    ),
});

export type MeetingAnalysis = z.infer<typeof AnalysisSchema>;

function buildPrompt(durationSeconds: number) {
  return [
    `This is an audio recording of a meeting. Total duration: ${Math.round(durationSeconds)} seconds.`,
    "",
    "Tasks:",
    "1. Transcribe the audio and split it into speaker turns. Infer distinct speakers from voice and conversational cues and label them 'Speaker 1', 'Speaker 2', etc. If a real name is clearly used to address someone, use that name instead. start/end are seconds from the beginning of the recording, in order, without gaps or overlaps, covering the full duration.",
    "2. Write a factual 3-6 sentence summary of what happened. No hype, no filler.",
    "3. List 3-6 key topics as short noun phrases.",
    "4. Extract explicit decisions that were made, each with one sentence of context.",
    "5. Extract action items. assignee = the person's name if stated, otherwise 'Unassigned'. dueDate = ISO date (YYYY-MM-DD) only if a date was stated, otherwise null. at = the approximate second in the recording where it was raised.",
    "6. Draft a follow-up email recapping the meeting: plain text, direct tone, no emoji, no exclamation marks. Include decisions and action items.",
    "",
    "Be accurate and literal. Never invent decisions, owners or dates that were not actually said. If the recording is too short or contains no meeting content, still return valid data with empty arrays and an honest summary.",
  ].join("\n");
}

/** One Gemini call: transcribe + diarize + summarize + extract decisions/actions + draft a follow-up email. */
export async function analyzeMeetingAudio(input: {
  buffer: Buffer;
  mimeType: string;
  durationSeconds: number;
}): Promise<MeetingAnalysis> {
  requireAi();
  try {
    const { object } = await generateObject({
      model: google("gemini-flash-latest"),
      schema: AnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "file", data: input.buffer, mediaType: input.mimeType },
            { type: "text", text: buildPrompt(input.durationSeconds) },
          ],
        },
      ],
    });
    return object;
  } catch (caught) {
    throw new Error(describeGeminiError(caught));
  }
}
