// Rocky Chowdhury API — Search endpoint
// /search?q=song+name

const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing ?q= query", owner: "Rocky Chowdhury" });

  try {
    const query = encodeURIComponent(q);
    const options = {
      hostname: "www.youtube.com",
      path: `/results?search_query=${query}&hl=en`,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    };

    const html = await new Promise((resolve, reject) => {
      const r = https.request(options, (resp) => {
        let d = "";
        resp.on("data", c => d += c);
        resp.on("end", () => resolve(d));
      });
      r.on("error", reject);
      r.setTimeout(15000, () => reject(new Error("Timeout")));
      r.end();
    });

    // Extract video data from YouTube page
    const match = html.match(/var ytInitialData = (.+?);<\/script>/);
    if (!match) return res.status(404).json({ error: "No results", owner: "Rocky Chowdhury" });

    const ytData = JSON.parse(match[1]);
    const contents = ytData?.contents?.twoColumnSearchResultsRenderer
      ?.primaryContents?.sectionListRenderer?.contents?.[0]
      ?.itemSectionRenderer?.contents;

    if (!contents) return res.status(404).json({ error: "No results found", owner: "Rocky Chowdhury" });

    const video = contents.find(c => c.videoRenderer);
    const vr = video?.videoRenderer;

    if (!vr) return res.status(404).json({ error: "No video found", owner: "Rocky Chowdhury" });

    return res.status(200).json({
      videoId: vr.videoId,
      title: vr.title?.runs?.[0]?.text || "Unknown",
      duration: vr.lengthText?.simpleText || "",
      channel: vr.ownerText?.runs?.[0]?.text || "",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, owner: "Rocky Chowdhury" });
  }
};
