export type QrVisibility = "PUBLIC" | "PRIVATE";

interface QrAccessOptions {
  showQr: boolean;
  qrVisibility?: QrVisibility | null;
  isAdmin: boolean;
}

export function getQrVisibility(visibility?: QrVisibility | null): QrVisibility {
  return visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

export function getQrAccess({ showQr, qrVisibility, isAdmin }: QrAccessOptions) {
  const visibility = getQrVisibility(qrVisibility);
  const canUseQr = showQr;
  const canSeeQr = isAdmin || (showQr && visibility === "PUBLIC");
  const adminStateLabel = !showQr
    ? "Disabled for users"
    : visibility === "PRIVATE"
      ? "Visible to admins only"
      : "Visible to everyone";

  return {
    visibility,
    canUseQr,
    canSeeQr,
    adminStateLabel,
    isAdminPreviewOnly: isAdmin && !showQr,
    isAdminPrivateView: isAdmin && showQr && visibility === "PRIVATE",
  };
}
