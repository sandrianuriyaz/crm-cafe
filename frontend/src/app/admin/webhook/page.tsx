import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPlaceholder } from "@/components/admin/admin-ui";

export default function Page() {
  return (
    <AdminShell title="Webhook Inbox">
      <AdminPlaceholder title="Webhook Inbox" />
    </AdminShell>
  );
}
