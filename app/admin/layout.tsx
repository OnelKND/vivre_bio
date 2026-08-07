import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminToastListener from "@/components/admin/AdminToastListener";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AdminToastListener />
      </Suspense>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        toastStyle={{
          backgroundColor: "#111",
          color: "#fff",
          fontSize: "0.9rem",
          borderRadius: "0.75rem",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        }}
      />
    </>
  );
}
