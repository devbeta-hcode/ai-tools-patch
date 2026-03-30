const http = require("http");

function post(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: "localhost",
        port: 9999,
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let b = "";
        res.on("data", (c) => (b += c));
        res.on("end", () => resolve(JSON.parse(b)));
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  // Step 1: Cline sends first message (like normal)
  console.log("=== Step 1: First request (new conversation) ===");
  const r1 = await post({
    model: "gemini",
    messages: [
      { role: "system", content: "You are a coding assistant." },
      { role: "user", content: "My name is TestUser123. Remember it!" },
    ],
  });
  console.log("Reply:", r1.choices[0].message.content.substring(0, 150));
  console.log();

  // Step 2: Cline sends FULL history + new message (no conversation_id!)
  console.log("=== Step 2: Cline-style auto-match (full history + new) ===");
  const r2 = await post({
    model: "gemini",
    messages: [
      { role: "system", content: "You are a coding assistant." },
      { role: "user", content: "My name is TestUser123. Remember it!" },
      { role: "assistant", content: r1.choices[0].message.content },
      { role: "user", content: "What is my name?" },
    ],
  });
  console.log("Reply:", r2.choices[0].message.content.substring(0, 150));
  console.log();

  // Verify Gemini actually remembered via real conversation continuation
  const hasName = r2.choices[0].message.content.includes("TestUser123");
  console.log("Gemini remembered the name:", hasName ? "YES" : "NO");
}

test().catch(console.error);
