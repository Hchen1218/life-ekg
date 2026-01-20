import { LayoutDashboard, LineChart, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-gray-200 bg-white h-screen fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="flex items-center justify-center lg:justify-start h-20 px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M4 12h3l2-6 4 12 3-6h4" />
            </svg>
          </div>
          <span className="hidden lg:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Life EKG
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <div className="flex items-center gap-3 px-3 py-3 text-white bg-black rounded-2xl cursor-pointer shadow-lg shadow-black/5 transition-all hover:scale-[1.02]">
          <LayoutDashboard className="w-5 h-5" />
          <span className="hidden lg:block font-medium">仪表盘</span>
        </div>
        
        <div className="flex items-center gap-3 px-3 py-3 text-gray-500 hover:text-black hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors">
          <LineChart className="w-5 h-5" />
          <span className="hidden lg:block font-medium">详细分析</span>
        </div>

        <div className="flex items-center gap-3 px-3 py-3 text-gray-500 hover:text-black hover:bg-gray-50 rounded-2xl cursor-pointer transition-colors">
          <Settings className="w-5 h-5" />
          <span className="hidden lg:block font-medium">设置</span>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold text-gray-900">个人资料</p>
            <p className="text-xs text-gray-500">基础版</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
