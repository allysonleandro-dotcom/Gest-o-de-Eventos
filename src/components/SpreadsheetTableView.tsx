import React, { useMemo, useState } from 'react';
import {
  Search,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  FilterX,
  FileSpreadsheet,
} from 'lucide-react';
import { CerimonialEvent, WeekBucket } from '../types/event';
import {
  getWeekdayNamePt,
  sortEventsChronologically,
} from '../utils/dateAndWhatsApp';

interface SpreadsheetTableViewProps {
  events: CerimonialEvent[];
  weekBuckets: WeekBucket[];
  todayIso: string;
  isLoading: boolean;
  onSelectEvent: (event: CerimonialEvent) => void;
  onOpenSyncModal: () => void;
}

export const SpreadsheetTableView: React.FC<SpreadsheetTableViewProps> = ({
  events,
  weekBuckets,
  todayIso,
  isLoading,
  onSelectEvent,
  onOpenSyncModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeekId, setSelectedWeekId] = useState<string>('all');
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'completed' | 'incomplete'
  >('all');
  const [sortOrder, setSortOrder] = useState<'chronological' | 'sheet'>(
    'chronological'
  );

  const uniqueSpaces = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      if (ev.espaco) set.add(ev.espaco);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [events]);

  const uniqueSupervisors = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      if (ev.supervisao) set.add(ev.supervisao);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeWeek = weekBuckets.find((w) => w.id === selectedWeekId);

    const list = events.filter((ev) => {
      if (activeWeek) {
        if (
          !ev.isoDate ||
          ev.isoDate < activeWeek.startIso ||
          ev.isoDate > activeWeek.endIso
        ) {
          return false;
        }
      }

      if (selectedSpace !== 'all' && ev.espaco !== selectedSpace) {
        return false;
      }

      if (selectedSupervisor !== 'all') {
        if (selectedSupervisor === '__none__') {
          if (ev.supervisao) return false;
        } else if (ev.supervisao !== selectedSupervisor) {
          return false;
        }
      }

      if (statusFilter === 'pending' && ev.realizado) return false;
      if (statusFilter === 'completed' && !ev.realizado) return false;
      if (
        statusFilter === 'incomplete' &&
        ev.horario &&
        ev.espaco &&
        ev.supervisao
      ) {
        return false;
      }

      if (q) {
        const haystack = [
          ev.dataRaw,
          ev.nomeEvento,
          ev.requerente,
          ev.espaco,
          ev.horario,
          ev.supervisao,
          ev.apoio,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    if (sortOrder === 'chronological') {
      return sortEventsChronologically(list);
    }
    return [...list].sort((a, b) => a.rowNumber - b.rowNumber);
  }, [
    events,
    weekBuckets,
    selectedWeekId,
    selectedSpace,
    selectedSupervisor,
    statusFilter,
    searchQuery,
    sortOrder,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedWeekId !== 'all' ||
    selectedSpace !== 'all' ||
    selectedSupervisor !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedWeekId('all');
    setSelectedSpace('all');
    setSelectedSupervisor('all');
    setStatusFilter('all');
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar evento, requerente, espaço ou equipe..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center rounded-lg bg-slate-100 p-1"
              role="group"
              aria-label="Ordenação da tabela"
            >
              <button
                type="button"
                onClick={() => setSortOrder('chronological')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  sortOrder === 'chronological'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Ordem Cronológica
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('sheet')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  sortOrder === 'sheet'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ordem da Planilha
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filtrar por semana"
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="all">Todas as semanas</option>
            {weekBuckets.map((wb) => (
              <option key={wb.id} value={wb.id}>
                {wb.label} ({wb.eventCount})
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por espaço"
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            className="max-w-[230px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="all">Todos os espaços</option>
            {uniqueSpaces.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por supervisão"
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
            className="max-w-[210px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="all">Toda a supervisão</option>
            <option value="__none__">Sem supervisão definida</option>
            {uniqueSupervisors.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por situação"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | 'pending' | 'completed' | 'incomplete'
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-700 focus:outline-none"
          >
            <option value="all">Todas as situações</option>
            <option value="pending">Não realizados</option>
            <option value="incomplete">Com pendência de dados</option>
            <option value="completed">Já realizados</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap shrink-0"
            >
              <FilterX className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}

          <span className="ml-auto text-xs text-slate-500 tabular-nums">
            Exibindo {filteredEvents.length} de {events.length} eventos
          </span>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <FileSpreadsheet className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Nenhum evento carregado
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Conecte sua planilha do Google Sheets ou carregue um arquivo CSV
            para visualizar os eventos do Cerimonial.
          </p>
          <button
            type="button"
            onClick={onOpenSyncModal}
            className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-900"
          >
            Conectar Google Sheets
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-900">
            Nenhum evento corresponde aos filtros aplicados
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Ajuste a busca ou limpe os filtros para visualizar todos os eventos.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-2.5 pl-4 pr-3 whitespace-nowrap">Data</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Horário</th>
                <th className="px-3 py-2.5 min-w-[260px]">Nome do Evento</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Requerente</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Espaço</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Supervisão</th>
                <th className="px-3 py-2.5 whitespace-nowrap">Apoio</th>
                <th className="py-2.5 pl-3 pr-4 whitespace-nowrap text-right">
                  Situação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const isToday = ev.isoDate === todayIso;
                const hasMissingData =
                  !ev.horario || !ev.espaco || !ev.supervisao;
                const shortWeekday = ev.isoDate
                  ? getWeekdayNamePt(ev.isoDate).slice(0, 3)
                  : '';

                return (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className={`cursor-pointer transition-colors ${
                      isToday
                        ? 'bg-emerald-50/60 hover:bg-emerald-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-3 align-top whitespace-nowrap">
                      <div className="font-mono text-xs font-medium text-slate-900 tabular-nums">
                        {ev.dataRaw || '—'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {isToday ? (
                          <span className="font-semibold text-emerald-800">
                            Hoje · {shortWeekday}
                          </span>
                        ) : (
                          shortWeekday
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 align-top whitespace-nowrap">
                      {ev.horario ? (
                        <span className="font-mono text-xs text-slate-800 tabular-nums">
                          {ev.horario}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          A definir
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top">
                      <p className="text-[13px] font-medium leading-snug text-slate-900">
                        {ev.nomeEvento}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400 tabular-nums">
                        Linha {ev.rowNumber}
                      </p>
                    </td>

                    <td className="px-3 py-2.5 align-top text-xs text-slate-600 max-w-[180px]">
                      <span className="line-clamp-2">
                        {ev.requerente || '—'}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 align-top text-xs font-medium text-slate-800 whitespace-nowrap">
                      {ev.espaco || (
                        <span className="font-normal text-amber-700">
                          Sem espaço
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top text-xs text-slate-800 whitespace-nowrap">
                      {ev.supervisao || (
                        <span className="text-amber-700">Sem supervisão</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 align-top text-xs text-slate-600 whitespace-nowrap">
                      {ev.apoio || '—'}
                    </td>

                    <td className="py-2.5 pl-3 pr-4 align-top text-right whitespace-nowrap">
                      {ev.realizado ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                          Realizado
                        </span>
                      ) : hasMissingData ? (
                        <span className="text-xs font-medium text-amber-700">
                          Dados incompletos
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-800">
                          Confirmado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
