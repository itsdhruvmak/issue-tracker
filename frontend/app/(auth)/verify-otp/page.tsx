import VerifyOTPForm from "@/components/auth/VerifyOTPForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Verify OTP — Issue Tracker",
};

export default function VerifyOTPPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-600" />}>
        <VerifyOTPForm />
      </Suspense>
    </div>
  );
}
