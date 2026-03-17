import { Download, Eye, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFileSize, getFileIcon, canPreview } from "@/utils/fileTypeHelpers";
import type { AttachmentWithContext } from "@/services/db/attachments";

interface AttachmentListItemProps {
    attachment: AttachmentWithContext;
    onPreview: () => void;
    onDownload: () => void;
    onJumpToEmail: () => void;
}

export function AttachmentListItem({ attachment, onPreview, onDownload, onJumpToEmail }: AttachmentListItemProps) {
    const { t, i18n } = useTranslation();
    const previewable = canPreview(attachment.mime_type, attachment.filename);
    const senderName = attachment.from_name || attachment.from_address || t("attachments.item.unknown_sender");

    const formatShortDate = (timestamp: number | null): string => {
        if (!timestamp) return "";
        return new Date(timestamp).toLocaleDateString(i18n.language === "zh" ? "zh-CN" : "en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="group flex items-center gap-3 px-3 py-2 hover:bg-bg-hover rounded-md transition-colors">
            {/* Icon */}
            <span className="text-lg shrink-0 w-7 text-center">{getFileIcon(attachment.mime_type)}</span>

            {/* Filename */}
            <span className="text-sm text-text-primary truncate min-w-0 flex-1" title={attachment.filename ?? undefined}>
                {attachment.filename ?? t("attachments.item.unnamed")}
            </span>

            {/* Sender */}
            <span className="text-xs text-text-secondary truncate w-36 shrink-0 hidden md:block" title={senderName}>
                {senderName}
            </span>

            {/* Date */}
            <span className="text-xs text-text-tertiary w-24 shrink-0 text-right hidden md:block">
                {formatShortDate(attachment.date)}
            </span>

            {/* Size */}
            <span className="text-xs text-text-tertiary w-16 shrink-0 text-right">
                {attachment.size != null ? formatFileSize(attachment.size) : ""}
            </span>

            {/* Actions */}
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {previewable && (
                    <button
                        onClick={onPreview}
                        className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                        title={t("attachments.actions.preview")}
                    >
                        <Eye size={14} />
                    </button>
                )}
                <button
                    onClick={onDownload}
                    className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                    title={t("attachments.actions.download")}
                >
                    <Download size={14} />
                </button>
                <button
                    onClick={onJumpToEmail}
                    className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                    title={t("attachments.actions.jump_to_email")}
                >
                    <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );
}
