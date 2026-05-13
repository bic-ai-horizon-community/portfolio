export function getQrFriendlyError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.toLowerCase();

  if (message.includes("max clients reached") || message.includes("emaxconnsession")) {
    return {
      message: "QR service is busy right now. Please try again in a moment.",
      status: 503,
    };
  }

  return null;
}
