import { getAllReviews } from "@/lib/reviews";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingReviewsCount = (await getAllReviews()).filter(
    (review) => review.status === "en_attente"
  ).length;

  return (
    <div className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-base-300">
          <span className="font-bold">Espace VIVRE BIO</span>
          <label
            htmlFor="admin-drawer"
            className="btn btn-square btn-ghost btn-sm"
            aria-label="Ouvrir le menu"
          >
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </label>
        </div>
        <main className="flex-1">{children}</main>
      </div>
      <div className="drawer-side z-30">
        <label
          htmlFor="admin-drawer"
          aria-label="Fermer le menu"
          className="drawer-overlay"
        />
        <AdminSidebar pendingReviewsCount={pendingReviewsCount} />
      </div>
    </div>
  );
}
