// Rocky Chowdhury API — ytDl3
// RapidAPI YouTube MP3 — Fixed Version

const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { link, format } = req.query;
  if (!link) {
    return res.status(400).json({ error: "Missing link", owner: "Rocky Chowdhury" });
  }

  try {
    // Video ID extract
    let videoId;
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      videoId = link.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];
    } else {
      videoId = link.trim();
    }

    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube link", owner: "Rocky Chowdhury" });
    }

    // RapidAPI call
    const options = {
      method: "GET",
      hostname: "youtube-mp36.p.rapidapi.com",
      path: `/dl?id=${videoId}`,
      headers: {
        "x-rapidapi-key": process.env.RAPID_API_KEY,
        "x-rapidapi-host": "youtube-mp36.p.rapidapi.com"
      }
    };

    const data = await new Promise((resolve, reject) => {
      const req2 = https.request(options, (r) => {
        let d = "";
        r.on("data", c => d += c);
        r.on("end", () => {
          try { resolve(JSON.parse(d)); }
          catch (e) { reject(new Error("Parse error: " + d)); }
        });
      });
      req2.on("error", reject);
      req2.setTimeout(30000, () => reject(new Error("Timeout")));
      req2.end();
    });

    if (!data || !data.link) {
      return res.status(404).json({
        error: data?.msg || "No download link found",
        owner: "Rocky Chowdhury"
      });
    }

    return res.status(200).json({
      title: data.title || "Unknown",
      quality: "128kbps",
      downloadLink: data.link,
      format: "mp3",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message || "Internal Server Error",
      owner: "Rocky Chowdhury"
    });
  }
};
