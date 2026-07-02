import { ReceiptExtractedData } from '../models/receipt.model';

/** Parse le texte brut OCR d'un ticket (formats FR courants). */
export function parseReceiptText(rawText: string): ReceiptExtractedData {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const merchant = lines[0]?.slice(0, 80);

  let amount: number | undefined;
  const amountPatterns = [
    /(?:total|ttc|montant|amount|net\s+a\s+payer)[^\d]*(\d+[,.]\d{2})/i,
    /(\d+[,.]\d{2})\s*€/i,
    /€\s*(\d+[,.]\d{2})/i,
  ];

  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern);
      if (match) {
        const parsed = Number.parseFloat(match[1].replace(',', '.'));
        if (Number.isFinite(parsed) && parsed > 0) {
          amount = Math.round(parsed * 100) / 100;
        }
      }
    }
  }

  if (amount === undefined) {
    const candidates = [...rawText.matchAll(/(\d+[,.]\d{2})/g)]
      .map((match) => Number.parseFloat(match[1].replace(',', '.')))
      .filter((value) => Number.isFinite(value) && value > 0 && value < 100_000);
    if (candidates.length > 0) {
      amount = Math.max(...candidates);
    }
  }

  let date: string | undefined;
  const dateMatch = rawText.match(/\b(\d{2})[/.-](\d{2})[/.-](\d{2,4})\b/);
  if (dateMatch) {
    const day = dateMatch[1];
    const month = dateMatch[2];
    let year = dateMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    date = `${year}-${month}-${day}`;
  }

  return {
    amount,
    date,
    merchant,
    rawText: rawText.slice(0, 4000),
  };
}
