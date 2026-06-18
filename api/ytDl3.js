const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { link, format } = req.query;
  if (!link) return res.status(400).json({ error: "Missing link", owner: "Rocky Chowdhury" });

  try {
    const videoId = link.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1] || link;

    // YouTube no-cookie innertube API — no key needed
    const postData = JSON.stringify({
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "17.31.35",
          androidSdkVersion: 30
        }
      },
      videoId: videoId
    });

    const youtubeRes = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: "www.youtube.com",
        path: "/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "User-Agent": "com.google.android.youtube/17.31.35 (Linux; U; Android 11)",
          "X-YouTube-Client-Name": "3",
          "X-YouTube-Client-Version": "17.31.35"
        }
      }, (r) => {
        let data = "";
        r.on("data", c => data += c);
        r.on("end", () => resolve(JSON.parse(data)));
      });
      req2.on("error", reject);
      req2.write(postData);
      req2.end();
    });

    const title = youtubeRes.videoDetails?.title || "Unknown";
    const formats = youtubeRes.streamingData?.formats || [];
    const adaptiveFormats = youtubeRes.streamingData?.adaptiveFormats || [];
    const allFormats = [...formats, ...adaptiveFormats];

    let selected;
    if (format === "mp3") {
      selected = allFormats.find(f => f.mimeType?.includes("audio/mp4")) ||
                 allFormats.find(f => f.mimeType?.includes("audio"));
    } else {
      selected = allFormats.find(f => f.qualityLabel === "360p" && f.mimeType?.includes("video/mp4")) ||
                 allFormats.find(f => f.mimeType?.includes("video/mp4") && f.audioQuality) ||
                 formats[0];
    }

    if (!selected?.url) {
      return res.status(404).json({ error: "No format found", owner: "Rocky Chowdhury" });
    }

    return res.status(200).json({
      title,
      quality: selected.qualityLabel || "360p",
      downloadLink: selected.url,
      format: format || "mp4",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, owner: "Rocky Chowdhury" });
  }
};
