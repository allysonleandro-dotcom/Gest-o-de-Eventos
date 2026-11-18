import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Users,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { CerimonialEvent } from '../types/event';
import {
  buildWhatsAppHref,
  formatIsoToBrFull,
  formatSingleEventWhatsApp,
  getWeekdayNamePt,
} from '../utils/dateAndWhatsApp';

interface EventDetailDrawerProps {
  event: CerimonialEvent | null;
  onClose: () => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const singleText = formatSingleEventWhatsApp(event);
  const waHref = buildWhatsAppHref(singleText);

  const missingItems: string[] = [];
  if (!event.horario) missingItems.push('Horário');
  if (!event.espaco) missingItems.push('Espaço');
  if (!event.supervisao) missingItems.push('Supervisão');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(singleText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-drawer-title"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              Linha {event.rowNumber} da planilha ·{' '}
              {event.realizado ? 'Realizado' : 'Agendado'}
            </p>
            <h2
              id="event-drawer-title"
              className="mt-1 text-base font-semibold leading-snug text-slate-900"
            >
              {event.nomeEvento}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 shrink-0"
            aria-label="Fechar detalhes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {missingItems.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Campos pendentes na planilha</p>
                <p className="mt-0.5 text-amber-800">
                  Falta preencher: {missingItems.join(', ')}.
                </p>
              </div>
            </div>
          )}

          <dl className="divide-y divide-slate-100 border-y border-slate-200">
            <div className="flex items-start gap-3 py-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Data</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-slate-900 tabular-nums">
                  {event.isoDate
                    ? `${formatIsoToBrFull(event.isoDate)} (${getWeekdayNamePt(
                        event.isoDate
                      )})`
                    : event.dataRaw || 'Não informada'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Horário</dt>
                <dd className="mt-0.5 font-mono text-sm font-medium text-slate-900 tabular-nums">
                  {event.horario || 'A definir'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Espaço</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">
                  {event.espaco || 'Não definido'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Requerente</dt>
                <dd className="mt-0.5 text-sm text-slate-900">
                  {event.requerente || 'Não informado'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Supervisão</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">
                  {event.supervisao || 'A definir'}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 py-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">Apoio</dt>
                <dd className="mt-0.5 text-sm text-slate-900">
                  {event.apoio || 'Nenhum designado'}
                </dd>
              </div>
            </div>
          </dl>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">
              Prévia para WhatsApp (evento individual)
            </p>
            <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs leading-relaxed text-slate-800">
              {singleText}
            </pre>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-700" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar texto
              </>
            )}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-900 whitespace-nowrap"
          >
            <ExternalLink className="h-4 w-4" />
            Enviar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
