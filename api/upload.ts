import type { VercelRequest, VercelResponse } from "vercel";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Expect multipart/form-data file from ShareX
  const fileBuffer = Buffer.from(await new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  }));

  const filename = req.headers['x-filename']?.toString() || `screenshot-${Date.now()}.png`;
  const content = fileBuffer.toString('base64');

  try {
    const ghRes = await fetch(`https://api.github.com/repos/aboveproof/vercel-image-host/contents/uploads/${filename}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
      body: JSON.stringify({
        message: `Upload ${filename}`,
        content,
        branch: 'main'
      })
    });

    if (!ghRes.ok) {
      const text = await ghRes.text();
      return res.status(500).json({ error: `GitHub upload failed: ${text}` });
    }

    return res.json({
      url: `https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO/main/uploads/${filename}`
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
