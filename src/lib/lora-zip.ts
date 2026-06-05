import { ZipArchive } from "archiver";
import { PassThrough } from "stream";

export type ZipImageInput = {
  filename: string;
  buffer: Buffer;
};

/** Build an in-memory ZIP archive from image buffers. */
export async function buildImagesZip(images: ZipImageInput[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pass = new PassThrough();
    const chunks: Buffer[] = [];

    pass.on("data", (chunk: Buffer) => chunks.push(chunk));
    pass.on("end", () => resolve(Buffer.concat(chunks)));
    pass.on("error", reject);

    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on("error", reject);
    archive.pipe(pass);

    for (const img of images) {
      archive.append(img.buffer, { name: img.filename });
    }

    void archive.finalize();
  });
}
