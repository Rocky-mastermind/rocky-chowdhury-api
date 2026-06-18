// ═══════════════════════════════════════════
//   Rocky Chowdhury API — ytDl3
//   No API key needed! 100% Free
// ═══════════════════════════════════════════

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { link, format } = req.query;
  if (!link) {
    return res.status(400).json({
      error: "Missing ?link= parameter",
      owner: "Rocky Chowdhury"
    });
  }

  try {
    const { Innertube } = await import("youtubei.js");
    const youtube = await Innertube.create();

    const videoId = link.includes("youtube") || link.includes("youtu.be")
      ? link.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1]
      : link;

    if (!videoId) {
      return res.status(400).json({
        error: "Invalid YouTube link or ID",
        owner: "Rocky Chowdhury"
      });
    }

    const info = await youtube.getInfo(videoId);
    const title = info.basic_info.title;

    let streamingData;

    if (format === "mp3") {
      streamingData = info.chooseFormat({
        type: "audio",
        quality: "best"
      });
    } else {
      // mp4 — 360p prefer
      streamingData =
        info.chooseFormat({ type: "video+audio", quality: "360p" }) ||
        info.chooseFormat({ type: "video+audio", quality: "best" });
    }

    if (!streamingData || !streamingData.url) {
      return res.status(404).json({
        error: "No downloadable format found",
        owner: "Rocky Chowdhury"
      });
    }

    return res.status(200).json({
      title: title,
      quality: streamingData.quality_label || "360p",
      downloadLink: streamingData.url,
      format: format || "mp4",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    console.error("[Rocky API]", err.message);
    return res.status(500).json({
      error: err.message,
      owner: "Rocky Chowdhury"
    });
  }
};
