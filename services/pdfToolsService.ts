
import { jsPDF } from 'jspdf';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import JSZip from 'jszip';

// Configure the worker for pdf.js to ensure it can process files in the background.
// This is a one-time setup.
try {
    GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
} catch (e) {
    console.warn("Could not set pdf.js worker automatically. Falling back to CDN. This might fail in some environments.");
    GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs';
}


/**
 * Reads a File object and returns its data URL.
 * @param file The file to read.
 * @returns A promise that resolves with the data URL.
 */
const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

/**
 * Reads a File object and returns its ArrayBuffer.
 * @param file The file to read.
 * @returns A promise that resolves with the ArrayBuffer.
 */
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};


/**
 * Converts an array of image files into a single PDF document using pdf-lib for robustness.
 * @param imageFiles An array of image files (e.g., JPEG, PNG).
 * @returns A promise that resolves with the generated PDF as a Blob.
 */
export const convertImagesToPdf = async (imageFiles: File[]): Promise<Blob> => {
    // Using pdf-lib for more robust PDF creation from images.
    const pdfDoc = await PDFDocument.create();

    for (const file of imageFiles) {
        try {
            const imageBytes = await readFileAsArrayBuffer(file);

            let pdfImage;
            // Embed the image based on its MIME type
            if (file.type === 'image/png') {
                pdfImage = await pdfDoc.embedPng(imageBytes);
            } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                pdfImage = await pdfDoc.embedJpg(imageBytes);
            } else {
                console.warn(`Unsupported image type: ${file.type}. Skipping file: ${file.name}`);
                continue; // Skip unsupported file types
            }
            
            // Use A4 page size and determine orientation based on image dimensions
            const [a4Width, a4Height] = PageSizes.A4;
            const isPortrait = pdfImage.height > pdfImage.width;
            const page = pdfDoc.addPage(isPortrait ? [a4Width, a4Height] : [a4Height, a4Width]);

            const { width: pageWidth, height: pageHeight } = page.getSize();
            
            // Scale the image to fit the page while maintaining aspect ratio, with a small margin
            const scaledDims = pdfImage.scaleToFit(pageWidth * 0.95, pageHeight * 0.95);

            // Draw the image centered on the page
            page.drawImage(pdfImage, {
                x: (pageWidth - scaledDims.width) / 2,
                y: (pageHeight - scaledDims.height) / 2,
                width: scaledDims.width,
                height: scaledDims.height,
            });
        } catch(e) {
            console.error(`Failed to process image ${file.name}:`, e);
            // Continue to the next image if one fails
        }
    }

    // Check if any pages were actually added.
    if (pdfDoc.getPageCount() === 0) {
        throw new Error("Could not process any of the images to create a PDF. Please check if the files are valid images.");
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};


/**
 * Merges multiple PDF files into a single PDF.
 * @param pdfFiles An array of PDF files to merge.
 * @returns A promise that resolves with the merged PDF as a Blob.
 */
export const mergePdfs = async (pdfFiles: File[]): Promise<Blob> => {
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
        const pdfBytes = await readFileAsArrayBuffer(file);
        const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes], { type: 'application/pdf' });
};

/**
 * Parses a page range string (e.g., "1, 3-5, 8") into an array of 0-based page indices.
 * @param rangeString The user-provided string.
 * @param maxPage The total number of pages in the document.
 * @returns An array of unique, sorted, 0-based page indices.
 */
const parsePageRange = (rangeString: string, maxPage: number): number[] => {
    const indices = new Set<number>();
    const parts = rangeString.split(',');

    for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        if (trimmedPart.includes('-')) {
            const [startStr, endStr] = trimmedPart.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);

            if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= maxPage) {
                        indices.add(i - 1); // convert to 0-based index
                    }
                }
            }
        } else {
            const pageNum = parseInt(trimmedPart, 10);
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPage) {
                indices.add(pageNum - 1); // convert to 0-based index
            }
        }
    }
    return Array.from(indices).sort((a, b) => a - b);
};


/**
 * Extracts specific pages from a PDF file.
 * @param pdfFile The PDF file to split.
 * @param pageRange A string defining the pages to extract (e.g., "1, 3-5, 8").
 * @returns A promise that resolves with a new PDF (as a Blob) containing only the extracted pages.
 */
export const splitPdf = async (pdfFile: File, pageRange: string): Promise<Blob> => {
    const sourceBytes = await readFileAsArrayBuffer(pdfFile);
    const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    
    const pageCount = sourcePdf.getPageCount();
    const indicesToCopy = parsePageRange(pageRange, pageCount);

    if (indicesToCopy.length === 0) {
        throw new Error("No valid pages were selected. Please check your page range and the document's total page count.");
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, indicesToCopy);
    copiedPages.forEach(page => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    return new Blob([newPdfBytes], { type: 'application/pdf' });
};

/**
 * Compresses a PDF file by re-saving it, which can optimize its structure.
 * @param pdfFile The PDF file to compress.
 * @returns A promise that resolves with the compressed PDF as a Blob.
 */
export const compressPdf = async (pdfFile: File): Promise<Blob> => {
    const sourceBytes = await readFileAsArrayBuffer(pdfFile);
    const pdfDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    // Re-saving with pdf-lib can often optimize and reduce file size.
    // This is a basic optimization, not a full re-compression of images or streams.
    const newPdfBytes = await pdfDoc.save();
    return new Blob([newPdfBytes], { type: 'application/pdf' });
};

/**
 * Converts each page of a PDF file into a PNG image and returns them as a zip file.
 * @param pdfFile The PDF file to convert.
 * @returns A promise that resolves with a zip file Blob containing the images.
 */
export const convertPdfToImages = async (pdfFile: File): Promise<Blob> => {
    const zip = new JSZip();
    const pdfData = await readFileAsArrayBuffer(pdfFile);
    const pdf = await getDocument({ data: pdfData }).promise;
    const numPages = pdf.numPages;
    const baseFileName = pdfFile.name.replace(/\.pdf$/i, '');

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        // Use a higher scale for better image quality
        const viewport = page.getViewport({ scale: 2.0 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (!context) {
            throw new Error('Could not get canvas context for image conversion.');
        }

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const imageBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (imageBlob) {
            zip.file(`${baseFileName}_page_${String(i).padStart(3, '0')}.png`, imageBlob);
        }
    }
    
    return await zip.generateAsync({ type: 'blob' });
};