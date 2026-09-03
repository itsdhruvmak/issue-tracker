import "./globals.css";
import Link from "next/link";
import { CheckSquare, PlusCircle, ListTodo } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";
import UserDropdown from "@/components/auth/UserDropdown";

export const metadata = {
  title: "Issue Tracker",
  description: "Modern issue and bug tracking system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        <AuthProvider>
          {/* Navigation Header */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  Issue<span className="text-blue-600">Tracker</span>
                </span>
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ListTodo className="w-4 h-4" />
                  All Issues
                </Link>
                <Link
                  href="/issues/new"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Issue
                </Link>

                <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                {/* Dynamic User Profile / Login Dropdown */}
                <UserDropdown />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 bg-white mt-auto py-6">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
              Issue Tracker &copy; {new Date().getFullYear()} — Streamline your workflow
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}