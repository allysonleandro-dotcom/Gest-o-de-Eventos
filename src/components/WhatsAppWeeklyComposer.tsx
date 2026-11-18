import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  CerimonialEvent,
  WeekBucket,
  WhatsAppComposerOptions,
  WhatsAppFormatStyle,
} from '../types/event';
import {
  buildWhatsAppHref,
  formatIsoToBrShort,
  formatWhatsAppWeeklyMessage,
  getWeekdayNamePt,
  sortEventsChronologically,
} from '../utils/dateAndWhatsApp';
import { WhatsAppPreviewBubble } from './WhatsAppPreviewBubble';

interface WhatsAppWeeklyComposerProps {
  events: CerimonialEvent[];
  weekBuckets: WeekBucket[];
  selectedWeekId: string;
  onSelectWeekId: (weekId: string) => void;
  onSelectEvent: (event: CerimonialEvent) => void;
}

export const WhatsAppWeeklyComposer: React.FC<WhatsAppWeeklyComposerProps> = ({
  events,
  weekBuckets,
  selectedWeekId,
  onSelectWeekId,
  onSelectEvent,
}) => {
  const [options, setOptions] = useState<WhatsAppComposerOptions>({
    style: 'detalhado',
    includeRequerente: true,
    includeEquipe: true,
    includeRealizados: true,
    includePendencias: false,
    headerText: 'Bom dia! Segue a programação de eventos da semana:',
    footerText: 'Qualquer atualização na planilha, avisar o Cerimonial.',
  });

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [phoneInput, setPhoneInput] = useState('');
  const [previewMode, setPreviewMode] = useState<'bubble' | 'raw'>('bubble');
  const [manualOverride, setManualOverride] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeWeek = useMemo(() => {
    return (
      weekBuckets.find((w) => w.id === selectedWeekId) || weekBuckets[0] || null
    );
  }, [weekBuckets, selectedWeekId]);

  const weekEvents = useMemo(() => {
    if (!activeWeek) return [];
    const list = events.filter(
      (ev) =>
        ev.isoDate &&
        ev.isoDate >= activeWeek.startIso &&
        ev.isoDate <= activeWeek.endIso
    );
    return sortEventsChronologically(list);
  }, [events, activeWeek]);

  // Reset manual edits & exclusions when switching weeks
  useEffect(() => {
    setExcludedIds(new Set());
    setManualOverride(null);
  }, [selectedWeekId]);

  const includedEvents = useMemo(() => {
    return weekEvents.filter((ev) => !excludedIds.has(ev.id));
  }, [weekEvents, excludedIds]);

  const generatedMessage = useMemo(() => {
    const label = activeWeek ? activeWeek.shortRange : 'Período selecionado';
    return formatWhatsAppWeeklyMessage(includedEvents, label, options);
  }, [includedEvents, activeWeek, options]);

  const activeMessage =
    manualOverride !== null ? manualOverride : generatedMessage;

  const toggleEventIncluded = (id: string) => {
    setManualOverride(null);
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllWeekEvents = () => {
    setManualOverride(null);
    setExcludedIds(new Set());
  };

  const clearAllWeekEvents = () => {
    setManualOverride(null);
    setExcludedIds(new Set(weekEvents.map((e) => e.id)));
  };

  const updateOption = <K extends keyof WhatsAppComposerOptions>(
    key: K,
    value: WhatsAppComposerOptions[K]
  ) => {
    setManualOverride(null);
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const waAppHref = buildWhatsAppHref(activeMessage, phoneInput, 'api');
  const waWebHref = buildWhatsAppHref(activeMessage, phoneInput, 'web');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left Column: Controls & Event Selection */}
      <div className="lg:col-span-6 space-y-5">
        {/* 1. Week Picker */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              1. Escolha a semana de envio
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {weekBuckets.length} semanas mapeadas
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {weekBuckets.map((wb) => {
              const isSelected = activeWeek?.id === wb.id;
              return (
                <button
                  key={wb.id}
                  type="button"
                  onClick={() => onSelectWeekId(wb.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {wb.relativeTag === 'current'
                        ? 'Esta semana'
                        : wb.relativeTag === 'next'
                        ? 'Próxima semana'
                        : wb.relativeTag === 'past'
                        ? 'Semana anterior'
                        : 'Semana futura'}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500 tabular-nums">
                      {wb.shortRange}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                    {wb.eventCount}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Event Selection Checklist */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              2. Eventos incluídos ({includedEvents.length}/{weekEvents.length})
            </h2>
            {weekEvents.length > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={selectAllWeekEvents}
                  className="font-medium text-emerald-700 hover:underline"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={clearAllWeekEvents}
                  className="font-medium text-slate-500 hover:text-slate-800 hover:underline"
                >
                  Desmarcar todos
                </button>
              </div>
            )}
          </div>

          {weekEvents.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              Não há eventos registrados na planilha para esta semana.
            </p>
          ) : (
            <div className="max-h-[300px] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {weekEvents.map((ev) => {
                const isIncluded = !excludedIds.has(ev.id);
                const dayShort = ev.isoDate
                  ? `${getWeekdayNamePt(ev.isoDate).slice(
                      0,
                      3
                    )} ${formatIsoToBrShort(ev.isoDate)}`
                  : ev.dataRaw;
                return (
                  <div
                    key={ev.id}
                    className={`flex items-start gap-3 px-3.5 py-2.5 transition-colors ${
                      isIncluded ? 'bg-white' : 'bg-slate-50 opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleEventIncluded(ev.id)}
                      className="mt-0.5 text-emerald-700 hover:text-emerald-900 shrink-0"
                      aria-label={
                        isIncluded ? 'Remover do envio' : 'Incluir no envio'
                      }
                    >
                      {isIncluded ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-medium text-slate-900 hover:underline">
                        {ev.nomeEvento}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                        {dayShort} · {ev.horario || 'Horário a definir'} ·{' '}
                        {ev.espaco || 'Local a definir'}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Formatting & Personalization */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            3. Formato da mensagem
          </h2>

          <div
            className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Estilo da mensagem"
          >
            {(
              [
                { id: 'detalhado', label: 'Detalhado' },
                { id: 'compacto', label: 'Compacto' },
                { id: 'por-supervisao', label: 'Por Supervisão' },
              ] as { id: WhatsAppFormatStyle; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => updateOption('style', item.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  options.style === item.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeRequerente}
                onChange={(e) =>
                  updateOption('includeRequerente', e.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              Incluir requerente
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeEquipe}
                onChange={(e) =>
                  updateOption('includeEquipe', e.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              Incluir supervisão e apoio
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeRealizados}
                onChange={(e) =>
                  updateOption('includeRealizados', e.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              Incluir eventos realizados
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includePendencias}
                onChange={(e) =>
                  updateOption('includePendencias', e.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              Sinalizar pendências na lista
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                htmlFor="wa-header-input"
                className="text-xs font-medium text-slate-700"
              >
                Saudação inicial
              </label>
              <input
                id="wa-header-input"
                type="text"
                value={options.headerText}
                onChange={(e) => updateOption('headerText', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="wa-footer-input"
                className="text-xs font-medium text-slate-700"
              >
                Observação final
              </label>
              <input
                id="wa-footer-input"
                type="text"
                value={options.footerText}
                onChange={(e) => updateOption('footerText', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="wa-phone-input"
              className="text-xs font-medium text-slate-700"
            >
              Número de destino (opcional — deixe em branco para escolher o
              grupo no WhatsApp)
            </label>
            <input
              id="wa-phone-input"
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Ex: 5561999999999 (DDI + DDD + Número)"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none"
            />
          </div>
        </section>
      </div>

      {/* Right Column: Live Preview & Dispatch Actions */}
      <div className="lg:col-span-6 lg:sticky lg:top-6 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-700" />
              <h2 className="text-sm font-semibold text-slate-900">
                Prévia do Envio Semanal
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {manualOverride !== null && (
                <button
                  type="button"
                  onClick={() => setManualOverride(null)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  <RotateCcw className="h-3 w-3" />
                  Gerar novamente
                </button>
              )}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode('bubble')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    previewMode === 'bubble'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Visualização
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('raw')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    previewMode === 'raw'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Editar Texto
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {previewMode === 'bubble' ? (
              <WhatsAppPreviewBubble message={activeMessage} />
            ) : (
              <textarea
                aria-label="Texto editável da mensagem de WhatsApp"
                value={activeMessage}
                onChange={(e) => setManualOverride(e.target.value)}
                rows={16}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3.5 font-mono text-xs leading-relaxed text-slate-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
              />
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
              <span>
                {activeMessage.length} caracteres · {includedEvents.length}{' '}
                {includedEvents.length === 1 ? 'evento' : 'eventos'}
              </span>
              {manualOverride !== null && (
                <span className="font-medium text-amber-700">
                  Texto editado manualmente
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-700" />
                    Mensagem copiada
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar mensagem
                  </>
                )}
              </button>

              <a
                href={waAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-900 whitespace-nowrap"
              >
                <ExternalLink className="h-4 w-4" />
                Enviar no WhatsApp
              </a>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Usando no computador pelo navegador?</span>
              <a
                href={waWebHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-emerald-800 hover:underline whitespace-nowrap"
              >
                Abrir WhatsApp Web
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
