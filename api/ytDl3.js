const https = require("https");

function post(hostname, path, data, headers) {
  return new Promise((resolve, reject) => {
    const body = typeof data === "string" ? data : new URLSearchParams(data).toString();
    const req = https.request({
      hostname, path, method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
        ...headers
      }
    }, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { link, format } = req.query;
  if (!link) return res.status(400).json({ error: "Missing link", owner: "Rocky Chowdhury" });

  try {
    const videoId = link.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1] || link;

    // Step 1: analyze
    const analyze = await post(
      "www.y2mate.com",
      "/mates/analyzeV2/ajax",
      { k_query: `https://www.youtube.com/watch?v=${videoId}`, k_page: "home", hl: "en", q_auto: 0 },
      { "Referer": "https://www.y2mate.com/", "Origin": "https://www.y2mate.com" }
    );

    const title = analyze?.title || "Unknown Title";
    let key;

    if (format === "mp3") {
      key = analyze?.links?.mp3?.mp3128?.k;
    } else {
      key = analyze?.links?.mp4?.["360p"]?.k ||
            analyze?.links?.mp4?.["720p"]?.k ||
            Object.values(analyze?.links?.mp4 || {})[0]?.k;
    }

    if (!key) return res.status(404).json({ error: "No format found", owner: "Rocky Chowdhury" });

    // Step 2: convert
    const convert = await post(
      "www.y2mate.com",
      "/mates/convertV2/index",
      { vid: videoId, k: key },
      { "Referer": "https://www.y2mate.com/", "Origin": "https://www.y2mate.com" }
    );

    const downloadLink = convert?.dlink;
    if (!downloadLink) return res.status(404).json({ error: "Convert failed", owner: "Rocky Chowdhury" });

    return res.status(200).json({
      title,
      quality: format === "mp3" ? "128kbps" : "360p",
      downloadLink,
      format: format || "mp4",
      owner: "Rocky Chowdhury"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message, owner: "Rocky Chowdhury" });
  }
};
