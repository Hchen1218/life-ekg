"use client";

import { useState } from "react";
import { Download, Share2, Check, Loader2 } from "lucide-react";

interface ReportExportProps {
  reportRef: React.RefObject<HTMLDivElement>;
  userName?: string;
}

export function ReportExport({ reportRef, userName = "用户" }: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const generatePDF = async (): Promise<Blob> => {
    if (!reportRef.current) throw new Error("Report element not found");
    
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: "#F5F5F7",
      scale: 2,
      useCORS: true,
      logging: false,
      ignoreElements: (element) => element.classList.contains("no-print"),
    });
    
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const pdfWidth = 210;
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
    
    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    return pdf.output("blob");
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    
    try {
      const pdfBlob = await generatePDF();
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.download = `Life-EKG-${userName}-${new Date().toISOString().split("T")[0]}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!reportRef.current) return;
    
    setIsSharing(true);
    
    try {
      const pdfBlob = await generatePDF();
      const fileName = `Life-EKG-${userName}-${new Date().toISOString().split("T")[0]}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });
      
      const shareData = {
        title: "Life EKG 人生心电图报告",
        text: `${userName}的人生运势分析报告`,
        files: [file],
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        alert("您的设备不支持直接分享文件，已为您自动下载报告。");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        alert("分享失败，请重试");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={handleDownload}
        disabled={isExporting}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : exportSuccess ? (
          <Check className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? "生成中..." : exportSuccess ? "已保存" : "下载报告"}</span>
      </button>

      <button
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        {isSharing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Share2 className="w-4 h-4" />
        )}
        <span>{isSharing ? "生成中..." : "分享报告"}</span>
      </button>
    </div>
  );
}
