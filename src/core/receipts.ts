// receipts are rows, never claims. every load-bearing act writes one.

import type { Receipt, ReceiptKind } from './types';
import { randomId } from './hash';
import { saveReceipt } from './vault';

export function writeReceipt(
  kind: ReceiptKind,
  verdict: 'green' | 'red',
  selfName: string,
  containerId: string | null,
  detail: string,
  rows: Record<string, string> = {}
): Receipt {
  const receipt: Receipt = {
    id: randomId(),
    kind,
    at: new Date().toISOString(),
    containerId,
    selfName,
    verdict,
    detail,
    rows,
  };
  saveReceipt(receipt);
  return receipt;
}
