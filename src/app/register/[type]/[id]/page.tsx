import QrActionPage from "@/components/qr/QrActionPage";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  return <QrActionPage params={params} mode="register" />;
}
