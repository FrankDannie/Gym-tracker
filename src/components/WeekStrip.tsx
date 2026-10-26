import { SCHEDULE, SESSIONS } from "../data/plan";
import { formatShort, weekDates, weekdayIndex, type ISODate } from "../lib/dates";
import { href } from "../lib/router";
import { dayProgress, sessionFor } from "../lib/stats";
import type { AppState } from "../lib/store";
import { Plate } from "./Plate";

interface Props {
  state: AppState;
  viewing: ISODate;
  today: ISODate;
  className?: string;
}

export function WeekStrip({ state, viewing, today, className }: Props) {
  return (
    <nav className={`week ${className ?? ""}`} aria-label="This week">
      {weekDates(viewing).map((date) => {
        const session = SESSIONS[sessionFor(date, state)];
        const prog = dayProgress(date, state);
        const idx = weekdayIndex(date);
        const isToday = date === today;
        return (
          <a
            key={date}
            className="week-day"
            href={href("today", date === today ? undefined : date)}
            aria-current={date === viewing ? "date" : undefined}
            data-today={isToday}
            data-viewing={date === viewing}
            aria-label={`${SCHEDULE[idx].day} ${formatShort(date)}: ${session.title}, ${prog.complete ? "complete" : `${prog.done} of ${prog.total}`}`}
          >
            <span className="week-name">{SCHEDULE[idx].short}</span>
            <Plate session={session} progress={prog.total ? prog.done / prog.total : 0} complete={prog.complete} />
          </a>
        );
      })}
    </nav>
  );
}
