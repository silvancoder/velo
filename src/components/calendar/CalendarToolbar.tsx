import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";

export type CalendarView = "day" | "week" | "month";

interface CalendarToolbarProps {
    currentDate: Date;
    view: CalendarView;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onViewChange: (view: CalendarView) => void;
    onCreateEvent: () => void;
    onToggleCalendarList?: () => void;
    showCalendarListButton?: boolean;
}

export function CalendarToolbar({
    currentDate,
    view,
    onPrev,
    onNext,
    onToday,
    onViewChange,
    onCreateEvent,
    onToggleCalendarList,
    showCalendarListButton,
}: CalendarToolbarProps) {
    const { t } = useTranslation();
    const title = formatTitle(currentDate, view, t);

    return (
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-primary">
            <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onPrev}
                        className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={onToday}
                        className="px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                    >
                        {t("calendar.today")}
                    </button>
                    <button
                        onClick={onNext}
                        className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {showCalendarListButton && onToggleCalendarList && (
                    <button
                        onClick={onToggleCalendarList}
                        className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                        title={t("calendar.sidebar.toggle_list")}
                    >
                        <CalendarDays size={16} />
                    </button>
                )}
                <div className="flex bg-bg-tertiary rounded-md p-0.5">
                    {(["day", "week", "month"] as CalendarView[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => onViewChange(v)}
                            className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${view === v
                                    ? "bg-bg-primary text-text-primary shadow-sm"
                                    : "text-text-tertiary hover:text-text-secondary"
                                }`}
                        >
                            {t(`calendar.views.${v}`)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onCreateEvent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-md transition-colors"
                >
                    <Plus size={14} />
                    {t("calendar.create_event")}
                </button>
            </div>
        </div>
    );
}

function formatTitle(date: Date, view: CalendarView, t: any): string {
    const months = t("calendar.months.long", { returnObjects: true }) as string[];
    if (view === "month") {
        return t("common.date_month_year", {
            month: months[date.getMonth()],
            year: date.getFullYear(),
            defaultValue: `${months[date.getMonth()]} ${date.getFullYear()}`
        });
    }
    if (view === "week") {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        if (start.getMonth() === end.getMonth()) {
            return t("common.date_week_same_month", {
                month: months[start.getMonth()],
                start: start.getDate(),
                end: end.getDate(),
                year: start.getFullYear(),
                defaultValue: `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
            });
        }
        const shortMonths = t("calendar.months.short", { returnObjects: true }) as string[];
        return t("common.date_week_diff_month", {
            startMonth: shortMonths[start.getMonth()],
            startDay: start.getDate(),
            endMonth: shortMonths[end.getMonth()],
            endDay: end.getDate(),
            year: end.getFullYear(),
            defaultValue: `${shortMonths[start.getMonth()]} ${start.getDate()} - ${shortMonths[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
        });
    }
    return date.toLocaleDateString(t("common.locale", { defaultValue: undefined }), { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
