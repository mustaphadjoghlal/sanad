import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "../../../lib/firebase";
import { previewByKind } from "../../../lib/previewProfiles";
import UserDashboard from "../user/UserDashboard";

/**
 * The member dashboard as a given kind of member sees it.
 *
 * Checking how a change reads for a متجر used to mean registering a fake
 * store, approving it, filling it in, looking, and deleting it again. This is
 * the same screen in the same frame, from a stand-in profile.
 *
 * Admin only — not because the stand-ins are secret, but because a page that
 * renders the member dashboard from arbitrary data has no business being
 * open to anyone.
 */
export default function PreviewMember() {
  const { kind } = useParams();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(
    () => onAuthStateChanged(auth, (user) => setAllowed(user?.email === ADMIN_EMAIL)),
    []
  );

  const preview = previewByKind(kind);

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0e0e", color: "var(--theme-text-muted, #4a7a4a)" }}>
        جارٍ التحقّق...
      </div>
    );
  }
  if (!allowed) return <Navigate to="/sanad-admin" replace />;
  if (!preview) return <Navigate to="/sanad-admin/dashboard" replace />;

  return <UserDashboard preview={preview.profile} />;
}
