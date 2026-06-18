const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { link, format } = req.query;
  if (!link) return res.status(400).json({ error: "Missing link", owner: "Rocky Chowdhury" });

  try {
    let videoId;
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      videoId = link.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];
    } else {
      videoId = link.trim();
    }

    if (!videoId) return res.status(400).json({ error: "Invalid link", owner: "Rocky Chowdhury" });

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
      const r = https.request(options, (res) => {
        let d = "";
        res.on("data", c => d += c);
        res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      });
      r.on("error", reject);
      r.setTimeout(30000, () => reject(new Error("Timeout")));
      r.end();
    });

    if (!data?.link) return res.status(404).json({ error: data?.msg || "Not found", owner: "Rocky Chowdhury" });

    return res.status(200).json({
      title: data.title,
      quality: "360p, h264",
      downloadLink: data.link,
      format: "mp4",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, owner: "Rocky Chowdhury" });
  }
};
