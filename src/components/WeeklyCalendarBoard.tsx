import React, { useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { CerimonialEvent, WeekBucket } from '../types/event';
import {
  formatIsoToBrShort,
  getWeekdayNamePt,
  sortEventsChronologically,
} from '../utils/dateAndWhatsApp';

interface WeeklyCalendarBoardProps {
  events: CerimonialEvent[];
  weekBuckets: WeekBucket[];
  selectedWeekId: string;
  onSelectWeekId: (weekId: string) => void;
  todayIso: string;
  onSelectEvent: (event: CerimonialEvent) => void;
  onGoToWhatsApp: () => void;
}

export const WeeklyCalendarBoard: React.FC<WeeklyCalendarBoardProps> = ({
  events,
  weekBuckets,
  selectedWeekId,
  onSelectWeekId,
  todayIso,
  onSelectEvent,
  onGoToWhatsApp,
}) => {
  const activeWeek = useMemo(() => {
    return (
      weekBuckets.find((w) => w.id === selectedWeekId) || weekBuckets[0] || null
    );
  }, [weekBuckets, selectedWeekId]);

  const groupedByDay = useMemo(() => {
    if (!activeWeek) return [];
    const weekEvents = sortEventsChronologically(
      events.filter(
        (ev) =>
          ev.isoDate &&
          ev.isoDate >= activeWeek.startIso &&
          ev.isoDate <= activeWeek.endIso
      )
    );

    const map = new Map<string, CerimonialEvent[]>();
    for (const ev of weekEvents) {
      if (!ev.isoDate) continue;
      const list = map.get(ev.isoDate) || [];
      list.push(ev);
      map.set(ev.isoDate, list);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events, activeWeek]);

  return (
    <div className="space-y-5">
      {/* Week selector bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {weekBuckets.map((wb) => {
            const isSelected = activeWeek?.id === wb.id;
            return (
              <button
                key={wb.id}
                type="button"
                onClick={() => onSelectWeekId(wb.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {wb.relativeTag === 'current'
                  ? `Esta semana · ${wb.shortRange}`
                  : wb.relativeTag === 'next'
                  ? `Próxima · ${wb.shortRange}`
                  : wb.shortRange}{' '}
                <span className="font-mono opacity-80 tabular-nums">
                  ({wb.eventCount})
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onGoToWhatsApp}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-900 whitespace-nowrap shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          Enviar semana por WhatsApp
        </button>
      </div>

      {/* Day-by-Day Agenda */}
      {groupedByDay.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <Calendar className="mx-auto h-9 w-9 text-slate-300" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Semana sem eventos cadastrados
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Selecione outro período acima ou sincronize a planilha para buscar
            novos agendamentos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDay.map(([isoDate, dayEvents]) => {
            const isToday = isoDate === todayIso;
            const weekday = getWeekdayNamePt(isoDate);
            const brShort = formatIsoToBrShort(isoDate);

            return (
              <section
                key={isoDate}
                className={`rounded-xl border bg-white overflow-hidden ${
                  isToday ? 'border-emerald-600/40' : 'border-slate-200'
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b px-5 py-3 ${
                    isToday
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-slate-200 bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {weekday},{' '}
                      <span className="font-mono tabular-nums">{brShort}</span>
                    </h3>
                    {isToday && (
                      <span className="text-xs font-semibold text-emerald-800">
                        · Hoje
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {dayEvents.length}{' '}
                    {dayEvents.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {dayEvents.map((ev) => {
                    const missing: string[] = [];
                    if (!ev.horario) missing.push('Horário');
                    if (!ev.espaco) missing.push('Espaço');
                    if (!ev.supervisao) missing.push('Supervisão');

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelectEvent(ev)}
                        className="flex w-full flex-col gap-2 px-5 py-3.5 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <div className="w-28 shrink-0 pt-0.5">
                            {ev.horario ? (
                              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {ev.horario}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                <AlertTriangle className="h-3.5 w-3.5" />A
                                definir
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold leading-snug text-slate-900">
                              {ev.nomeEvento}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {ev.espaco || 'Local a definir'}
                              </span>
                              {ev.requerente && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Req.: {ev.requerente}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-800">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                            {ev.supervisao || (
                              <span className="text-amber-700">
                                Sem supervisão
                              </span>
                            )}
                          </div>
                          {ev.apoio && (
                            <span className="text-[11px] text-slate-500">
                              Apoio: {ev.apoio}
                            </span>
                          )}
                          {ev.realizado ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Realizado
                            </span>
                          ) : (
                            missing.length > 0 && (
                              <span className="text-[11px] font-medium text-amber-700">
                                Falta: {missing.join(', ')}
                              </span>
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
