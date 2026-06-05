declare module "archiver" {
  import type { Transform, TransformOptions } from "stream";

  export interface ZipArchiveOptions extends TransformOptions {
    zlib?: { level?: number };
  }

  /** archiver v8 — @types/archiver still targets the v7 factory API. */
  export class ZipArchive extends Transform {
    constructor(options?: ZipArchiveOptions);
    append(
      source: Buffer | NodeJS.ReadableStream,
      data: { name: string },
    ): this;
    pipe<T extends NodeJS.WritableStream>(destination: T): T;
    finalize(): Promise<boolean>;
    on(event: "error", listener: (err: Error) => void): this;
  }
}
