import React from "react";
import { Button, Tooltip } from "antd";
import { SyncOutlined, ReloadOutlined } from "@ant-design/icons";
import { useIsFetching } from "@tanstack/react-query";
import { useSyncMailboxCommand } from "@/services/emails";
import { useGetMailboxesQuery } from "@/services/mailboxes";
import { useMailboxStore } from "@/stores/mailbox.store";
import { useInvalidateMailQueries } from "@/hooks/useInvalidateMailQueries";

export interface MailSidebarActionsProps {
  /** When true, no bottom margin (e.g. for header) */
  compact?: boolean;
}

const MailSidebarActions: React.FC<MailSidebarActionsProps> = ({
  compact = false,
}) => {
  const { selectedMailboxId } = useMailboxStore();
  const { data: mailboxes = [] } = useGetMailboxesQuery();
  const invalidateMailQueries = useInvalidateMailQueries();
  const { syncMutation } = useSyncMailboxCommand();

  const syncLoading = syncMutation.isPending;
  const emailsFetching = useIsFetching({ queryKey: ["emails"] });
  const threadsFetching = useIsFetching({ queryKey: ["threads"] });
  const refreshLoading = emailsFetching > 0 || threadsFetching > 0;

  const handleSync = () => {
    const mailboxId =
      selectedMailboxId || (mailboxes.length > 0 ? mailboxes[0].id : null);
    if (mailboxId) {
      syncMutation.mutate(mailboxId);
    }
  };

  const handleRefresh = () => {
    invalidateMailQueries();
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: compact ? 0 : 16,
        alignItems: "center",
      }}
    >
      <Tooltip title="Sync emails from server">
        <Button
          icon={<SyncOutlined spin={syncLoading} />}
          onClick={handleSync}
          loading={syncLoading}
          style={{ flex: 1 }}
        >
          Sync
        </Button>
      </Tooltip>
      <Tooltip title="Refresh list">
        <Button
          icon={<ReloadOutlined spin={refreshLoading} />}
          onClick={handleRefresh}
        />
      </Tooltip>
    </div>
  );
};

export default MailSidebarActions;
