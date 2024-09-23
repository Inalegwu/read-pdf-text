import { extractTextFromPDF } from '@/extract';

extractTextFromPDF('./file2.pdf').then((result) =>
  result.match(
    (text) => console.log(`Extracted text ${text}`),
    (error) => console.error(`Error ${error}`),
  ),
);
