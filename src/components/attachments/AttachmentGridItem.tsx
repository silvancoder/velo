import { Download, Eye, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFileSize, getFileIcon, canPreview } from "@/utils/fileTypeHelpers";
import type { AttachmentWithContext } from "@/services/db/attachments";

interface AttachmentGridItemProps {
    attachment: AttachmentWithContext;
    onPreview: () => void;
    onDownload: () => void;
    onJumpToEmail: () => void;
}

function formatRelativeDate(timestamp: number | null, t: any): string {
    if (!timestamp) return "";
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t("common.relative_time.m_ago", { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("common.relative_time.h_ago", { count: hrs });
    const days = Math.floor(hrs / 24);
    if (days < 30) return t("common.relative_time.d_ago", { count: days });
    const months = Math.floor(days / 30);
    if (months < 12) return t("common.relative_time.mo_ago", { count: months });
    return t("common.relative_time.y_ago", { count: Math.floor(months / 12) });
}

export function AttachmentGridItem({ attachment, onPreview, onDownload, onJumpToEmail }: AttachmentGridItemProps) {
    const { t } = useTranslation();
    const previewable = canPreview(attachment.mime_type, attachment.filename);
    const senderName = attachment.from_name || attachment.from_address || t("attachments.item.unknown_sender");

    return (
        <div className="group relative flex flex-col border border-border-primary rounded-lg hover:border-border-secondary hover:bg-bg-hover transition-colors overflow-hidden">
            {/* Icon area */}
            <button
                onClick={previewable ? onPreview : onDownload}
                className="flex items-center justify-center h-24 bg-bg-secondary text-3xl"
            >
                {getFileIcon(attachment.mime_type)}
            </button>

            {/* Info */}
            <div className="px-3 py-2 flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-medium text-text-primary truncate" title={attachment.filename ?? undefined}>
                    {attachment.filename ?? t("attachments.item.unnamed")}
                </span>
                <span className="text-[0.6875rem] text-text-tertiary truncate" title={senderName}>
                    {senderName}
                </span>
                <div className="flex items-center gap-2 text-[0.6875rem] text-text-tertiary">
                    {attachment.size != null && <span>{formatFileSize(attachment.size)}</span>}
                    {attachment.date && <span>{formatRelativeDate(attachment.date, t)}</span>}
                </div>
            </div>

            {/* Hover actions */}
            <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {previewable && (
                    <button
                        onClick={onPreview}
                        className="p-1.5 rounded-md bg-bg-primary/90 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
                        title={t("attachments.actions.preview")}
                    >
                        <Eye size={13} />
                    </button>
                )}
                <button
                    onClick={onDownload}
                    className="p-1.5 rounded-md bg-bg-primary/90 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
                    title={t("attachments.actions.download")}
                >
                    <Download size={13} />
                </button>
                <button
                    onClick={onJumpToEmail}
                    className="p-1.5 rounded-md bg-bg-primary/90 border border-border-primary text-text-secondary hover:text-text-primary transition-colors"
                    title={t("attachments.actions.jump_to_email")}
                >
                    <ExternalLink size={13} />
                </button>
            </div>
        </div>
    );
}
