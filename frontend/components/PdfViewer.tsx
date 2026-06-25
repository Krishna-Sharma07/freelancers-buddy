'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up PDF.js worker (runs only on client because this file is 'use client')
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
  pdfArrayBuffer: ArrayBuffer;
  currentPage: number;
  highlightedPage: number | null;
  onPageChange?: (page: number) => void;
  title?: string;
}

export default function PdfViewer({
  pdfArrayBuffer,
  currentPage,
  highlightedPage,
  onPageChange,
  title = '📄 Document Preview',
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfScale, setPdfScale] = useState<number>(1.0);
  const [pdfLoadError, setPdfLoadError] = useState<Error | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setPdfLoadError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setPdfLoadError(error);
  }, []);

  const pdfFile = useMemo(() => {
    return { data: pdfArrayBuffer };
  }, [pdfArrayBuffer]);

  // Zoom controls
  const zoomIn = () => setPdfScale((prev) => Math.min(prev + 0.2, 3));
  const zoomOut = () => setPdfScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setPdfScale(1.0);

  // Go to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      onPageChange?.(page);
      const pageEl = pageRefs.current[page];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Scroll to highlighted page when it changes
  React.useEffect(() => {
    if (highlightedPage !== null && pageRefs.current[highlightedPage]) {
      setTimeout(() => {
        pageRefs.current[highlightedPage]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [highlightedPage]);

  return (
    <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg overflow-hidden sticky top-24">
      {/* PDF Toolbar */}
      <div className="bg-slate-900 p-3 border-b border-slate-700/30 flex items-center justify-between">
        <h3 className="font-bold text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={pdfScale <= 0.5}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs disabled:opacity-50 transition"
          >
            −
          </button>
          <span className="text-xs text-slate-300 w-12 text-center">{Math.round(pdfScale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={pdfScale >= 3}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs disabled:opacity-50 transition"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Page Navigation Bar */}
      <div className="bg-slate-900/50 p-2 border-b border-slate-700/30 flex items-center justify-center gap-3">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs disabled:opacity-50 transition"
        >
          ← Prev
        </button>
        <span className="text-xs text-slate-300">
          Page{' '}
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={currentPage}
            onChange={(e) => {
              const page = Number(e.target.value);
              if (page >= 1 && page <= numPages) goToPage(page);
            }}
            className="w-12 bg-slate-800 border border-slate-600 rounded text-center text-xs px-1 py-0.5 focus:outline-none focus:border-cyan-500"
          />
          {' '}of {numPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={!numPages || currentPage >= numPages}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs disabled:opacity-50 transition"
        >
          Next →
        </button>
      </div>

      {/* PDF Content */}
      <div className="max-h-[800px] overflow-y-auto bg-slate-950">
        {pdfFile && !pdfLoadError ? (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="h-96 flex items-center justify-center text-slate-400">
                Loading PDF preview...
              </div>
            }
            error={
              <div className="h-96 flex items-center justify-center text-red-400 p-4 text-center">
                Failed to load PDF. Please try again.
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
              <div
                key={page}
                ref={(el) => { pageRefs.current[page] = el; }}
                className="flex flex-col items-center py-4"
                onClick={() => onPageChange?.(page)}
              >
                <div className="text-xs text-slate-500 mb-2 px-2">
                  Page {page} of {numPages}
                </div>
                <Page
                  pageNumber={page}
                  scale={pdfScale}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                  loading={
                    <div className="h-32 flex items-center justify-center text-slate-500">
                      Loading page…
                    </div>
                  }
                  error={
                    <div className="h-32 flex items-center justify-center text-red-400 text-sm">
                      Error loading page
                    </div>
                  }
                  className="shadow-lg"
                />
              </div>
            ))}
          </Document>
        ) : pdfLoadError ? (
          <div className="h-96 flex items-center justify-center text-red-400 p-4 text-center">
            <div>
              <p className="font-semibold mb-2">Failed to load PDF</p>
              <p className="text-sm text-slate-400">{pdfLoadError.message}</p>
            </div>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-slate-400">
            Loading PDF preview...
          </div>
        )}
      </div>
    </div>
  );
}