import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  LogOut,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { DataSourceMode, SheetTabInfo } from '../types/event';
import {
  DEFAULT_SPREADSHEET_ID,
  extractSpreadsheetId,
} from '../services/sheetsApi';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  hasToken: boolean;
  isAuthenticating: boolean;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  spreadsheetInput: string;
  onSpreadsheetInputChange: (val: string) => void;
  availableTabs: SheetTabInfo[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
  onFetchTabsAndSync: (idOrUrl: string, tabOverride?: string) => Promise<void>;
  isSyncing: boolean;
  syncError: string | null;
  sourceMode: DataSourceMode;
  spreadsheetTitle: string;
  onUploadCsvFile: (file: File) => void;
  onResetToSnapshot: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  hasToken,
  isAuthenticating,
  onGoogleLogin,
  onGoogleLogout,
  spreadsheetInput,
  onSpreadsheetInputChange,
  availableTabs,
  selectedTab,
  onSelectTab,
  onFetchTabsAndSync,
  isSyncing,
  syncError,
  sourceMode,
  spreadsheetTitle,
  onUploadCsvFile,
  onResetToSnapshot,
}) => {
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedId = extractSpreadsheetId(spreadsheetInput);

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!parsedId) {
      setLocalError('Informe o link ou ID da planilha do Google Sheets.');
      return;
    }
    await onFetchTabsAndSync(parsedId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUploadCsvFile(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheets-sync-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            <h2
              id="sheets-sync-title"
              className="text-base font-semibold text-slate-900"
            >
              Fonte de Dados — Google Sheets
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Google Account Connection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">
                1. Conexão com Google Sheets
              </span>
              {hasToken && user ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Conectado
                </span>
              ) : (
                <span className="text-xs text-slate-500">Não conectado</span>
              )}
            </div>

            {hasToken && user ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user.displayName || 'Conta Google'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onGoogleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Desconectar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-600">
                  Entre com sua conta Google para ler os dados atualizados
                  diretamente da sua planilha do Cerimonial.
                </p>
                <div className="shrink-0">
                  <GoogleSignInButton
                    onClick={onGoogleLogin}
                    disabled={isAuthenticating}
                    label={
                      isAuthenticating
                        ? 'Conectando...'
                        : 'Entrar com Google'
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Spreadsheet URL / ID & Tab selection */}
          <form onSubmit={handleSyncSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="spreadsheet-url-input"
                  className="text-sm font-medium text-slate-900"
                >
                  2. Link ou ID da Planilha
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onSpreadsheetInputChange(DEFAULT_SPREADSHEET_ID)
                  }
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Usar ID padrão da planilha
                </button>
              </div>
              <input
                id="spreadsheet-url-input"
                type="text"
                value={spreadsheetInput}
                onChange={(e) => onSpreadsheetInputChange(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              {parsedId && (
                <p className="font-mono text-[11px] text-slate-500 truncate">
                  ID detectado: {parsedId}
                </p>
              )}
            </div>

            {availableTabs.length > 0 && (
              <div className="space-y-1.5">
                <label
                  htmlFor="sheet-tab-select"
                  className="text-sm font-medium text-slate-900"
                >
                  Aba da Planilha ({spreadsheetTitle})
                </label>
                <div className="flex items-center gap-2">
                  <select
                    id="sheet-tab-select"
                    value={selectedTab}
                    onChange={(e) => {
                      const nextTab = e.target.value;
                      onSelectTab(nextTab);
                      if (hasToken && parsedId) {
                        onFetchTabsAndSync(parsedId, nextTab);
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    {availableTabs.map((tab) => (
                      <option key={tab.sheetId} value={tab.title}>
                        {tab.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(syncError || localError) && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{localError || syncError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!hasToken || isSyncing}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {isSyncing
                  ? 'Sincronizando...'
                  : 'Sincronizar com Google Sheets'}
              </button>
            </div>
          </form>

          {/* Local CSV import & Snapshot fallback */}
          <div className="border-t border-slate-200 pt-4">
            <p className="mb-3 text-xs font-medium text-slate-700">
              Ou importe um arquivo CSV exportado do Google Sheets
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0">
                <Upload className="h-3.5 w-3.5" />
                Carregar arquivo .CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {sourceMode !== 'snapshot' && (
                <button
                  type="button"
                  onClick={onResetToSnapshot}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar planilha inicial
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
