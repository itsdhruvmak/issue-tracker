import RegisterForm from "@/components/auth/RegisterForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Register — Issue Tracker",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-blue-600" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
