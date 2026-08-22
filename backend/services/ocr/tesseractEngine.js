import { createWorker } from 'tesseract.js';
import { OCREngine } from './ocrEngine.js';
import { logger } from '../../utils/logger.js';

export class TesseractEngine extends OCREngine {
  constructor(language = 'eng') {
    super();
    this.language = language;
  }

  /**
   * Extract text from an image using Tesseract.js worker
   * @param {string} filePath - Absolute path to the file
   * @param {object} options - Worker options
   */
  async extractText(filePath, options = {}) {
    let worker = null;
    try {
      logger.info(`Starting Tesseract OCR recognition for file: ${filePath}`);
      const lang = options.language || this.language;
      
      worker = await createWorker(lang);
      
      const ret = await worker.recognize(filePath);
      
      const overallConfidence = ret.data.confidence || 0;
      const text = ret.data.text || '';
      
      logger.info(`Tesseract OCR finished. Extracted ${text.length} chars, overall confidence: ${overallConfidence}%`);
      
      return {
        text,
        confidence: overallConfidence,
        words: ret.data.words ? ret.data.words.map(w => ({ text: w.text, confidence: w.confidence })) : [],
        lines: ret.data.lines ? ret.data.lines.map(l => l.text) : []
      };
    } catch (error) {
      logger.error('Tesseract OCR extraction failed:', { error: error.message, filePath });
      throw new Error(`OCR processing failed: ${error.message}`);
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }
}

// Default singleton instance
export const defaultOcrEngine = new TesseractEngine('eng');
