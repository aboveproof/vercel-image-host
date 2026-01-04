import type { VercelRequest, VercelResponse } from "vercel";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Read raw file data
  const chunks: any[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const fileBuffer = Buffer.concat(chunks);

  // Filename from custom header
  const filename = req.headers['x-filename']?.toString() || `screenshot-${Date.now()}.png`;
  const content = fileBuffer.toString('base64');

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/aboveproof/vercel-image-host/contents/uploads/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Upload ${filename}`,
          content,
          branch: "main"
        })
      }
    );

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return res.status(500).json({ error: `GitHub upload failed: ${text}` });
    }

    return res.json({
      url: `https://raw.githubusercontent.com/aboveproof/vercel-image-host/main/uploads/${filename}`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
