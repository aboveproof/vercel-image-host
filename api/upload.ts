import type { VercelRequest, VercelResponse } from "vercel";
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).send("Upload parse failed");
    }

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).send("No file");
    }

    const filename = (fields.filename?.[0] as string) || file.originalFilename!;
    const buffer = fs.readFileSync(file.filepath);
    const content = buffer.toString("base64");

    const ghRes = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/uploads/${filename}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Upload ${filename}`,
          content,
          branch: process.env.GITHUB_BRANCH
        })
      }
    );

    if (!ghRes.ok) {
      return res.status(500).send("GitHub upload failed");
    }

    // 🔴 MUST be a STRING
    return res.json({
      url: `https://cdn.fastboost.xyz/file/${filename}`
    });
  });
}
