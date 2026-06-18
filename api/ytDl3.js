// ═══════════════════════════════════════════════
//   Rocky Chowdhury API — ytDl3
//   Same system as Dipto API
//   100% Free — No API Key needed
// ═══════════════════════════════════════════════

const https = require("https");

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("JSON parse error")); }
      });
    }).on("error", reject);
  });
}

function postJSON(options, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = https.request({
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
        "X-YouTube-Client-Name": "3",
        "X-YouTube-Client-Version": "19.09.37",
        "Origin": "https://www.youtube.com"
      }
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Parse error")); }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { link, format } = req.query;

  if (!link) {
    return res.status(400).json({
      error: "Missing ?link= parameter",
      owner: "Rocky Chowdhury"
    });
  }

  try {
    // Video ID extract
    let videoId;
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      videoId = link.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];
    } else {
      videoId = link; // direct video ID
    }

    if (!videoId || videoId.length !== 11) {
      return res.status(400).json({
        error: "Invalid YouTube video ID or URL",
        owner: "Rocky Chowdhury"
      });
    }

    // YouTube Innertube API — Android client (most reliable, no key needed)
    const playerData = await postJSON(
      {
        hostname: "www.youtube.com",
        path: "/youtubei/v1/player",
        method: "POST"
      },
      {
        videoId: videoId,
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.09.37",
            androidSdkVersion: 30,
            hl: "en",
            gl: "US",
            utcOffsetMinutes: 0
          }
        }
      }
    );

    // Title
    const title = playerData?.videoDetails?.title || "Unknown Title";

    // Get all formats
    const formats = playerData?.streamingData?.formats || [];
    const adaptiveFormats = playerData?.streamingData?.adaptiveFormats || [];

    let selected = null;

    if (format === "mp3") {
      // Audio only — best quality
      selected = adaptiveFormats
        .filter(f => f.mimeType?.includes("audio") && f.url)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    } else {
      // MP4 video+audio combined — 360p prefer (same as Dipto)
      selected =
        formats.find(f => f.qualityLabel === "360p" && f.url && f.mimeType?.includes("video/mp4")) ||
        formats.find(f => f.qualityLabel === "720p" && f.url && f.mimeType?.includes("video/mp4")) ||
        formats.find(f => f.url && f.mimeType?.includes("video/mp4")) ||
        formats.find(f => f.url);
    }

    if (!selected || !selected.url) {
      return res.status(404).json({
        error: "No downloadable format found",
        owner: "Rocky Chowdhury"
      });
    }

    return res.status(200).json({
      title: title,
      quality: selected.qualityLabel || (format === "mp3" ? "128kbps" : "360p"),
      downloadLink: selected.url,
      format: format || "mp4",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    console.error("[Rocky API Error]", err.message);
    return res.status(500).json({
      error: err.message || "Internal Server Error",
      owner: "Rocky Chowdhury"
    });
  }
};
