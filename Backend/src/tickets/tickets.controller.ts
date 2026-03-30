/**
 * tickets.controller.ts
 *
 * OCR pipeline — Gemini Vision only (+ text-based fallback when no key).
 *
 * Primary strategy (GEMINI_API_KEY set):
 *   • Prepare image: HEIC decode → sharp rotate + resize (colour preserved)
 *   • Send image directly to Gemini 1.5 Flash Vision with a structured prompt
 *   • Model returns JSON: { commerce, amount, date, currency, category, rawText }
 *   • No OCR pre-processing, no regex — Gemini reads the ticket like a human
 *
 * Colour is intentionally preserved for Gemini: the model uses visual context
 * (logos, layout, colour-coded sections) in addition to text, which makes it
 * more accurate than sending a grayscale pre-processed image.
 *
 * Fallback chain (only when GEMINI_API_KEY is absent or Gemini call fails):
 *   1. OCR.space (engine 2 → engine 1) — grayscale-preprocessed image
 *   2. Tesseract.js local             — grayscale-preprocessed image
 *   Both use regex-based field extraction (less accurate but functional).
 */

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createWorker } from 'tesseract.js';
import { memoryStorage } from 'multer';
import * as sharp from 'sharp';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const heicConvert = require('heic-convert');

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TicketResult {
  commerce:  string;
  date:      string;
  amount:    number;
  category:  string;
  currency:  'EUR' | 'USD' | 'ARS' | 'GBP' | 'MXN';
  rawText:   string;
}

// ─── File-type guards ──────────────────────────────────────────────────────────

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/gif',  'image/bmp', 'image/tiff', 'image/tif',
  'image/heic', 'image/heif', 'image/avif', 'application/pdf',
]);
const ALLOWED_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.bmp', '.tiff', '.tif', '.heic', '.heif', '.avif', '.pdf',
]);

