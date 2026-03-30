import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createWorker } from 'tesseract.js';
import { memoryStorage } from 'multer';
import * as sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const heicConvert = require('heic-convert');

/** MIME types accepted for OCR processing */
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/tif',
  'image/heic',
  'image/heif',
  'image/avif',
  'application/pdf',
]);

/** File extensions accepted when MIME is generic/missing */
const ALLOWED_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.bmp', '.tiff', '.tif', '.heic', '.heif',
  '.avif', '.pdf',
]);

function isAllowedFile(file: Express.Multer.File): boolean {
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_MIMES.has(mime)) return true;
  const ext = (file.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  return ALLOWED_EXTS.has(ext);
}

/**
 * Normalise any supported image format to a high-quality JPEG buffer
 * optimised for OCR (grayscale, high contrast, upscaled to at least 1800px wide).
 *
 * HEIC/HEIF are decoded with heic-convert (pure-JS, no native libheif needed)
 * so this works on Railway/Linux without extra system packages.
 */
async function normalizeImageBuffer(
  file: Express.Multer.File,
): Promise<{ buffer: Buffer; mimetype: string; filename: string }> {
  const mime = (file.mimetype || '').toLowerCase();
  const ext  = (file.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';

  // PDFs go straight through — OCR.space handles them natively
  if (mime === 'application/pdf' || ext === '.pdf') {
    return { buffer: file.buffer, mimetype: 'application/pdf', filename: file.originalname || 'ticket.pdf' };
  }

  let inputBuffer = file.buffer;

  // HEIC/HEIF: decode to JPEG first using heic-convert (pure JS, no libheif needed).
  // Use quality 1.0 to get the maximum-quality intermediate JPEG so the
  // subsequent sharp pipeline starts with the best possible source data.
  const isHeic = mime === 'image/heic' || mime === 'image/heif' || ext === '.heic' || ext === '.heif';
  if (isHeic) {
    const arrayBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 1.0 });
    inputBuffer = Buffer.from(arrayBuffer);
  }

  // --- OCR-optimised preprocessing pipeline ---
  // 1. Auto-rotate based on EXIF orientation
  // 2. Convert to greyscale (removes colour noise that confuses OCR)
  // 3. Normalise brightness/contrast (auto levels)
  // 4. Sharpen to make text edges crisp
  // 5. Upscale to min 1800px wide (Tesseract accuracy drops below ~1200px)
  // 6. Encode as high-quality JPEG (quality 95 balances size vs fidelity)

  const meta = await sharp(inputBuffer).metadata();
  const currentWidth = meta.width ?? 0;
  // Only upscale if the image is smaller than our target; never downscale.
  const targetWidth = currentWidth > 0 && currentWidth < 1800 ? 1800 : undefined;

  const jpegBuffer = await sharp(inputBuffer)
    .rotate()                               // fix EXIF orientation
    .grayscale()                            // greyscale — reduces noise for OCR
    .normalise()                            // stretch contrast to full range
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 3 }) // crisp text edges
    .resize(targetWidth ?? null, null, {    // upscale only when needed
      fit: 'inside',
      withoutEnlargement: false,
      kernel: 'lanczos3',
    })
    .jpeg({ quality: 95 })
    .toBuffer();

  return { buffer: jpegBuffer, mimetype: 'image/jpeg', filename: 'ticket.jpg' };
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('ticket', { storage: memoryStorage() }))
  async uploadTicket(@UploadedFile() file?: Express.Multer.File) {
    return this.processTicketFile(file);
  }

  // Compatibility endpoint used by dashboard OCR form.
  @Post('ocr')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async ocrTicket(@UploadedFile() file?: Express.Multer.File) {
    return this.processTicketFile(file);
  }

  private async processTicketFile(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Debes enviar un archivo de imagen en el campo ticket o image.');
    }

    if (!isAllowedFile(file)) {
      const ext = (file.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
      throw new BadRequestException(
        `Formato no soportado: ${file.mimetype || ext}. ` +
        'Formatos aceptados: JPG, PNG, WEBP, HEIC, HEIF, AVIF, BMP, TIFF, GIF, PDF.',
      );
    }

    const text = await this.performOcr(file);
    const lines = text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    const commerce  = this.extractCommerce(lines);
    const amount    = this.extractAmount(lines);
    const detectedDate = this.extractDate(lines);
    const currency  = this.detectCurrency(text);
    const category  = this.suggestCategory(`${commerce} ${text}`);

    return {
      commerce,
      date: this.normalizeDate(detectedDate),
      amount,
      category,
      currency,
      rawText: text,
    };
  }

  private async performOcr(file: Express.Multer.File): Promise<string> {
    const normalised = await normalizeImageBuffer(file);

    const provider = String(process.env.OCR_PROVIDER || 'ocrspace').toLowerCase();

    if (provider === 'ocrspace' && process.env.OCR_SPACE_API_KEY) {
      try {
        return await this.performOcrWithOcrSpace(normalised);
      } catch (error) {
        console.warn('OCR.space failed, falling back to local Tesseract:', error);
      }
    }

    if (normalised.mimetype === 'application/pdf') {
      throw new BadRequestException(
        'El procesamiento de PDF requiere OCR_SPACE_API_KEY configurado en el servidor.',
      );
    }

    return this.performOcrWithTesseract(normalised.buffer);
  }

  /**
   * OCR.space API call.
   * - Engine 1 (legacy Tesseract) is more reliable for structured receipt/tabular data.
   * - Engine 2 (ML) can hallucinate on low-contrast or noisy receipt text.
   * - isTable=true preserves column alignment which helps amount extraction.
   * - detectOrientation=true fixes any remaining rotation issues.
   * - scale=true upscales small images server-side.
   */
  private async performOcrWithOcrSpace(
    normalised: { buffer: Buffer; mimetype: string; filename: string },
  ): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(normalised.buffer)], { type: normalised.mimetype });

    formData.append('file', blob, normalised.filename);
    formData.append('language', 'spa');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '1');         // engine 1: better for receipts
    formData.append('scale', 'true');
    formData.append('isTable', 'true');        // preserve column structure
    formData.append('detectOrientation', 'true');

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: String(process.env.OCR_SPACE_API_KEY) },
      body: formData,
    });

    if (!res.ok) throw new Error(`OCR.space HTTP ${res.status}`);

    const data = (await res.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string[];
      ParsedResults?: Array<{ ParsedText?: string }>;
    };

    if (data.IsErroredOnProcessing) {
      throw new Error((data.ErrorMessage || ['OCR.space error']).join(' | '));
    }

    const parsed = data.ParsedResults?.[0]?.ParsedText || '';
    if (!parsed.trim()) throw new Error('OCR.space returned empty text');

    return parsed;
  }

  /**
   * Tesseract.js local OCR.
   * Uses Spanish + English language models.
   * PSM 4 (single column of text) works well for receipt-style layouts.
   */
  private async performOcrWithTesseract(buffer: Buffer): Promise<string> {
    const worker = await createWorker('spa+eng', 1, {
      // Suppress verbose Tesseract console output
      logger: () => undefined,
    });

    // PSM 4: assume a single column of text of variable sizes — matches receipt layout.
    // OEM 1: LSTM only (more accurate than Tesseract legacy on clear greyscale images).
    await worker.setParameters({
      tessedit_pageseg_mode: '4' as any,
    });

    const result = await worker.recognize(buffer);
    await worker.terminate();
    return String(result?.data?.text || '');
  }

  // ─── Text extraction helpers ──────────────────────────────────────────────

  private extractCommerce(lines: string[]): string {
    // Argentine + Spanish + international supermarkets and common chains
    const knownBrands = [
      // Argentina
      'coto', 'jumbo', 'disco', 'carrefour', 'la anonima', 'anonima',
      'changomas', 'walmart', 'vea', 'dia', 'el super', 'super',
      'farmacity', 'rapipago', 'pago facil', 'banco', 'bco',
      'ypf', 'shell', 'axion', 'petrobras',
      'mcdonalds', 'burger', 'subway', 'mostaza', 'wendys',
      'starbucks', 'freddos',
      'garbarino', 'frávega', 'fravega', 'musimundo', 'megatone',
      'zara', 'h&m', 'falabella', 'paris', 'ripley',
      // España / Europa
      'mercadona', 'lidl', 'alcampo', 'eroski', 'consum', 'ahorramas',
      'ikea', 'el corte ingles', 'primark',
      // Internacional
      'netflix', 'spotify', 'amazon', 'apple',
    ];

    const lower = (s: string) => s.toLowerCase();

    // 1. Direct brand match in any of the first 15 lines
    const brandHit = lines.slice(0, 15).find((line) =>
      knownBrands.some((brand) => lower(line).includes(brand)),
    );
    if (brandHit) {
      return brandHit.replace(/\s+/g, ' ').trim();
    }

    // 2. First header-like line (no digits, reasonable length, not a label)
    const skipWords = /ticket|factura|compra|caja|hora|fecha|iva|subtotal|total|tel|cuit|cai|afip|nro|nº|item|cant|precio|importe|cuil|rut|ruc/i;
    const headerLine = lines.slice(0, 10).find((line) => {
      const clean = line.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (clean.length < 3 || clean.length > 50) return false;
      if (/\d/.test(clean)) return false;
      if (skipWords.test(clean)) return false;
      return /[A-Za-zÀ-ÿ]/.test(clean);
    });
    if (headerLine) return headerLine.trim();

    // 3. Fallback: first line with letters and no digits
    const fallback = lines.find((line) => {
      const clean = line.replace(/[^A-Za-zÀ-ÿ ]/g, '').trim();
      return clean.length >= 3 && !skipWords.test(clean);
    });

    return fallback?.trim() || 'Comercio sin identificar';
  }

  private extractAmount(lines: string[]): number {
    // Keywords that indicate a TOTAL line (order matters: most specific first)
    const totalKeywords   = /\btotal\b|importe total|a pagar|saldo a pagar|monto total|total compra|total a pagar/i;
    const ignoredKeywords = /subtotal|iva|impuesto|descuento|ivag|perc|base imponible/i;
    const addressNoise    = /calle|c\.|av\.?|avenida|local|telefono|tel\.?|\bcp\b|codigo postal|@|www\./i;

    // First pass: lines that contain a TOTAL keyword
    const prioritized: number[] = [];
    for (const line of lines) {
      const clean = line.toLowerCase();
      if (!totalKeywords.test(clean)) continue;
      if (ignoredKeywords.test(clean)) continue;
      const amounts = this.extractMoneyCandidates(line);
      if (amounts.length) {
        // Take the largest amount on the TOTAL line (avoids unit prices)
        prioritized.push(Math.max(...amounts));
      }
    }
    if (prioritized.length) {
      // Take the largest total found (handles cases where there are multiple
      // "total" lines, e.g. "Total bruto" vs "Total a pagar")
      return Number(Math.max(...prioritized).toFixed(2));
    }

    // Second pass: any monetary amount, skipping address/phone lines
    const fallback: number[] = [];
    for (const line of lines) {
      if (addressNoise.test(line.toLowerCase())) continue;
      const amounts = this.extractMoneyCandidates(line);
      amounts.forEach((v) => {
        if (v > 0 && v < 100_000_000) fallback.push(v);
      });
    }

    if (!fallback.length) return 0;

    // Return the largest amount found (most likely the grand total)
    return Number(Math.max(...fallback).toFixed(2));
  }

  /**
   * Extract all money-like numbers from a single line.
   * Handles both European (1.234,56) and US (1,234.56) formats,
   * as well as Argentine amounts without decimals (e.g. $ 12345).
   */
  private extractMoneyCandidates(line: string): number[] {
    // Match: optional currency symbol, then a number that may have
    // thousands separators (. or ,) and optionally 2 decimal places.
    const regex = /(?:[$€£]|ars|usd|eur)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{1,2})?)/gi;

    const values: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      const raw = String(match[1] || '').trim();
      if (!raw) continue;
      const parsed = this.parseLocalizedAmount(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        values.push(parsed);
      }
    }
    return values;
  }

  private parseLocalizedAmount(raw: string): number {
    const value = raw.replace(/\s/g, '');
    const lastComma = value.lastIndexOf(',');
    const lastDot   = value.lastIndexOf('.');

    // No separators: plain integer
    if (lastComma === -1 && lastDot === -1) return Number(value);

    // Determine which separator is the decimal marker:
    // The one that appears last AND has exactly 2 digits after it is decimal.
    const decimalIndex = Math.max(lastComma, lastDot);
    const afterDecimal = value.slice(decimalIndex + 1);

    if (afterDecimal.length === 2 && /^\d{2}$/.test(afterDecimal)) {
      // Standard decimal — strip thousands separators and parse
      const intPart = value.slice(0, decimalIndex).replace(/[.,]/g, '');
      return Number(`${intPart}.${afterDecimal}`);
    }

    // No recognised decimal — treat all separators as thousands and parse as integer
    return Number(value.replace(/[.,]/g, ''));
  }

  private extractDate(lines: string[]): string | undefined {
    // Try multiple date formats commonly found on Argentine/Spanish receipts
    const patterns = [
      // DD/MM/YYYY  DD-MM-YYYY  DD.MM.YYYY
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
      // DD/MM/YY
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/,
      // YYYY-MM-DD (ISO)
      /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const m = line.match(pattern);
        if (m) return m[0]; // return raw match; normalizeDate will parse it
      }
    }
    return undefined;
  }

  private detectCurrency(text: string): 'EUR' | 'USD' | 'ARS' | 'GBP' | 'MXN' {
    const lower = text.toLowerCase();

    // Check explicit currency codes/words first (most reliable)
    if (/\bars\b|peso argentino|pesos argentinos/.test(lower)) return 'ARS';
    if (/\bmxn\b|peso mexicano/.test(lower)) return 'MXN';
    if (text.includes('€') || /\beur\b/.test(lower)) return 'EUR';
    if (text.includes('£') || /\bgbp\b/.test(lower)) return 'GBP';
    if (/\busd\b|us\$|dolar|dólar/.test(lower)) return 'USD';

    // $ alone on an Argentine receipt most likely means ARS
    // Use location heuristics: if we see typical AR words, pick ARS
    if (/cuit|cai|afip|iva alicuota|iva [12]\d%|monotributo|consumidor final|responsable inscripto/.test(lower)) return 'ARS';

    // Generic $ → USD as last resort (can be overridden by above)
    if (text.includes('$')) return 'ARS'; // $ is most commonly ARS in this app context

    return 'EUR';
  }

  private normalizeDate(value?: string): string {
    if (!value) return new Date().toISOString().slice(0, 10);

    // ISO format YYYY-MM-DD
    const isoMatch = value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const parts = value.split(/[\/\-\.]/).map((p) => p.trim());
    if (parts.length !== 3) return new Date().toISOString().slice(0, 10);

    // If first part looks like a year (4 digits) it's ISO-ish
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    const day   = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year  = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }

  private suggestCategory(text: string): string {
    const v = text.toLowerCase();

    // Food / Grocery
    if (/super|market|carrefour|coto|jumbo|disco|anonima|changomas|dia\b|vea\b|almacen|verduleria|panaderia|fiambreria|carniceria|yerba|aceite|arroz|leche|pan\b|carne|fruta|verdura|bebida/.test(v)) {
      return 'Alimentación';
    }

    // Health / Pharmacy
    if (/farm|salud|medic|clinica|hospital|doctor|dr\.?|medicamento|remedio|farmacity|drugstore/.test(v)) {
      return 'Salud';
    }

    // Transport / Fuel
    if (/ypf|shell|axion|petrobras|nafta|combustible|gasoil|estacion|taxi|uber|cabify|remis|colectivo|tren|subte|peaje/.test(v)) {
      return 'Transporte';
    }

    // Utilities / Services
    if (/edesur|edenor|metrogas|aysa|fibertel|claro|personal\b|movistar|telecom|internet|telefon|celular/.test(v)) {
      return 'Servicios';
    }

    // Clothing / Fashion
    if (/ropa|calzado|zapatilla|zara|falabella|paris|indumentaria|inditex|primark|vestimenta/.test(v)) {
      return 'Indumentaria';
    }

    // Entertainment / Subscriptions
    if (/netflix|spotify|amazon|apple|disney|hbo|flow|cine|teatro|gym|suscripci/.test(v)) {
      return 'Ocio';
    }

    // Restaurants / Food delivery
    if (/restaurant|restau|pizz|hamburgues|sushi|delivery|rappi|pedidosya|mcdonalds|burger|subway|mostaza|cafeteria/.test(v)) {
      return 'Restaurantes';
    }

    return 'Otro';
  }
}
