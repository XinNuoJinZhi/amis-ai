import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 设置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfViewerProps {
  src?: string | Blob | File;
  value?: string | Blob | File | any[]; // 支持 Form.Item 自动注入的 value，可能是 fileList 数组
  width?: number;
  height?: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  src,
  value,
  width = 600,
  height,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // 优先使用 value（Form.Item 注入），fallback 到 src
  const pdfSource = value || src;

  useEffect(() => {
    if (!pdfSource) {
      setPdfUrl(null);
      return;
    }

    // 处理 Upload 组件的 fileList 数组
    if (Array.isArray(pdfSource) && pdfSource.length > 0) {
      const file = pdfSource[0];
      // Upload 组件返回的文件对象，originFileObj 是真实的 File 对象
      const fileObj = file.originFileObj || file;

      if (fileObj instanceof Blob || fileObj instanceof File) {
        const url = URL.createObjectURL(fileObj);
        setPdfUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      }
    }

    // 如果是 Blob 或 File，转换为 URL
    if (pdfSource instanceof Blob || pdfSource instanceof File) {
      const url = URL.createObjectURL(pdfSource);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    // 如果是字符串 URL
    if (typeof pdfSource === 'string') {
      setPdfUrl(pdfSource);
    }
  }, [pdfSource]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (!pdfUrl) {
    return (
      <div style={{
        width,
        height: height || 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #d9d9d9',
        borderRadius: 4,
        color: '#999',
      }}>
        请选择 PDF 文件
      </div>
    );
  }

  return (
    <div style={{ width, height, overflow: 'auto' }}>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div>加载中...</div>}
        error={<div>PDF 加载失败</div>}
      >
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={width}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        ))}
      </Document>
    </div>
  );
};

export default PdfViewer;
