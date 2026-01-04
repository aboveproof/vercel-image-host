import type { VercelRequest, VercelResponse } from "vercel";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const file = req.body.file;
  const filename = req.body.filename;

  if (!file || !filename) {
    return res.status(400).json({ error: "Missing file" });
  }

  const content = file.replace(/^data:image\/\w+;base64,/, "");

  const githubRes = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/uploads/${filename}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Upload ${filename}`,
        content,
        branch: process.env.GITHUB_BRANCH,
      }),
    }
  );

  if (!githubRes.ok) {
    const text = await githubRes.text();
    return res.status(500).json({ error: text });
  }

  res.json({
    url: `${process.env.BASE_URL}/uploads/${filename}`,
  });
}
