import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createWorker } from 'tesseract.js';
import { memoryStorage } from 'multer';

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

    const worker = await createWorker('spa+eng');
    const result = await worker.recognize(file.buffer);
    await worker.terminate();

    const text = result.data.text || '';
    const amountMatch = text.match(/(\$\s*)?([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,][0-9]{2})?)/);
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);

    const amountRaw = amountMatch?.[2] || '0';
    const normalizedAmount = Number(
      amountRaw
        .replace(/\./g, '')
        .replace(',', '.'),
    );

    const commerce = text
      .split('\n')
      .map((line: string) => line.trim())
      .find((line: string) => line.length > 3 && /[a-zA-Z]/.test(line)) || 'Comercio sin identificar';

    return {
      commerce,
      date: this.normalizeDate(dateMatch?.[1]),
      amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
      category: this.suggestCategory(commerce),
      rawText: text,
    };
  }

  private normalizeDate(value?: string): string {
    if (!value) {
      return new Date().toISOString().slice(0, 10);
    }

    const parts = value.split(/[\/\-]/).map((p) => p.trim());
    if (parts.length !== 3) {
      return new Date().toISOString().slice(0, 10);
    }

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }

  private suggestCategory(commerce: string): string {
    const value = commerce.toLowerCase();
    if (value.includes('super') || value.includes('market')) {
      return 'Alimentacion';
    }
    if (value.includes('farm')) {
      return 'Salud';
    }
    if (value.includes('gym') || value.includes('netflix') || value.includes('spotify')) {
      return 'Suscripciones';
    }
    if (value.includes('estacion') || value.includes('ypf') || value.includes('shell')) {
      return 'Transporte';
    }
    return 'Otros';
  }
}
