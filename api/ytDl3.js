const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { link, format } = req.query;
  if (!link) return res.status(400).json({ error: "Missing link", owner: "Rocky Chowdhury" });

  try {
    const videoId = link.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1] || link;

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
      https.request(options, (r) => {
        let d = "";
        r.on("data", c => d += c);
        r.on("end", () => resolve(JSON.parse(d)));
      }).on("error", reject).end();
    });

    return res.status(200).json({
      title: data.title,
      quality: "128kbps",
      downloadLink: data.link,
      format: "mp3",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, owner: "Rocky Chowdhury" });
  }
};
