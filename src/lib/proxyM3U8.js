import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 8080;
const web_server_url = process.env.PUBLIC_URL || `http://${host}:${port}`;

export default async function proxyM3U8(url, headers, res) {
  try {
    console.log("Fetching M3U8 from:", url);
    const req = await axios(url, {
      headers: {
        Referer: "https://megaplay.buzz/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
        ...headers,
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    if (!req || !req.data) {
      throw new Error("No data received from the M3U8 URL");
    }

    console.log("M3U8 content received:", req.data.substring(0, 200) + "...");

    const m3u8 = req.data
      .split("\n")
      .filter((line) => !line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO"))
      .join("\n");
    if (m3u8.includes("RESOLUTION=")) {
      const lines = m3u8.split("\n");
      const newLines = [];
      for (const line of lines) {
        if (line.startsWith("#")) {
          if (line.startsWith("#EXT-X-KEY:")) {
            const regex = /https?:\/\/[^\""\s]+/g;
            const url = `${web_server_url}${
              "/ts-proxy?url=" +
              encodeURIComponent(regex.exec(line)?.[0] ?? "") +
              "&headers=" +
              encodeURIComponent(JSON.stringify(headers))
            }`;
            newLines.push(line.replace(regex, url));
          } else {
            newLines.push(line);
          }
        } else {
          const uri = new URL(line, url);
          newLines.push(
            `${
              web_server_url +
              "/m3u8-proxy?url=" +
              encodeURIComponent(uri.href) +
              "&headers=" +
              encodeURIComponent(JSON.stringify(headers))
            }`
          );
        }
      }

      [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
        "Access-Control-Max-Age",
        "Access-Control-Allow-Credentials",
        "Access-Control-Expose-Headers",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Origin",
        "Vary",
        "Referer",
        "Server",
        "x-cache",
        "via",
        "x-amz-cf-pop",
        "x-amz-cf-id",
      ].map((header) => res.removeHeader(header));

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");

      res.end(newLines.join("\n"));
      return;
    } else {
      const lines = m3u8.split("\n");
      const newLines = [];
      for (const line of lines) {
        if (line.startsWith("#")) {
          if (line.startsWith("#EXT-X-KEY:")) {
            const regex = /https?:\/\/[^\""\s]+/g;
            const url = `${web_server_url}${
              "/ts-proxy?url=" +
              encodeURIComponent(regex.exec(line)?.[0] ?? "") +
              "&headers=" +
              encodeURIComponent(JSON.stringify(headers))
            }`;
            newLines.push(line.replace(regex, url));
          } else {
            newLines.push(line);
          }
        } else {
          const uri = new URL(line, url);

          newLines.push(
            `${web_server_url}${
              "/ts-proxy?url=" +
              encodeURIComponent(uri.href) +
              "&headers=" +
              encodeURIComponent(JSON.stringify(headers))
            }`
          );
        }
      }

      [
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods",
        "Access-Control-Allow-Headers",
        "Access-Control-Max-Age",
        "Access-Control-Allow-Credentials",
        "Access-Control-Expose-Headers",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Origin",
        "Vary",
        "Referer",
        "Server",
        "x-cache",
        "via",
        "x-amz-cf-pop",
        "x-amz-cf-id",
      ].map((header) => res.removeHeader(header));

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Allow-Methods", "*");

      res.end(newLines.join("\n"));
      return;
    }
  } catch (err) {
    console.error("Error in proxyM3U8:", err.message);
    console.error("Error details:", {
      url,
      headers,
      error: err.response?.data || err.message,
    });
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Failed to fetch M3U8",
        details: err.message,
        url: url,
      })
    );
    return null;
  }
}
