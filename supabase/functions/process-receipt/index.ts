// Sereno — OCR d'un reçu via Tesseract.js (open source).
// Appelé par le client après upload ; met à jour public.receipts.
import { createClient } from 'npm:@supabase/supabase-js@2';
import Tesseract from 'npm:tesseract.js@5';

type ReceiptExtractedData = {
  amount?: number;
  date?: string;
  merchant?: string;
  rawText?: string;
};

function parseReceiptText(rawText: string): ReceiptExtractedData {
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

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let receiptId: string | undefined;
  try {
    const body = await request.json();
    receiptId = body.receiptId;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  if (!receiptId) {
    return new Response(JSON.stringify({ error: 'receiptId required' }), { status: 400 });
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: receipt, error: receiptError } = await userClient
    .from('receipts')
    .select('*')
    .eq('id', receiptId)
    .single();

  if (receiptError || !receipt) {
    return new Response(JSON.stringify({ error: 'Receipt not found' }), { status: 404 });
  }

  await admin.from('receipts').update({ status: 'processing' }).eq('id', receiptId);

  try {
    const { data: fileData, error: downloadError } = await admin.storage
      .from('receipts')
      .download(receipt.storage_path);

    if (downloadError || !fileData) {
      throw downloadError ?? new Error('Download failed');
    }

    const buffer = await fileData.arrayBuffer();
    const { data: ocrResult } = await Tesseract.recognize(new Uint8Array(buffer), 'fra+eng', {
      logger: () => undefined,
    });

    const extractedData = parseReceiptText(ocrResult.text ?? '');
    const hasSignal = extractedData.amount || extractedData.date || extractedData.merchant;

    const { data: updated, error: updateError } = await admin
      .from('receipts')
      .update({
        status: hasSignal ? 'extracted' : 'failed',
        extracted_data: extractedData,
        ocr_provider: 'tesseract',
        ocr_processed_at: new Date().toISOString(),
      })
      .eq('id', receiptId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ receipt: updated }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await admin
      .from('receipts')
      .update({
        status: 'failed',
        ocr_processed_at: new Date().toISOString(),
      })
      .eq('id', receiptId);

    const message = error instanceof Error ? error.message : 'OCR failed';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
