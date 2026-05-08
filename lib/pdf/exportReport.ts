import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { DetailedReportData } from '@/types';
import { renderReportHtml } from './reportTemplate';

export async function exportReportPdf(data: DetailedReportData): Promise<void> {
  const html = renderReportHtml(data);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save your hydration report',
      UTI: 'com.adobe.pdf',
    });
  }
}
