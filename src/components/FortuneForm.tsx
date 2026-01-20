"use client";

import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { SHICHEN_OPTIONS, FortuneAnalysisParams } from "@/types/fortune";

interface FortuneFormProps {
  onSubmit: (data: FortuneAnalysisParams, activationKey: string) => Promise<void>;
  isLoading?: boolean;
}

export function FortuneForm({ onSubmit, isLoading = false }: FortuneFormProps) {
  const [formData, setFormData] = useState<FortuneAnalysisParams>({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    currentLocation: "",
    gender: "男",
    pastEvents: "",
  });
  
  const [activationKey, setActivationKey] = useState("");

  const [errors, setErrors] = useState<Partial<Record<keyof FortuneAnalysisParams | "activationKey", string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FortuneAnalysisParams | "activationKey", string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "请输入姓名";
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "请选择出生日期";
    }
    if (!formData.birthTime) {
      newErrors.birthTime = "请选择出生时辰";
    }
    if (!formData.birthPlace.trim()) {
      newErrors.birthPlace = "请输入出生地";
    }
    if (!activationKey.trim()) {
      newErrors.activationKey = "请输入激活码";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // 先验证激活码
    try {
      const verifyRes = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: activationKey }),
      });
      
      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        setErrors((prev) => ({ ...prev, activationKey: errorData.error || "激活码验证失败" }));
        return;
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, activationKey: "网络错误，请稍后重试" }));
      return;
    }
    
    // 激活码验证通过，继续提交
    await onSubmit(formData, activationKey);
  };

  const handleChange = (field: keyof FortuneAnalysisParams, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center mb-8">
        <style>{`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            15% { transform: scale(1.1); }
            30% { transform: scale(1); }
          }
          .animate-heartbeat {
            animation: heartbeat 3s infinite;
          }
        `}</style>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] flex items-center justify-center animate-heartbeat">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-semibold text-[#1D1D1F] text-xl">Life EKG</span>
        </div>
        <div className="text-sm text-[#888888] mt-2 font-medium tracking-wide">
          看见命运的<span className="animate-heartbeat inline-block">脉搏</span> (See the <span className="animate-heartbeat inline-block">pulse</span> of your destiny)
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#1D1D1F] text-center mb-2">个人信息录入</h1>
        <p className="text-sm text-[#86868B] text-center mb-8">请填写您的基本信息以生成运势报告</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">姓名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="请输入您的姓名"
              disabled={isLoading}
              className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all disabled:opacity-50"
              required
            />
            {errors.name && <p className="text-xs text-[#FF3B30] mt-1">{errors.name}</p>}
          </div>

          {/* Birth Date Field */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">出生日期</label>
            <div className="relative">
              <div 
                className={`w-full px-4 py-4 bg-[#F5F5F7] rounded-xl transition-all ${
                  formData.birthDate ? "text-[#1D1D1F]" : "text-[#86868B]"
                }`}
              >
                {formData.birthDate ? (
                  (() => {
                    const [year, month, day] = formData.birthDate.split("-");
                    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
                  })()
                ) : (
                  "请选择出生日期"
                )}
              </div>
              
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange("birthDate", e.target.value)}
                disabled={isLoading}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                required
              />
            </div>
            {errors.birthDate && <p className="text-xs text-[#FF3B30] mt-1">{errors.birthDate}</p>}
          </div>

          {/* Gender Field */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">性别</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="男"
                  checked={formData.gender === "男"}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  disabled={isLoading}
                  className="w-5 h-5 accent-[#007AFF]"
                />
                <span className="text-[#1D1D1F]">男</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="女"
                  checked={formData.gender === "女"}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  disabled={isLoading}
                  className="w-5 h-5 accent-[#007AFF]"
                />
                <span className="text-[#1D1D1F]">女</span>
              </label>
            </div>
          </div>

          {/* Birth Time Field */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">出生时辰</label>
            <div className="relative">
              <select
                value={formData.birthTime}
                onChange={(e) => handleChange("birthTime", e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all appearance-none disabled:opacity-50"
                required
              >
                <option value="">请选择时辰</option>
                {SHICHEN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#86868B]">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.birthTime && <p className="text-xs text-[#FF3B30] mt-1">{errors.birthTime}</p>}
          </div>

          {/* Birth Place Field */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">出生地</label>
            <input
              type="text"
              value={formData.birthPlace}
              onChange={(e) => handleChange("birthPlace", e.target.value)}
              placeholder="例如：北京市海淀区"
              disabled={isLoading}
              className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all disabled:opacity-50"
              required
            />
            {errors.birthPlace && <p className="text-xs text-[#FF3B30] mt-1">{errors.birthPlace}</p>}
          </div>

          {/* Current Location Field (Optional) */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">现居地（可选）</label>
            <input
              type="text"
              value={formData.currentLocation}
              onChange={(e) => handleChange("currentLocation", e.target.value)}
              placeholder="例如：上海市浦东新区"
              disabled={isLoading}
              className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all disabled:opacity-50"
            />
          </div>

          {/* Past Events Field (Optional) */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">过去10年中发生的大事（可选）</label>
            <input
              type="text"
              value={formData.pastEvents}
              onChange={(e) => handleChange("pastEvents", e.target.value)}
              placeholder="如：2020 考试失利、2022 结婚"
              disabled={isLoading}
              className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all disabled:opacity-50"
            />
            <p className="text-xs text-[#86868B] mt-1">帮助我们更准确地校验命盘</p>
          </div>

          {/* Activation Key Field (Required) */}
          <div>
            <label className="block text-xs font-medium text-[#86868B] uppercase tracking-wide mb-2">激活码</label>
            <input
              type="text"
              value={activationKey}
              onChange={(e) => {
                setActivationKey(e.target.value.toUpperCase());
                if (errors.activationKey) {
                  setErrors((prev) => ({ ...prev, activationKey: undefined }));
                }
              }}
              placeholder="LIFE-XXXX-XXXX-XXXX"
              disabled={isLoading}
              className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all disabled:opacity-50 font-mono"
              required
            />
            {errors.activationKey && <p className="text-xs text-[#FF3B30] mt-1">{errors.activationKey}</p>}
            <p className="text-xs text-[#86868B] mt-1">购买后获得的激活码</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0066CC] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在分析...
              </>
            ) : (
              "开始分析"
            )}
          </button>
        </form>
      </div>

      <p className="hidden text-xs text-[#86868B] text-center mt-6">您的信息将被安全加密处理</p>
    </div>
  );
}
