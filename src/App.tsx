import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { RefreshCw, FileSpreadsheet } from 'lucide-react';
import {
  CerimonialEvent,
  DataSourceMode,
  SheetTabInfo,
} from './types/event';
import {
  getInitialSnapshotEvents,
  parseCsvText,
  parseSpreadsheetRows,
} from './data/spreadsheetParser';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './services/googleAuth';
import {
  DEFAULT_SPREADSHEET_ID,
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  fetchSheetValues,
} from './services/sheetsApi';
import {
  buildWeekBuckets,
  formatIsoToBrFull,
  getLocalTodayIso,
  getMondayOfIsoWeek,
} from './utils/dateAndWhatsApp';
import { SpreadsheetTableView } from './components/SpreadsheetTableView';
import { WeeklyCalendarBoard } from './components/WeeklyCalendarBoard';
import { WhatsAppWeeklyComposer } from './components/WhatsAppWeeklyComposer';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { EventDetailDrawer } from './components/EventDetailDrawer';

type ActiveView = 'agenda' | 'planilha' | 'whatsapp';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('agenda');
  const [events, setEvents] = useState<CerimonialEvent[]>(() =>
    getInitialSnapshotEvents()
  );
  const [sourceMode, setSourceMode] = useState<DataSourceMode>('snapshot');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState(
    'GESTÃO DE EVENTOS E APOIO'
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Auth & Google Sheets state
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [spreadsheetInput, setSpreadsheetInput] = useState(
    DEFAULT_SPREADSHEET_ID
  );
  const [availableTabs, setAvailableTabs] = useState<SheetTabInfo[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals / Drawers
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CerimonialEvent | null>(
    null
  );

  const todayIso = useMemo(() => getLocalTodayIso(), []);
  const weekBuckets = useMemo(
    () => buildWeekBuckets(events, todayIso),
    [events, todayIso]
  );

  const defaultWeekId = useMemo(() => {
    const currentMon = getMondayOfIsoWeek(todayIso);
    const hasCurrent = weekBuckets.find(
      (w) => w.id === currentMon && w.eventCount > 0
    );
    if (hasCurrent) return hasCurrent.id;
    const firstWithEvents = weekBuckets.find((w) => w.eventCount > 0);
    return firstWithEvents?.id || currentMon;
  }, [weekBuckets, todayIso]);

  const [selectedWeekId, setSelectedWeekId] = useState<string>(defaultWeekId);

  useEffect(() => {
    if (!weekBuckets.some((w) => w.id === selectedWeekId)) {
      setSelectedWeekId(defaultWeekId);
    }
  }, [weekBuckets, selectedWeekId, defaultWeekId]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser) => {
        setUser(authUser);
        setHasToken(Boolean(getAccessToken()));
      },
      (authUser) => {
        setUser(authUser);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const syncFromGoogleSheets = useCallback(
    async (
      idOrUrl: string,
      tabOverride?: string,
      tokenOverride?: string
    ) => {
      const token = tokenOverride || getAccessToken();
      if (!token) {
        setHasToken(false);
        setSyncError('Conecte sua conta Google para ler a planilha.');
        return;
      }

      const spreadsheetId = extractSpreadsheetId(idOrUrl);
      if (!spreadsheetId) {
        setSyncError('Informe um ID ou link válido da planilha.');
        return;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        const metadata = await fetchSpreadsheetMetadata(spreadsheetId, token);
        setSpreadsheetTitle(metadata.title);
        setAvailableTabs(metadata.sheets);

        const targetTab =
          tabOverride &&
          metadata.sheets.some((s) => s.title === tabOverride)
            ? tabOverride
            : metadata.sheets[0]?.title || '';

        if (!targetTab) {
          throw new Error('Nenhuma aba encontrada nesta planilha.');
        }

        setSelectedTab(targetTab);
        const rows = await fetchSheetValues(spreadsheetId, targetTab, token);
        const parsed = parseSpreadsheetRows(rows);

        setEvents(parsed);
        setSourceMode('google-sheets');
        const nowTime = new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastSyncedAt(nowTime);
        setIsSyncModalOpen(false);
      } catch (err: any) {
        if (err?.status === 401) {
          setHasToken(false);
        }
        setSyncError(
          err?.message || 'Não foi possível carregar os dados da planilha.'
        );
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setSyncError(null);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setHasToken(true);
      await syncFromGoogleSheets(
        spreadsheetInput,
        selectedTab || undefined,
        result.accessToken
      );
    } catch (err: any) {
      setSyncError(
        err?.message || 'Falha ao autenticar com o Google. Tente novamente.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setHasToken(false);
    setSyncError(null);
  };

  const handleUploadCsv = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      const parsed = parseSpreadsheetRows(rows);
      setEvents(parsed);
      setSourceMode('csv-upload');
      setSpreadsheetTitle(file.name.replace(/\.csv$/i, ''));
      setSelectedTab('');
      setAvailableTabs([]);
      setSyncError(null);
      setLastSyncedAt(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      setIsSyncModalOpen(false);
    } catch {
      setSyncError('Erro ao ler o arquivo CSV selecionado.');
    }
  };

  const handleResetSnapshot = () => {
    setEvents(getInitialSnapshotEvents());
    setSourceMode('snapshot');
    setSpreadsheetTitle('GESTÃO DE EVENTOS E APOIO');
    setSelectedTab('');
    setAvailableTabs([]);
    setLastSyncedAt(null);
    setSyncError(null);
    setIsSyncModalOpen(false);
  };

  // Summary metrics
  const summaryStats = useMemo(() => {
    const currentWeek = weekBuckets.find((w) => w.relativeTag === 'current');
    const nextWeek = weekBuckets.find((w) => w.relativeTag === 'next');
    const todayEvents = events.filter((e) => e.isoDate === todayIso);
    const pendingDataEvents = events.filter(
      (e) => !e.realizado && (!e.horario || !e.espaco || !e.supervisao)
    );

    return {
      currentWeekCount: currentWeek?.eventCount ?? 0,
      currentWeekRange: currentWeek?.shortRange ?? '—',
      todayCount: todayEvents.length,
      todayLabel: formatIsoToBrFull(todayIso),
      nextWeekCount: nextWeek?.eventCount ?? 0,
      nextWeekRange: nextWeek?.shortRange ?? '—',
      incompleteCount: pendingDataEvents.length,
    };
  }, [events, weekBuckets, todayIso]);

  const handleHeaderPrimaryCta = () => {
    if (hasToken && sourceMode === 'google-sheets') {
      syncFromGoogleSheets(spreadsheetInput, selectedTab || undefined);
    } else {
      setIsSyncModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Brand | Nav Links | 1 Primary CTA */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('agenda');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Cerimonial Câmara
          </a>

          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium"
            aria-label="Navegação principal"
          >
            <button
              type="button"
              onClick={() => setActiveView('agenda')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'agenda'
                  ? 'border-emerald-800 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda Semanal
            </button>
            <button
              type="button"
              onClick={() => setActiveView('planilha')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'planilha'
                  ? 'border-emerald-800 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Planilha Completa
            </button>
            <button
              type="button"
              onClick={() => setActiveView('whatsapp')}
              className={`border-b-2 py-1 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'whatsapp'
                  ? 'border-emerald-800 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Envio WhatsApp
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleHeaderPrimaryCta}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-900 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {hasToken && sourceMode === 'google-sheets'
                ? isSyncing
                  ? 'Atualizando...'
                  : 'Atualizar Planilha'
                : 'Conectar Google Sheets'}
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2 md:hidden overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveView('agenda')}
            className={`text-xs font-medium whitespace-nowrap shrink-0 ${
              activeView === 'agenda'
                ? 'text-emerald-800 underline underline-offset-4'
                : 'text-slate-600'
            }`}
          >
            Agenda Semanal
          </button>
          <button
            type="button"
            onClick={() => setActiveView('planilha')}
            className={`text-xs font-medium whitespace-nowrap shrink-0 ${
              activeView === 'planilha'
                ? 'text-emerald-800 underline underline-offset-4'
                : 'text-slate-600'
            }`}
          >
            Planilha Completa
          </button>
          <button
            type="button"
            onClick={() => setActiveView('whatsapp')}
            className={`text-xs font-medium whitespace-nowrap shrink-0 ${
              activeView === 'whatsapp'
                ? 'text-emerald-800 underline underline-offset-4'
                : 'text-slate-600'
            }`}
          >
            Envio WhatsApp
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Source Context Bar (unboxed metadata with · separators) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {spreadsheetTitle}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
              <span>
                {sourceMode === 'google-sheets'
                  ? `Google Sheets${selectedTab ? ` · Aba: ${selectedTab}` : ''}`
                  : sourceMode === 'csv-upload'
                  ? 'Importado via arquivo CSV'
                  : 'Planilha base carregada'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{events.length} eventos</span>
              {lastSyncedAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    Atualizado às {lastSyncedAt}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
            Configurar planilha ou CSV
          </button>
        </div>

        {/* 4-Column KPI Summary Strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Esta semana</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {summaryStats.currentWeekCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {summaryStats.currentWeekRange}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">Eventos hoje</p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-emerald-800 tabular-nums">
              {summaryStats.todayCount}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
              {summaryStats.todayLabel}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Próxima semana
            </p>
            <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {summaryStats.nextWeekCount}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {summaryStats.nextWeekRange}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Pendências na planilha
            </p>
            <p
              className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${
                summaryStats.incompleteCount > 0
                  ? 'text-amber-700'
                  : 'text-slate-900'
              }`}
            >
              {summaryStats.incompleteCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Sem horário, local ou supervisão
            </p>
          </div>
        </div>

        {/* Active View */}
        {activeView === 'agenda' && (
          <WeeklyCalendarBoard
            events={events}
            weekBuckets={weekBuckets}
            selectedWeekId={selectedWeekId}
            onSelectWeekId={setSelectedWeekId}
            todayIso={todayIso}
            onSelectEvent={setSelectedEvent}
            onGoToWhatsApp={() => setActiveView('whatsapp')}
          />
        )}

        {activeView === 'planilha' && (
          <SpreadsheetTableView
            events={events}
            weekBuckets={weekBuckets}
            todayIso={todayIso}
            isLoading={isSyncing}
            onSelectEvent={setSelectedEvent}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        )}

        {activeView === 'whatsapp' && (
          <WhatsAppWeeklyComposer
            events={events}
            weekBuckets={weekBuckets}
            selectedWeekId={selectedWeekId}
            onSelectWeekId={setSelectedWeekId}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </main>

      <GoogleSheetsSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        user={user}
        hasToken={hasToken}
        isAuthenticating={isAuthenticating}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        spreadsheetInput={spreadsheetInput}
        onSpreadsheetInputChange={setSpreadsheetInput}
        availableTabs={availableTabs}
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        onFetchTabsAndSync={(idOrUrl, tabOverride) =>
          syncFromGoogleSheets(idOrUrl, tabOverride)
        }
        isSyncing={isSyncing}
        syncError={syncError}
        sourceMode={sourceMode}
        spreadsheetTitle={spreadsheetTitle}
        onUploadCsvFile={handleUploadCsv}
        onResetToSnapshot={handleResetSnapshot}
      />

      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
