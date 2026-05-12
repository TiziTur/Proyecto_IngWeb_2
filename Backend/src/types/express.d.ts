/**
 * Custom type declaration for Express global namespace
 * Provides Express.Multer.File type annotations for tickets.controller.ts
 * 
 * This is a workaround for @types/express and @types/multer version incompatibilities
 * where the global Express namespace may not be properly augmented.
 */

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
