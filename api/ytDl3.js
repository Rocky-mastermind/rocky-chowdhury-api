// ═══════════════════════════════════════════════════════════
//   🎬 Rocky Chowdhury API — ytDl3
//   Owner   : Rocky Chowdhury
//   Version : 1.0.0
//   Free    : GitHub + Vercel
//   Endpoint: /ytDl3?link=VIDEO_ID&format=mp4
// ═══════════════════════════════════════════════════════════

const ytdl = require("@distube/ytdl-core");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { link, format } = req.query;

  if (!link) {
    return res.status(400).json({
      error: "Missing ?link= parameter",
      owner: "Rocky Chowdhury",
    });
  }

  try {
    // link hobe ya full URL ya shudhu video ID — duটাই support kore
    const videoUrl =
      link.includes("youtube.com") || link.includes("youtu.be")
        ? link
        : `https://www.youtube.com/watch?v=${link}`;

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const lengthSeconds = info.videoDetails.lengthSeconds;

    let selectedFormat;

    if (format === "mp3") {
      // MP3 / audio only
      selectedFormat = ytdl.chooseFormat(info.formats, {
        quality: "highestaudio",
        filter: "audioonly",
      });
    } else {
      // MP4 — same logic: 360p prefer, then fallback
      selectedFormat =
        info.formats.find(
          (f) =>
            f.qualityLabel === "360p" &&
            f.hasVideo &&
            f.hasAudio &&
            f.container === "mp4"
        ) ||
        info.formats.find(
          (f) => f.hasVideo && f.hasAudio && f.container === "mp4"
        ) ||
        info.formats.find((f) => f.hasVideo && f.hasAudio);
    }

    if (!selectedFormat) {
      return res.status(404).json({
        error: "No downloadable format found for this video",
        owner: "Rocky Chowdhury",
      });
    }

    return res.status(200).json({
      title: title,
      quality: selectedFormat.qualityLabel || selectedFormat.audioBitrate + "kbps",
      downloadLink: selectedFormat.url,
      duration: lengthSeconds,
      format: format || "mp4",
      owner: "Rocky Chowdhury",
    });
  } catch (err) {
    console.error("[Rocky API Error]", err.message);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
      owner: "Rocky Chowdhury",
    });
  }
};
