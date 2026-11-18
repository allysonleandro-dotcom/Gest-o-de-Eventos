import {
  CerimonialEvent,
  WeekBucket,
  WhatsAppComposerOptions,
} from '../types/event';

const WEEKDAYS_PT = [
  'DOMINGO',
  'SEGUNDA-FEIRA',
  'TERÇA-FEIRA',
  'QUARTA-FEIRA',
  'QUINTA-FEIRA',
  'SEXTA-FEIRA',
  'SÁBADO',
];

const MONTHS_SHORT_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoToUtcDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatUtcDateToIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMondayOfIsoWeek(iso: string): string {
  const d = parseIsoToUtcDate(iso);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return formatUtcDateToIso(d);
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseIsoToUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUtcDateToIso(d);
}

export function formatIsoToBrShort(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function formatIsoToBrFull(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function getWeekdayNamePt(iso: string): string {
  const d = parseIsoToUtcDate(iso);
  return WEEKDAYS_PT[d.getUTCDay()];
}

export function formatShortWeekRange(startIso: string, endIso: string): string {
  const [y1, m1, d1] = startIso.split('-').map(Number);
  const [y2, m2, d2] = endIso.split('-').map(Number);
  if (m1 === m2 && y1 === y2) {
    return `${String(d1).padStart(2, '0')} a ${String(d2).padStart(2, '0')} ${
      MONTHS_SHORT_PT[m1 - 1]
    } ${y1}`;
  }
  return `${String(d1).padStart(2, '0')}/${String(m1).padStart(
    2,
    '0'
  )} a ${String(d2).padStart(2, '0')}/${String(m2).padStart(
    2,
    '0'
  )}/${y2}`;
}

export function sortEventsChronologically(
  events: CerimonialEvent[]
): CerimonialEvent[] {
  return [...events].sort((a, b) => {
    if (a.isoDate && b.isoDate && a.isoDate !== b.isoDate) {
      return a.isoDate.localeCompare(b.isoDate);
    }
    if (a.isoDate && !b.isoDate) return -1;
    if (!a.isoDate && b.isoDate) return 1;
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return a.rowNumber - b.rowNumber;
  });
}

export function buildWeekBuckets(
  events: CerimonialEvent[],
  referenceTodayIso: string
): WeekBucket[] {
  const currentMonday = getMondayOfIsoWeek(referenceTodayIso);
  const nextMonday = addDaysIso(currentMonday, 7);

  const counts = new Map<string, number>();
  // Always ensure current week and next week appear as selectable buckets
  counts.set(currentMonday, 0);
  counts.set(nextMonday, 0);

  for (const ev of events) {
    if (!ev.isoDate) continue;
    const mon = getMondayOfIsoWeek(ev.isoDate);
    counts.set(mon, (counts.get(mon) || 0) + 1);
  }

  const sortedMondays = Array.from(counts.keys()).sort((a, b) =>
    a.localeCompare(b)
  );

  return sortedMondays.map((mon) => {
    const sun = addDaysIso(mon, 6);
    const shortRange = formatShortWeekRange(mon, sun);
    let relativeTag: WeekBucket['relativeTag'] = 'future';
    let prefix = 'Semana de';

    if (mon === currentMonday) {
      relativeTag = 'current';
      prefix = 'Esta semana';
    } else if (mon === nextMonday) {
      relativeTag = 'next';
      prefix = 'Próxima semana';
    } else if (mon < currentMonday) {
      relativeTag = 'past';
      prefix = 'Semana anterior';
    }

    return {
      id: mon,
      startIso: mon,
      endIso: sun,
      label:
        relativeTag === 'current' || relativeTag === 'next'
          ? `${prefix} (${shortRange})`
          : shortRange,
      shortRange,
      relativeTag,
      eventCount: counts.get(mon) || 0,
    };
  });
}

export function formatWhatsAppWeeklyMessage(
  events: CerimonialEvent[],
  weekLabel: string,
  options: WhatsAppComposerOptions
): string {
  const filtered = sortEventsChronologically(
    options.includeRealizados ? events : events.filter((e) => !e.realizado)
  );

  if (filtered.length === 0) {
    return `${options.headerText.trim()}\n\n_${weekLabel}_\n\nNenhum evento pendente encontrado para este período.`;
  }

  const lines: string[] = [];

  if (options.headerText.trim()) {
    lines.push(options.headerText.trim());
  }
  lines.push(`*Cerimonial da Câmara dos Deputados*`);
  lines.push(`Período: *${weekLabel}* (${filtered.length} ${filtered.length === 1 ? 'evento' : 'eventos'})`);
  lines.push('');

  if (options.style === 'por-supervisao') {
    const groups = new Map<string, CerimonialEvent[]>();
    for (const ev of filtered) {
      const key = ev.supervisao || 'Sem supervisão definida';
      const list = groups.get(key) || [];
      list.push(ev);
      groups.set(key, list);
    }

    for (const [supervisor, list] of groups.entries()) {
      lines.push(`*SUPERVISÃO: ${supervisor.toUpperCase()}*`);
      for (const ev of list) {
        const dayPart = ev.isoDate
          ? `${formatIsoToBrShort(ev.isoDate)} (${getWeekdayNamePt(ev.isoDate).slice(0, 3)})`
          : ev.dataRaw || 'Data a definir';
        const timePart = ev.horario || 'Horário a confirmar';
        const spacePart = ev.espaco || 'Local a definir';
        lines.push(`• *${dayPart} · ${timePart}* — ${ev.nomeEvento}`);
        lines.push(`  Local: ${spacePart}${options.includeEquipe && ev.apoio ? ` | Apoio: ${ev.apoio}` : ''}`);
        if (options.includeRequerente && ev.requerente) {
          lines.push(`  Requerente: _${ev.requerente}_`);
        }
      }
      lines.push('');
    }
  } else {
    // Group by date
    const byDate = new Map<string, CerimonialEvent[]>();
    for (const ev of filtered) {
      const key = ev.isoDate || ev.dataRaw || 'SEM_DATA';
      const list = byDate.get(key) || [];
      list.push(ev);
      byDate.set(key, list);
    }

    for (const [dateKey, dayEvents] of byDate.entries()) {
      const headerDate =
        dateKey !== 'SEM_DATA' && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)
          ? `*${getWeekdayNamePt(dateKey)}, ${formatIsoToBrShort(dateKey)}*`
          : `*${dateKey}*`;

      lines.push(headerDate);

      if (options.style === 'compacto') {
        for (const ev of dayEvents) {
          const timeStr = ev.horario ? `${ev.horario}` : 'Horário a definir';
          const spaceStr = ev.espaco ? ` · ${ev.espaco}` : '';
          const supStr =
            options.includeEquipe && ev.supervisao
              ? ` · Sup.: ${ev.supervisao}`
              : '';
          const statusStr = ev.realizado ? ' [Realizado]' : '';
          lines.push(
            `• *${timeStr}* — ${ev.nomeEvento}${spaceStr}${supStr}${statusStr}`
          );
        }
        lines.push('');
      } else {
        // Detalhado
        for (const ev of dayEvents) {
          const timeStr = ev.horario || 'Horário a definir';
          const statusStr = ev.realizado ? ' _(Realizado)_' : '';
          lines.push(`▸ *${timeStr}* — *${ev.nomeEvento}*${statusStr}`);
          lines.push(`   Local: ${ev.espaco || 'A definir'}`);
          if (options.includeRequerente && ev.requerente) {
            lines.push(`   Requerente: ${ev.requerente}`);
          }
          if (options.includeEquipe) {
            const sup = ev.supervisao || 'A definir';
            const apoio = ev.apoio ? ` | Apoio: ${ev.apoio}` : '';
            lines.push(`   Supervisão: ${sup}${apoio}`);
          }
          if (options.includePendencias) {
            const missing: string[] = [];
            if (!ev.horario) missing.push('horário');
            if (!ev.espaco) missing.push('espaço');
            if (!ev.supervisao) missing.push('supervisão');
            if (missing.length > 0) {
              lines.push(`   _Pendência: definir ${missing.join(', ')}_`);
            }
          }
        }
        lines.push('');
      }
    }
  }

  if (options.footerText.trim()) {
    lines.push(options.footerText.trim());
  }

  return lines.join('\n').trim();
}

export function formatSingleEventWhatsApp(ev: CerimonialEvent): string {
  const dayLabel = ev.isoDate
    ? `${getWeekdayNamePt(ev.isoDate)}, ${formatIsoToBrFull(ev.isoDate)}`
    : ev.dataRaw || 'Data a definir';

  const parts = [
    `*${ev.nomeEvento}*`,
    `Data: ${dayLabel}`,
    `Horário: ${ev.horario || 'A definir'}`,
    `Local: ${ev.espaco || 'A definir'}`,
  ];
  if (ev.requerente) parts.push(`Requerente: ${ev.requerente}`);
  if (ev.supervisao) parts.push(`Supervisão: ${ev.supervisao}`);
  if (ev.apoio) parts.push(`Apoio: ${ev.apoio}`);
  return parts.join('\n');
}

export function buildWhatsAppHref(
  message: string,
  phoneNumber?: string,
  mode: 'api' | 'web' = 'api'
): string {
  const digits = (phoneNumber || '').replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  if (mode === 'web') {
    return digits
      ? `https://web.whatsapp.com/send?phone=${digits}&text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
  }
  return digits
    ? `https://wa.me/${digits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
