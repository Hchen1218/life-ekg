"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, Key, Users, BarChart3, Copy, Download, RefreshCw, Plus, Lock, Eye, EyeOff } from "lucide-react";

interface KeyInfo {
  key: string;
  used: boolean;
  createdAt?: string;
  usedAt?: string;
  usedBy?: string;
}

interface UsageRecord {
  name: string;
  birthDate: string;
  birthPlace: string;
  usedAt: string;
  key: string;
  tokens: number;
}

interface Stats {
  totalKeys: number;
  usedKeys: number;
  unusedKeys: number;
  usageRate: string;
  totalUsage: number;
  todayUsage: number;
  totalTokens: number;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  
  const [activeTab, setActiveTab] = useState<"keys" | "users" | "stats">("stats");
  const [keys, setKeys] = useState<KeyInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsage, setRecentUsage] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [newKeys, setNewKeys] = useState<string[]>([]);

  const authHeader = { "Authorization": `Bearer ${password}` };

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/keys", { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [password]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats", { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentUsage(data.recentUsage || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [password]);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch("/api/admin/stats", { 
        headers: { "Authorization": `Bearer ${password}` }
      });
      if (res.ok) {
        setIsLoggedIn(true);
        localStorage.setItem("admin_password", password);
      } else {
        setLoginError("密码错误");
      }
    } catch (e) {
      setLoginError("登录失败");
    }
  };

  const generateKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ count: generateCount }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKeys(data.keys || []);
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportCSV = () => {
    const csv = ["激活码,状态,创建时间,使用时间,使用者"];
    keys.forEach(k => {
      csv.push(`${k.key},${k.used ? "已使用" : "未使用"},${k.createdAt || ""},${k.usedAt || ""},${k.usedBy || ""}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life-ekg-keys-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  useEffect(() => {
    const saved = localStorage.getItem("admin_password");
    if (saved) {
      setPassword(saved);
      fetch("/api/admin/stats", { headers: { "Authorization": `Bearer ${saved}` }})
        .then(res => {
          if (res.ok) {
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem("admin_password");
          }
        })
        .catch(() => {
          localStorage.removeItem("admin_password");
        })
        .finally(() => {
          setIsCheckingAuth(false);
        });
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === "keys") fetchKeys();
      else if (activeTab === "stats" || activeTab === "users") fetchStats();
    }
  }, [isLoggedIn, activeTab, fetchKeys, fetchStats]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] flex items-center justify-center animate-pulse">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <span className="text-[#86868B]">验证中...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-[#1D1D1F] text-xl">Life EKG 管理后台</span>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h1 className="text-xl font-bold text-[#1D1D1F] text-center mb-6">管理员登录</h1>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="请输入管理密码"
                  className="w-full px-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 pr-12"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868B]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {loginError && <p className="text-[#FF3B30] text-sm text-center">{loginError}</p>}
              
              <button
                onClick={handleLogin}
                className="w-full py-4 bg-[#007AFF] text-white font-semibold rounded-xl hover:bg-[#0066CC] active:scale-[0.98] transition-all"
              >
                登录
              </button>
            </div>
            
            <p className="text-xs text-[#86868B] text-center mt-4">
              默认密码: hello
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-[#1D1D1F] text-lg">Life EKG 管理后台</span>
          </div>
          <button
            onClick={() => { setIsLoggedIn(false); localStorage.removeItem("admin_password"); }}
            className="text-[#86868B] text-sm hover:text-[#1D1D1F]"
          >
            退出登录
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { id: "stats", label: "数据统计", icon: BarChart3 },
            { id: "keys", label: "激活码管理", icon: Key },
            { id: "users", label: "用户记录", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#007AFF] text-white"
                  : "bg-white text-[#1D1D1F] hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "stats" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "总激活码", value: stats.totalKeys, color: "text-[#007AFF]" },
                { label: "已使用", value: stats.usedKeys, color: "text-[#FF3B30]" },
                { label: "未使用", value: stats.unusedKeys, color: "text-[#34C759]" },
                { label: "使用率", value: `${stats.usageRate}%`, color: "text-[#FF9500]" },
                { label: "总使用次数", value: stats.totalUsage, color: "text-[#5856D6]" },
                { label: "今日使用", value: stats.todayUsage, color: "text-[#AF52DE]" },
                { label: "Token用量", value: stats.totalTokens.toLocaleString(), color: "text-[#FF2D55]" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                  <p className="text-[#86868B] text-sm mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            
            <button
              onClick={fetchStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[#007AFF] hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              刷新数据
            </button>
          </div>
        )}

        {activeTab === "keys" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-[#1D1D1F] mb-4">生成激活码</h2>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value) || 10)}
                  min={1}
                  max={100}
                  className="w-24 px-4 py-2 bg-[#F5F5F7] rounded-xl text-center"
                />
                <span className="text-[#86868B]">个</span>
                <button
                  onClick={generateKeys}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-xl hover:bg-[#0066CC]"
                >
                  <Plus className="w-4 h-4" />
                  生成
                </button>
              </div>
              
              {newKeys.length > 0 && (
                <div className="mt-4 p-4 bg-[#F5F5F7] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#34C759]">✓ 新生成 {newKeys.length} 个激活码</span>
                    <button
                      onClick={() => copyToClipboard(newKeys.join("\n"))}
                      className="text-[#007AFF] text-sm flex items-center gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      复制全部
                    </button>
                  </div>
                  <div className="max-h-40 overflow-auto font-mono text-sm">
                    {newKeys.map((k, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span>{k}</span>
                        <button onClick={() => copyToClipboard(k)} className="text-[#86868B] hover:text-[#007AFF]">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#1D1D1F]">激活码列表 ({keys.length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={fetchKeys}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#007AFF] hover:bg-gray-50 rounded-lg"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    刷新
                  </button>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#007AFF] hover:bg-gray-50 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    导出CSV
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#86868B] border-b">
                      <th className="pb-2 font-medium">激活码</th>
                      <th className="pb-2 font-medium">状态</th>
                      <th className="pb-2 font-medium">创建时间</th>
                      <th className="pb-2 font-medium">使用时间</th>
                      <th className="pb-2 font-medium">使用者</th>
                      <th className="pb-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 font-mono">{k.key}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            k.used ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                          }`}>
                            {k.used ? "已使用" : "未使用"}
                          </span>
                        </td>
                        <td className="py-3 text-[#86868B]">{k.createdAt?.split("T")[0] || "-"}</td>
                        <td className="py-3 text-[#86868B]">{k.usedAt?.split("T")[0] || "-"}</td>
                        <td className="py-3">{k.usedBy || "-"}</td>
                        <td className="py-3">
                          <button
                            onClick={() => copyToClipboard(k.key)}
                            className="text-[#86868B] hover:text-[#007AFF]"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1D1D1F]">用户使用记录 ({recentUsage.length})</h2>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#007AFF] hover:bg-gray-50 rounded-lg"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                刷新
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#86868B] border-b">
                    <th className="pb-2 font-medium">姓名</th>
                    <th className="pb-2 font-medium">出生日期</th>
                    <th className="pb-2 font-medium">出生地</th>
                    <th className="pb-2 font-medium">使用时间</th>
                    <th className="pb-2 font-medium">激活码</th>
                    <th className="pb-2 font-medium">Token</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsage.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3">{u.name}</td>
                      <td className="py-3 text-[#86868B]">{u.birthDate}</td>
                      <td className="py-3 text-[#86868B]">{u.birthPlace}</td>
                      <td className="py-3 text-[#86868B]">{u.usedAt?.replace("T", " ").slice(0, 16) || "-"}</td>
                      <td className="py-3 font-mono text-xs">{u.key}</td>
                      <td className="py-3">{u.tokens?.toLocaleString() || "-"}</td>
                    </tr>
                  ))}
                  {recentUsage.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#86868B]">暂无使用记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
