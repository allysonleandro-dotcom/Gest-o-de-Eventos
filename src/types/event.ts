export interface CerimonialEvent {
  id: string;
  rowNumber: number;
  dataRaw: string;
  isoDate: string | null;
  nomeEvento: string;
  requerente: string;
  espaco: string;
  horario: string;
  startMinutes: number;
  supervisao: string;
  apoio: string;
  realizado: boolean;
}

export type DataSourceMode = 'snapshot' | 'google-sheets' | 'csv-upload';

export type WhatsAppFormatStyle = 'detalhado' | 'compacto' | 'por-supervisao';

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  rowCount?: number;
}

export interface WeekBucket {
  id: string; // Monday ISO date YYYY-MM-DD
  startIso: string;
  endIso: string;
  label: string;
  shortRange: string;
  relativeTag: 'current' | 'next' | 'past' | 'future';
  eventCount: number;
}

export interface WhatsAppComposerOptions {
  style: WhatsAppFormatStyle;
  includeRequerente: boolean;
  includeEquipe: boolean;
  includeRealizados: boolean;
  includePendencias: boolean;
  headerText: string;
  footerText: string;
}
