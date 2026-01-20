"use client";

import { useRef, useState } from "react";
import { Download, Share2, Check, Loader2 } from "lucide-react";

interface ReportExportProps {
  reportRef: React.RefObject<HTMLDivElement>;
  userName?: string;
}

export function ReportExport({ reportRef, userName = "用户" }: ReportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const generateReportCanvas = async () => {
    if (!reportRef.current) throw new Error("Report element not found");
    
    try {
      const html2canvas = (await import("html2canvas")).default;
      return await html2canvas(reportRef.current, {
        backgroundColor: "#F5F5F7",
        scale: 2,
        useCORS: true,
        logging: true,
        ignoreElements: (element) => element.classList.contains("no-print"),
      });
    } catch (error) {
      console.error("html2canvas error:", error);
      alert(`生成图片失败: ${(error as Error).message}`);
      throw error;
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    
    try {
      const canvas = await generateReportCanvas();

      const link = document.createElement("a");
      link.download = `life-ekg-report-${userName}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
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
      const canvas = await generateReportCanvas();

      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) {
        throw new Error("Failed to create blob");
      }

      const file = new File([blob], `life-ekg-report.png`, { type: "image/png" });
      const shareData = {
        title: "Life EKG 人生心电图报告",
        text: `${userName}的人生运势分析报告`,
        files: [file],
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support file sharing
        const link = document.createElement("a");
        link.download = `life-ekg-report-${userName}-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        alert("您的设备不支持直接分享图片，已为您自动下载报告图片。");
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
