import { SheetTabInfo } from '../types/event';

export const DEFAULT_SPREADSHEET_ID =
  '19IVYkDOmdytiAQb5v2-Gz9QTXsri8Aha8jcHU5ziqNk';

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export class SheetsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SheetsApiError';
    this.status = status;
  }
}

function translateSheetsError(status: number, rawMessage?: string): string {
  if (status === 401) {
    return 'Sua sessão do Google expirou. Clique em "Entrar com Google" para reconectar.';
  }
  if (status === 403) {
    return 'Sem permissão para ler esta planilha. Verifique se sua conta Google tem acesso a ela.';
  }
  if (status === 404) {
    return 'Planilha não encontrada. Confira o link ou ID informado.';
  }
  return rawMessage || `Erro ao acessar o Google Sheets (código ${status}).`;
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<{ title: string; sheets: SheetTabInfo[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=properties.title,sheets.properties(sheetId,title,gridProperties.rowCount)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    let apiMsg: string | undefined;
    try {
      const errJson = await res.json();
      apiMsg = errJson?.error?.message;
    } catch {
      // ignore json parse error
    }
    throw new SheetsApiError(translateSheetsError(res.status, apiMsg), res.status);
  }

  const data = await res.json();
  const title: string = data?.properties?.title || 'Planilha sem título';
  const sheets: SheetTabInfo[] = Array.isArray(data?.sheets)
    ? data.sheets.map((s: any) => ({
        sheetId: s.properties?.sheetId ?? 0,
        title: s.properties?.title ?? 'Página1',
        rowCount: s.properties?.gridProperties?.rowCount,
      }))
    : [];

  return { title, sheets };
}

export async function fetchSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<string[][]> {
  const safeRange = `'${sheetTitle.replace(/'/g, "''")}'!A1:Z1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(safeRange)}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    let apiMsg: string | undefined;
    try {
      const errJson = await res.json();
      apiMsg = errJson?.error?.message;
    } catch {
      // ignore json parse error
    }
    throw new SheetsApiError(translateSheetsError(res.status, apiMsg), res.status);
  }

  const data = await res.json();
  return Array.isArray(data?.values) ? data.values : [];
}
