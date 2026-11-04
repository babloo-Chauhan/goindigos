import { readUpload } from "../../lib/contentStore";

export async function GET(_request, { params }) {
  const { file } = await params;
  const upload = await readUpload(file);
  if (!upload) return new Response("Not found", { status: 404 });
  return new Response(upload.bytes, {
    headers: {
      "Content-Type": upload.contentType,
      // The file name comes from the contents, so this address never changes what it serves.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
