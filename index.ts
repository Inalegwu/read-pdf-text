import { Result, ResultAsync } from 'neverthrow';
import * as fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = import.meta.resolve(
  './node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
);

function readFile(path: string) {
  return Result.fromThrowable(
    () => new Uint8Array(fs.readFileSync(path)),
    (error) => `Error Reading File ${error}`,
  )();
}

function loadPDFData(data: Uint8Array) {
  return ResultAsync.fromPromise(
    pdfjs.getDocument({ data }).promise,
    (error) => `Error loading PDF ${error}`,
  );
}

function extractPageText(page: pdfjs.PDFPageProxy) {
  return ResultAsync.fromPromise(
    page
      .getTextContent()
      .then((text) => ('str' in text ? (text.str as string) : ' ')),
    (error) => `Error extracting text ${error}`,
  );
}

async function extractTextFromPDF(pdfPath: string) {
  return (await readFile(pdfPath).asyncAndThen(loadPDFData))
    .asyncAndThen((pdf) => {
      const pagePromises: ResultAsync<string, string>[] = [];

      for (let i = 0; i < pdf.numPages; i++) {
        const pageResult = ResultAsync.fromPromise(
          pdf.getPage(i + 1),
          (error) => `Error getting page ${i}: ${error}`,
        );

        pagePromises.push(pageResult.andThen(extractPageText));
      }

      return ResultAsync.combine(pagePromises);
    })
    .map((pageTexts) => pageTexts.join('\n'));
}

extractTextFromPDF('./file2.pdf').then((result) =>
  result.match(
    (text) => console.log(`Extracted text ${text}`),
    (error) => console.error(`Error ${error}`),
  ),
);
