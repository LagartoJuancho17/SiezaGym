import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  extractYouTubeId,
  cleanYouTubeUrl,
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
} from "@/lib/exercises/youtube";
import CustomExerciseForm from "@/components/routines/CustomExerciseForm";
import ExerciseDetailSheet from "@/components/routines/ExerciseDetailSheet";

vi.mock("next/image", () => ({
  default: ({ unoptimized: _u, ...props }) => createElement("img", props),
}));
vi.mock("@/app/(app)/rutinas/actions", () => ({
  createCustomExercise: vi.fn(),
}));

const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));

describe("YouTube video utilities for custom exercises", () => {
  it("extracts 11-character video ID from diverse URL formats", () => {
    const expectedId = "dQw4w9WgXcQ";
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://youtube.com/embed/dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe(expectedId);
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBe(expectedId);
    expect(extractYouTubeId("https://example.com/not-youtube")).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
    expect(extractYouTubeId(null)).toBeNull();
  });

  it("builds clean canonical URL, thumbnail URL, and privacy-respecting embed URL", () => {
    const raw = "https://youtu.be/dQw4w9WgXcQ?si=abcdef123456";
    expect(cleanYouTubeUrl(raw)).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(getYouTubeThumbnailUrl(raw)).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg");
    expect(getYouTubeEmbedUrl(raw)).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
});

describe("CustomExerciseForm UI for videos", () => {
  it("includes video field and YouTube guidance in web routine creator", () => {
    const html = render(CustomExerciseForm, {});
    expect(html).toContain("Video de YouTube (opcional)");
    expect(html).toContain('placeholder="Pegá el link (ej: https://youtu.be/... o youtube.com/watch?v=...)"');
    expect(html).toContain("La portada del video de YouTube queda como miniatura del ejercicio.");
  });
});

describe("ExerciseDetailSheet video rendering", () => {
  it("renders embedded YouTube player and YouTube link when videoUrl is set", () => {
    const exerciseWithVideo = {
      id: "custom-1",
      nameEs: "Curl con banda elástica",
      registrationType: "peso_reps",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      mediaUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      muscleWeights: { biceps: 1 },
    };

    const html = render(ExerciseDetailSheet, { exercise: exerciseWithVideo, onClose: vi.fn() });
    expect(html).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(html).toContain("Ver en YouTube ↗");
    expect(html).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
  });
});
