const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoLocalDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDaysIso(iso, days) {
  const dt = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return iso;
  dt.setDate(dt.getDate() + days);
  return isoLocalDate(dt);
}

async function main() {
  const now = new Date();
  const checkIn = process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2]) ? process.argv[2] : isoLocalDate(now);
  const checkOut = process.argv[3] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]) ? process.argv[3] : addDaysIso(checkIn, 1);

  const baseUrl = process.env.LIVE_API_BASE_URL || `http://localhost:${process.env.PORT || 5050}`;
  const url = new URL("/api/rooms", baseUrl);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  url.searchParams.set("adults", "1");
  url.searchParams.set("children", "0");
  url.searchParams.set("rooms", "1");

  console.log("Fetching live room prices from:", url.toString());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (status ${res.status}): ${text.slice(0, 300)}`);
  }

  const out = {
    fetchInfo: {
      timestamp: new Date().toISOString(),
      baseUrl,
      url: url.toString(),
      status: res.status,
      checkIn,
      checkOut,
    },
    apiResponse: data,
  };

  const target = path.resolve(__dirname, "data-check.json");
  fs.writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
  console.log("Saved:", target);
}

main().catch((err) => {
  console.error("Failed to fetch today room price:", err);
  process.exitCode = 1;
});
