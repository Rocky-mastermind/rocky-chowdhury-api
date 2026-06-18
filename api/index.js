// ═══════════════════════════════════════════════
//   🏠 Rocky Chowdhury API — Home Page
// ═══════════════════════════════════════════════

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  return res.status(200).json({
    name: "Rocky Chowdhury API",
    owner: "Rocky Chowdhury",
    version: "1.0.0",
    status: "✅ Online",
    endpoints: {
      ytDl3_mp4: "/ytDl3?link=VIDEO_ID&format=mp4",
      ytDl3_mp3: "/ytDl3?link=VIDEO_ID&format=mp3",
    },
    example: {
      request: "/ytDl3?link=dQw4w9WgXcQ&format=mp4",
      response: {
        title: "Song Title",
        quality: "360p",
        downloadLink: "https://...",
        duration: "212",
        format: "mp4",
        owner: "Rocky Chowdhury",
      },
    },
    note: "link parameter: YouTube full URL অথবা শুধু Video ID দুটোই চলবে",
  });
};
