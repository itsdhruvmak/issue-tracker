import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Issue Tracker",
  description: "Modern issue and bug tracking system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />

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