function isAllowedFile(f: Express.Multer.File): boolean {
  const mime = (f.mimetype || '').toLowerCase();
  if (ALLOWED_MIMES.has(mime)) return true;
  const ext = (f.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  return ALLOWED_EXTS.has(ext);
}

// ─── Image preparation ─────────────────────────────────────────────────────────

/**
 * Prepare image for Gemini Vision.
 *
 * Keeps the image in FULL COLOUR — Gemini uses colour and layout context
 * (logos, headings, price columns) to improve accuracy. We only:
 *   1. Decode HEIC/HEIF (pure JS, no libheif)
 *   2. Auto-rotate based on EXIF so the image is right-side-up
 *   3. Resize: cap longest side at 3000 px (Gemini inline limit) and
 *      upscale tiny images to ≥ 1200 px so small text is legible
 *   4. Re-encode as JPEG 92 (good quality, reasonable payload size)
 *
 * Intentionally NOT grayscale / NOT aggressive contrast — those hurt Gemini.
 */
async function prepareForGemini(f: Express.Multer.File): Promise<{
  base64:   string;
  mimeType: string;   // mime type to pass to Gemini inlineData
}> {
  const mime = (f.mimetype || '').toLowerCase();
  const ext  = (f.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';

  // PDFs: pass through as-is (Gemini supports application/pdf)
  if (mime === 'application/pdf' || ext === '.pdf') {
    return { base64: f.buffer.toString('base64'), mimeType: 'application/pdf' };
  }

  let src = f.buffer;

  // HEIC/HEIF decode
  const isHeic = mime === 'image/heic' || mime === 'image/heif' || ext === '.heic' || ext === '.heif';
  if (isHeic) {
    const ab = await heicConvert({ buffer: src, format: 'JPEG', quality: 1.0 });
    src = Buffer.from(ab);
  }

  const meta = await sharp(src).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);

  // Upscale if too small, cap if too large
  let targetLongest: number | null = null;
  if (longest > 0 && longest < 1200)  targetLongest = 1200;   // upscale small
  if (longest > 0 && longest > 3000)  targetLongest = 3000;   // cap large

  let pipeline = sharp(src).rotate();  // EXIF orientation only

  if (targetLongest !== null) {
    const isLandscape = (meta.width ?? 0) >= (meta.height ?? 0);
    pipeline = pipeline.resize(
      isLandscape ? targetLongest : undefined,
      isLandscape ? undefined     : targetLongest,
      { fit: 'inside', withoutEnlargement: longest >= 1200, kernel: 'lanczos3' },
    );
  }

  const buffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
  return { base64: buffer.toString('base64'), mimeType: 'image/jpeg' };
}

/**
 * Prepare image for OCR fallback (OCR.space / Tesseract).
 *
 * Applies aggressive receipt-oriented preprocessing:
 *   rotate → grayscale → normalise contrast → sharpen → upscale ≥ 1800 px
 *
 * Grayscale + contrast normalisation significantly improves text recognition
 * on thermal receipt paper and shadowed photos.
 */
async function prepareForOcr(f: Express.Multer.File): Promise<{
  buffer:   Buffer;
  mimetype: string;
  filename: string;
}> {
  const mime = (f.mimetype || '').toLowerCase();
  const ext  = (f.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';

  if (mime === 'application/pdf' || ext === '.pdf') {
    return { buffer: f.buffer, mimetype: 'application/pdf', filename: f.originalname || 'ticket.pdf' };
  }

  let src = f.buffer;
  const isHeic = mime === 'image/heic' || mime === 'image/heif' || ext === '.heic' || ext === '.heif';
  if (isHeic) {
    const ab = await heicConvert({ buffer: src, format: 'JPEG', quality: 1.0 });
    src = Buffer.from(ab);
  }

  const meta = await sharp(src).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const isLandscape = (meta.width ?? 0) >= (meta.height ?? 0);
  const needsUpscale = longest > 0 && longest < 1800;

  let pipeline = sharp(src)
    .rotate()
    .grayscale()
    .normalise()
    .sharpen({ sigma: 1.5, m1: 2, m2: 3.5 });

  if (needsUpscale) {
    pipeline = pipeline.resize(
      isLandscape ? 1800 : undefined,
      isLandscape ? undefined : 1800,
      { fit: 'inside', withoutEnlargement: false, kernel: 'lanczos3' },
    );
  }

  const buffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
  return { buffer, mimetype: 'image/jpeg', filename: 'ticket.jpg' };
}

// ─── Gemini Vision ─────────────────────────────────────────────────────────────

const GEMINI_PROMPT = `Eres un asistente experto en lectura de tickets y comprobantes de compra.
Analiza la imagen del ticket adjunta y extrae la siguiente información.
Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin explicaciones, sin texto adicional.

El JSON debe tener exactamente esta estructura:
{
  "commerce": "nombre del comercio o tienda",
  "amount": 1234.56,
  "date": "YYYY-MM-DD",
  "currency": "ARS",
  "category": "Supermercado",
  "rawText": "todo el texto visible del ticket, línea por línea"
}

Reglas:
- "commerce": nombre del negocio/tienda tal como aparece en el ticket. Si no se ve, escribe "Comercio sin identificar".
- "amount": el importe TOTAL a pagar (número, sin símbolos). Es el mayor importe del ticket, generalmente al final. Si hay varios totales, usa el "Total a pagar" o "Importe total". Si no se ve, usa 0.
- "date": fecha de la compra en formato YYYY-MM-DD. Si no aparece, usa la fecha de hoy: ${new Date().toISOString().slice(0, 10)}.
- "currency": código ISO de la moneda. Detecta el símbolo ($, €, £) o el texto (pesos, euros, ARS, EUR). Si el ticket es argentino (tiene CUIT, AFIP, pesos), usa "ARS". Valores posibles: ARS, EUR, USD, GBP, MXN.
- "category": elige UNA de estas categorías según el tipo de comercio y los productos: Supermercado, Alimentación, Restaurantes, Salud, Transporte, Servicios, Indumentaria, Electrónica, Ocio, Educación, Hogar, Otro.
- "rawText": transcribe TODO el texto que puedas leer del ticket, respetando saltos de línea.

Ejemplos de categorías:
- Supermercado: Coto, Jumbo, Carrefour, Disco, Walmart, supermercados en general
- Alimentación: panaderías, verdulerías, carnicerías, productos de almacén
- Restaurantes: bares, cafeterías, pizzerías, delivery, McDonald's, Burger King
- Salud: farmacias, clínicas, ópticas, medicamentos
- Transporte: YPF, Shell, nafta, SUBE, taxi, Uber, peajes
- Servicios: luz, gas, agua, internet, telefonía, facturas de servicios
- Indumentaria: ropa, calzado, accesorios, Zara, Adidas, Nike
- Electrónica: Garbarino, Fravega, computadoras, celulares, electrónica
- Ocio: cine, teatro, Netflix, Spotify, gimnasio, entretenimiento
- Educación: librerías, universidades, cursos, libros
- Hogar: ferreterías, muebles, Ikea, Easy, limpieza del hogar`;

async function analyzeWithGemini(
  base64: string,
  mimeType: string,
): Promise<TicketResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // gemini-1.5-flash: fast, cheap, excellent vision — perfect for receipts
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imagePart: Part = {
      inlineData: { data: base64, mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg' },
    };

    const result = await model.generateContent([GEMINI_PROMPT, imagePart]);
    const text   = result.response.text().trim();

    // Strip any accidental markdown code fences
    const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed = JSON.parse(json) as Partial<TicketResult>;

    // Validate and sanitize
    const today = new Date().toISOString().slice(0, 10);
    return {
      commerce: String(parsed.commerce || 'Comercio sin identificar').trim(),
      amount:   toPositiveNumber(parsed.amount),
      date:     isValidDate(parsed.date) ? parsed.date! : today,
      currency: isValidCurrency(parsed.currency) ? parsed.currency! : 'ARS',
      category: String(parsed.category || 'Otro').trim(),
      rawText:  String(parsed.rawText || '').trim(),
    };
  } catch (err) {
    console.error('Gemini Vision error:', err);
    return null;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toPositiveNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

function isValidDate(d: unknown): d is string {
  if (typeof d !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return false;
  const y = dt.getFullYear();
  return y >= 2000 && y <= new Date().getFullYear() + 1;
}

function isValidCurrency(c: unknown): c is TicketResult['currency'] {
  return ['EUR', 'USD', 'ARS', 'GBP', 'MXN'].includes(c as string);
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {

  @Post('upload')
  @UseInterceptors(FileInterceptor('ticket', { storage: memoryStorage() }))
  async uploadTicket(@UploadedFile() file?: Express.Multer.File) {
    return this.processTicketFile(file);
  }

  @Post('ocr')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async ocrTicket(@UploadedFile() file?: Express.Multer.File) {
    return this.processTicketFile(file);
  }

  // ─── Main flow ─────────────────────────────────────────────────────────────

  private async processTicketFile(file?: Express.Multer.File): Promise<TicketResult> {
    if (!file) throw new BadRequestException('Debes enviar un archivo en el campo "ticket" o "image".');
    if (!isAllowedFile(file)) {
      const ext = (file.originalname || '').toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
      throw new BadRequestException(
        `Formato no soportado: ${file.mimetype || ext}. ` +
        'Aceptados: JPG, PNG, WEBP, HEIC, HEIF, AVIF, BMP, TIFF, GIF, PDF.',
      );
    }

    // ── 1. Gemini Vision — colour image, no OCR pre-processing ───────────────
    if (process.env.GEMINI_API_KEY) {
      const { base64, mimeType } = await prepareForGemini(file);
      const result = await analyzeWithGemini(base64, mimeType);
      if (result) return result;
      console.warn('Gemini failed — falling back to OCR text pipeline');
    }

    // ── 2. Fallback: grayscale-preprocessed image → OCR → regex ──────────────
    const ocrPrepped = await prepareForOcr(file);
    const rawText    = await this.extractTextFallback(ocrPrepped);
    return this.parseFromText(rawText);
  }

  // ─── Fallback OCR text pipeline ────────────────────────────────────────────

  private async extractTextFallback(norm: {
    buffer: Buffer; mimetype: string; filename: string;
  }): Promise<string> {
    const hasKey   = Boolean(process.env.OCR_SPACE_API_KEY);
    const provider = String(process.env.OCR_PROVIDER || 'ocrspace').toLowerCase();

    if (hasKey && provider === 'ocrspace') {
      for (const engine of ['2', '1']) {
        try {
          const t = await this.callOcrSpace(norm, engine);
          if (t.trim().length > 20) return t;
        } catch (e) {
          console.warn(`OCR.space engine ${engine} failed:`, e);
        }
      }
    }

    if (norm.mimetype === 'application/pdf') {
      throw new BadRequestException(
        'Para procesar PDFs configura GEMINI_API_KEY o OCR_SPACE_API_KEY en el servidor.',
      );
    }

    return this.runTesseract(norm.buffer);
  }

  private async callOcrSpace(
    norm: { buffer: Buffer; mimetype: string; filename: string },
    engine: string,
  ): Promise<string> {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(norm.buffer)], { type: norm.mimetype }), norm.filename);
    form.append('language', 'spa');
    form.append('isOverlayRequired', 'false');
    form.append('OCREngine', engine);
    form.append('scale', 'true');
    form.append('isTable', 'true');
    form.append('detectOrientation', 'true');

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: String(process.env.OCR_SPACE_API_KEY) },
      body: form,
    });
    if (!res.ok) throw new Error(`OCR.space HTTP ${res.status}`);

    const json = await res.json() as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string[];
      ParsedResults?: Array<{ ParsedText?: string }>;
    };
    if (json.IsErroredOnProcessing) throw new Error((json.ErrorMessage ?? []).join(' | '));

    const text = json.ParsedResults?.[0]?.ParsedText ?? '';
    if (!text.trim()) throw new Error('OCR.space returned empty text');
    return text;
  }

  private async runTesseract(buffer: Buffer): Promise<string> {
    const attempt = async (lang: string) => {
      const w = await createWorker(lang, 1, { logger: () => undefined } as any);
      try {
        await w.setParameters({ tessedit_pageseg_mode: '6' as any });
        const { data } = await w.recognize(buffer);
        return data.text ?? '';
      } finally {
        await w.terminate();
      }
    };
    const spa = await attempt('spa');
    if (spa.trim().length > 30) return spa;
    const bilingual = await attempt('spa+eng');
    return bilingual.length >= spa.length ? bilingual : spa;
  }

  // ─── Text → structured data (fallback path only) ──────────────────────────

  private parseFromText(rawText: string): TicketResult {
    const cleaned = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').trim();
    const lines   = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

    const commerce = this.extractCommerce(lines);
    const amount   = this.extractAmount(lines);
    const date     = this.extractDate(lines);
    const currency = this.detectCurrency(cleaned);
    const category = this.suggestCategory(cleaned, commerce);

    return { commerce, date, amount, category, currency, rawText: cleaned };
  }

  // ── Commerce ──────────────────────────────────────────────────────────────

  private extractCommerce(lines: string[]): string {
    const BRANDS = [
      'coto','jumbo','disco','vea','carrefour','changomas','walmart','makro',
      'maxiconsumo','dia','la anonima','anonima','cooperativa obrera','super vea',
      'farmacity','farmahorro','ypf','shell','axion','petrobras',
      'mcdonalds',"mcdonald's",'burger king','subway','mostaza','wendys','starbucks',
      'freddo','garbarino','fravega','frávega','musimundo','megatone',
      'zara','falabella','paris','ripley','adidas','nike',
      'rapipago','pago facil','naranja','mercadona','lidl','alcampo','eroski',
      'ikea','primark','decathlon','amazon','netflix','spotify','apple','google',
      'uber','cabify',
    ];
    for (const line of lines.slice(0, 15)) {
      const ll = line.toLowerCase();
      if (BRANDS.some(b => ll.includes(b)))
        return line.replace(/\s+/g, ' ').trim();
    }
    const META = /ticket|factura|comprobante|caja|hora|fecha|iva|subtotal|total|importe|tel[eé]f|cuit|cai|afip|n[rº°]|item|cant|precio|domicilio|direcci[oó]n|local\b|sucursal|calle|av\./i;
    const header = lines.slice(0, 12).find(l => {
      const c = l.replace(/[^\wÀ-ÿ\s]/g, ' ').replace(/\s+/g, ' ').trim();
      return c.length >= 3 && c.length <= 60 && !/\d/.test(c) && !META.test(c) && /[A-Za-zÀ-ÿ]{3}/.test(c);
    });
    if (header) return header.trim();
    return 'Comercio sin identificar';
  }

  // ── Amount ────────────────────────────────────────────────────────────────

  private extractAmount(lines: string[]): number {
    const RE_TOTAL  = /\btotal\b|importe\s*total|a\s*pagar|saldo\s*a\s*pagar|monto\s*total|gran\s*total|neto\s*a\s*pagar/i;
    const RE_IGNORE = /subtotal|sub-total|iva\b|impuesto|descuento|bonif|perc|base\s+imponible/i;
    const totals: number[] = [];

    for (const line of lines) {
      if (!RE_TOTAL.test(line)) continue;
      if (RE_IGNORE.test(line)) continue;
      const vals = extractNumbers(line);
      if (vals.length) totals.push(Math.max(...vals));
    }
    if (totals.length) return round2(Math.max(...totals));

    const all: number[] = [];
    for (const line of lines) {
      if (/calle|tel[eé]f|celular|@|www\.|\.com/i.test(line)) continue;
      extractNumbers(line).forEach(v => { if (v > 0 && v < 1e9) all.push(v); });
    }
    return all.length ? round2(Math.max(...all)) : 0;
  }

  // ── Date ──────────────────────────────────────────────────────────────────

  private extractDate(lines: string[]): string {
    const today = new Date().toISOString().slice(0, 10);
    const MN: Record<string, string> = {
      ene:'01',enero:'01',feb:'02',febrero:'02',mar:'03',marzo:'03',
      abr:'04',abril:'04',may:'05',mayo:'05',jun:'06',junio:'06',
      jul:'07',julio:'07',ago:'08',agosto:'08',sep:'09',septiembre:'09',
      setiembre:'09',oct:'10',octubre:'10',nov:'11',noviembre:'11',
      dic:'12',diciembre:'12',
    };
    for (const line of lines) {
      let m = line.match(/\b(20\d{2})[-\/](0?[1-9]|1[0-2])[-\/](0?[1-9]|[12]\d|3[01])\b/);
      if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;

      m = line.match(/\b(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](20\d{2})\b/);
      if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;

      m = line.match(/\b(0?[1-9]|[12]\d|3[01])[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](\d{2})\b/);
      if (m) return `20${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;

      m = line.match(/\b(\d{1,2})\s+(?:de\s+)?([A-Za-z]{3,12})\s+(?:de\s+)?(20\d{2})\b/i);
      if (m) {
        const mon = MN[m[2].toLowerCase().slice(0,3)];
        if (mon) return `${m[3]}-${mon}-${m[1].padStart(2,'0')}`;
      }
    }
    return today;
  }

  // ── Currency ──────────────────────────────────────────────────────────────

  private detectCurrency(text: string): TicketResult['currency'] {
    const l = text.toLowerCase();
    if (/\bars\b|peso[s]?\s+argentino[s]?/i.test(text)) return 'ARS';
    if (/\bmxn\b|peso[s]?\s+mexicano[s]?/i.test(text)) return 'MXN';
    if (text.includes('€') || /\beur\b/.test(l)) return 'EUR';
    if (text.includes('£') || /\bgbp\b/.test(l)) return 'GBP';
    if (/us\$|\busd\b|d[oó]lar/i.test(text)) return 'USD';
    if (/cuit|cai\b|afip|iva\s*\d{1,2}\s*%|monotributo|consumidor\s+final|responsable\s+inscripto/i.test(l)) return 'ARS';
    if (text.includes('$')) return 'ARS';
    return 'EUR';
  }

  // ── Category ──────────────────────────────────────────────────────────────

  private suggestCategory(text: string, commerce: string): string {
    const h = (commerce + ' ' + text).toLowerCase();
    const m = (re: RegExp) => re.test(h);

    if (m(/coto|jumbo|disco|carrefour|changomas|anonima|cooperativa\s+obrera|super\s+vea|vea\b|supermercado|autoservicio|walmart|makro/)) return 'Supermercado';
    if (m(/almac[eé]n|verduleria|panaderia|carniceria|fruteria|dietética|fiambreria|yerba|aceite|arroz|leche|carne|pollo|fruta|verdura|gaseosa/)) return 'Alimentación';
    if (m(/restaurant|pizzer[ií]a|hamburgues|sushi|parrilla|cafeter[ií]a|delivery|rappi|pedidosya|mcdonalds|burger\s+king|subway|mostaza|starbucks|freddo/)) return 'Restaurantes';
    if (m(/farmac[iy]|drogu[eé]ria|salud|cl[ií]nica|hospital|m[eé]dico|laboratorio|medicamento|remedio|vitamina|[oó]ptica|dental/)) return 'Salud';
    if (m(/ypf|shell|axion|petrobras|nafta|combustible|gasoil|gasolina|peaje|autopista|subte|colectivo|tren\b|taxi|uber\b|cabify|remis/)) return 'Transporte';
    if (m(/edesur|edenor|metrogas|aysa|fibertel|claro\b|personal\b|movistar|telecom|internet|factura\s+de\s+luz|factura\s+de\s+gas/)) return 'Servicios';
    if (m(/zara|falabella|paris\b|ripley|adidas|nike\b|puma\b|ropa|calzado|zapatilla|indumentaria|vestimenta|primark/)) return 'Indumentaria';
    if (m(/garbarino|fravega|musimundo|megatone|notebook|laptop|celular|smartphone|tablet|electrodom[eé]stico/)) return 'Electrónica';
    if (m(/netflix|spotify|amazon\s+prime|disney|hbo|flow\b|cine\b|teatro\b|gym\b|gimnasio|suscripci[oó]n/)) return 'Ocio';
    if (m(/universidad|facultad|libreria\b|papeleria|cuaderno|libro\b|curso\b|udemy|coursera/)) return 'Educación';
    if (m(/ikea|easy\b|sodimac|ferreteri[ae]|pintura\b|limpieza|detergente|hogar\b|mueble/)) return 'Hogar';
    return 'Otro';
  }
}

// ─── Module-level numeric utilities ───────────────────────────────────────────

function extractNumbers(line: string): number[] {
  const s = line.replace(/(?:[$€£¥]|ARS|USD|EUR|GBP|MXN)\s*/gi, '');
  const RE = /\b(\d{1,3}(?:[.,]\d{3})*[.,]\d{1,2}|\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d{1,2})?)\b/g;
  const results: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = RE.exec(s)) !== null) {
    const v = parseNum(m[1]);
    if (Number.isFinite(v) && v > 0) results.push(v);
  }
  return results;
}

function parseNum(raw: string): number {
  const s = raw.trim();
  const ld = s.lastIndexOf('.');
  const lc = s.lastIndexOf(',');
  const di = Math.max(ld, lc);
  if (di === -1) return Number(s);
  const after = s.slice(di + 1);
  if (after.length <= 2 && /^\d+$/.test(after)) {
    return Number(s.slice(0, di).replace(/[.,]/g, '') + '.' + after);
  }
  return Number(s.replace(/[.,]/g, ''));
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
