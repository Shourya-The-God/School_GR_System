/**
 * Base OCR Engine Interface
 * Any future OCR provider (Google Cloud Vision, AWS Textract, Azure Document Intelligence)
 * must implement this contract.
 */
export class OCREngine {
  /**
   * Extract raw text and bounding block structures from a document file.
   * @param {string} filePath - Absolute path to the image/PDF file
   * @param {object} options - Optional parameters (e.g. language, pageNumber)
   * @returns {Promise<{ text: string, confidence: number, blocks?: Array }>}
   */
  async extractText(filePath, options = {}) {
    throw new Error('extractText method must be implemented by OCR provider');
  }
}
