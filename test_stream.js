const http = require("http");
const fs = require("fs");

const body = JSON.stringify({
  messages: [{ role: "user", content: "Viết code Python hoàn chỉnh tạo đồng hồ digital bằng PyQt6, có thêm CSS đẹp" }],
  stream: true,
});

const req = http.request(
  {
    hostname: "localhost",
    port: 9999,
    path: "/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  },
  (res) => {
    let allChunks = [];
    let fullContent = "";
    console.log("Status:", res.statusCode);
    res.on("data", (chunk) => {
      const text = chunk.toString();
      const lines = text.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.substring(6);
        if (data === "[DONE]") {
          console.log("--- STREAM DONE ---");
          continue;
        }
        try {
          const json = JSON.parse(data);
          const delta = json.choices[0].delta;
          if (delta.content) {
            fullContent += delta.content;
            allChunks.push({ time: new Date().toISOString(), len: delta.content.length });
          }
        } catch (_) {}
      }
    });
    res.on("end", () => {
      fs.writeFileSync("test_stream_result.txt", fullContent, "utf8");
      console.log("Total content length:", fullContent.length);
      console.log("Chunks received:", allChunks.length);
      console.log("Last 200 chars:", fullContent.slice(-200));
      console.log("Written to test_stream_result.txt");
    });
  }
);

req.on("error", (e) => console.error("Error:", e.message));
req.write(body);
req.end();
