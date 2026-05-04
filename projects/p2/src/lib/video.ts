export type VideoSource =
  | { kind: "hls"; src: string }
  | { kind: "youtube"; videoId: string; embedUrl: string }
  | { kind: "unknown"; src: string };

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function parseVideoSource(url: string | null | undefined): VideoSource | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "unknown", src: url };
  }

  if (YOUTUBE_HOSTS.has(parsed.hostname)) {
    const id = extractYouTubeId(parsed);
    if (id) {
      return {
        kind: "youtube",
        videoId: id,
        embedUrl: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1`,
      };
    }
  }

  if (parsed.pathname.endsWith(".m3u8")) {
    return { kind: "hls", src: url };
  }

  return { kind: "unknown", src: url };
}

function extractYouTubeId(u: URL): string | null {
  if (u.hostname === "youtu.be") {
    return u.pathname.slice(1) || null;
  }
  if (u.pathname === "/watch") {
    return u.searchParams.get("v");
  }
  // /embed/{id}, /shorts/{id}, /v/{id}
  const match = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)/);
  if (match) return match[1];
  return null;
}
