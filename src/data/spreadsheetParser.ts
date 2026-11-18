import { CerimonialEvent } from '../types/event';

const INITIAL_CSV_SNAPSHOT = `,,,,,,,
DATA,NOME DO EVENTO,REQUERENTE,ESPAÇO,HORÁRIO,SUPERVISÃO,APOIO,REALIZADOS
,,,,,,,
17/11/2026,A IMPORTÂNCIA DA TESTAGEM POINT-OF-CARE (POC) NO CUIDADO EM SAÚDE,Dep. Pinheirinho,AUDITÓRIO FREITAS NOBRE,13:00 às 17:00,Raphael Guerreiro,,FALSE
17/11/2026,SESSÃO SOLENE EM HOMENAGEM AOS 60 ANOS DA INSTITUIÇÃO DO FUNDO DE GARANTIA DO TEMPO DE SERVIÇO – FGTS  ,Dep. Daniel Almeida,PLENÁRIO ULISSES GUIMARÃES,11:00 às 12:00,Oriana Zamboni,Cláudia De Cássia,FALSE
17/11/2026,SEMINÁRIO TECNOLOGIAS ESTRATÉGICAS BRASIL–ISRAEL,Dep. Augusto Rodrigues Coutinho de Melo,AUDITÓRIO NEREU RAMOS,12:00 às 18:00,Zezé Garcia,,FALSE
18/11/2026,SESSÃO SOLENE EM HOMENAGEM AOS 81 ANOS DE RELAÇÕES DIPLOMÁTICAS ENTRE O BRASIL E O LÍBANO,Dep. Maurício Neves,PLENÁRIO ULISSES GUIMARÃES,10:30 às 12:00,Raphael Guerreiro,,FALSE
18/11/2026,SESSÃO SOLENE EM HOMENAGEM AOS 131 ANOS DO CLUBE DE REGATAS DO FLAMENGO ,Dep. Doutor Luizinho,PLENÁRIO ULISSES GUIMARÃES,12:00 às 13:00,Oriana Zamboni,Rosane Lopes,FALSE
18/11/2026,PRÊMIO DARCY RIBEIRO,Comissão da Educação,SALÃO NOBRE,14:00 às 18:30,Frederico Fonseca,Daniel Gonzaga,FALSE
18/11/2026,CAFÉ DA MANHÃ INSTITUCIONAL DA CASA DO MENOR SÃO MIGUEL ARCANJO,Dep. Celio Studart Barbosa ,,,,,FALSE
23/11/2026,SEMINÁRIO DE AMBIENTAÇÃO PARA NOVOS PARLAMENTARES - 58ª LEGISLATURA,Presidência ,AUDITÓRIO NEREU RAMOS,08:00 às 20:00,Frederico Fonseca,,FALSE
24/11/2026,SEMINÁRIO DE AMBIENTAÇÃO PARA NOVOS PARLAMENTARES - 58ª LEGISLATURA,Presidência,SALÃO NEGRO,08:00 às 20:00,Frederico Fonseca,,FALSE
24/11/2026,SESSÃO SOLENE EM HOMENAGEM AOS 2 ANOS DE INSTITUIÇÃO DA POLÍTICA NACIONAL DE CUIDADOS,Dep. Talíria Petrone,PLENÁRIO ULISSES GUIMARÃES,09:00 às 10:00,Oriana Zamboni,,
24/11/2026,SESSÃO SOLENE PARA OUTORGA DO PRÊMIO CÂMARA AMBIENTAL E DESENVOLVIMENTO SUSTENTÁVEL,Hugo Motta ,PLENÁRIO ULISSES GUIMARÃES,11:00 às 12:00,Oriana Zamboni,,FALSE
25/11/2026,SESSÃO SOLENE EM HOMENAGEM AOS 70 ANOS DE LEGADO EDUCACIONAL DO SENHOR AMADOR AGUIAR,Dep. Vinícius Carvalho,PLENÁRIO ULISSES GUIMARÃES,11:00 às 12:00,Oriana Zamboni,Rosane Lopes,FALSE
01/12/2026,SESSÃO SOLENE PARA OUTORGA DO DIPLOMA MULHER-CIDADÃ CARLOTA PEREIRA DE QUEIRÓS,.,PLENÁRIO ULISSES GUIMARÃES,09:00 às 11:00,Oriana Zamboni,,
01/12/2026,SESSÃO SOLENE EM HOMENAGEM AOS AGENTES COMUNITÁRIOS DE SAÚDE E AOS AGENTES DE COMBATE ÀS ENDEMIAS,Dep. Zé Neto,PLENÁRIO ULISSES GUIMARÃES,11:00 às 12:00,Oriana Zamboni,,
02/12/2026,SESSÃO SOLENE PARA OUTORGA DA MEDALHA DO MÉRITO LEGISLATIVO,.,PLENÁRIO ULISSES GUIMARÃES,10:00 às 12:00,Oriana Zamboni,,
09/12/2026,SESSÃO SOLENE EM HOMENAGEM AO DIA INTERNACIONAL CONTRA A CORRUPÇÃO,Dep. Messias Donato,PLENÁRIO ULISSES GUIMARÃES,09:00 às 11:00,Oriana Zamboni,,
09/12/2026,SESSÃO SOLENE EM HOMENAGEM DIA NACIONAL DO MINISTÉRIO PÚBLICO,Dep. Junior Lourenço,PLENÁRIO ULISSES GUIMARÃES,11:00 às 13:00,Oriana Zamboni,,
11/12/2026,SESSÃO SOLENE EM HOMENAGEM AOS 40 ANOS DA ASSOCIAÇÃO DOS PROFISSIONAIS DOS CORREIOS – ADCAP,Dep. André Figueiredo,PLENÁRIO ULISSES GUIMARÃES,09:00 às 11:00,Oriana Zamboni,,
15/12/2026,SESSÃO SOLENE PARA OUTORGA DA MEDALHA PREFEITOS PELA ALFABETIZAÇÃO DAS CRIANÇAS,.,PLENÁRIO ULISSES GUIMARÃES,10:00 às 12:00,Oriana Zamboni,,
16/11/2026,BIBLIOTECA CONVIDA - 8ª EDIÇÃO,CEDI,BIBLIOTECA ,,,,
17/11/2026,ABERTURA DA EXPOSIÇÃO 60 ANOS DA AGÊNCIA BRASILEIRA DE PROMOÇÃO INTERNACIONAL DO TURISMO,Dep. Rozimeire Ribeiro Andrade,ESPAÇO MÁRIO COVAS,15:00 às 17:00,,,
17/11/2026,35 ANOS DA LEI DE TICS - TECNOLOGIAS DA INFORMAÇÃO E COMUNICAÇÃO,Dep. Vitor Lippi ,HALL DA TAQUIGRAFIA,09:00 às 11:00,,,`;

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function parseBrazilianDateToIso(raw: string): string | null {
  const clean = raw.trim();
  if (!clean) return null;

  // Match DD/MM/YYYY or D/M/YYYY
  const brMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    let year = Number(brMatch[3]);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (
      d.getUTCFullYear() !== year ||
      d.getUTCMonth() !== month - 1 ||
      d.getUTCDate() !== day
    ) {
      return null;
    }
    return `${String(year).padStart(4, '0')}-${String(month).padStart(
      2,
      '0'
    )}-${String(day).padStart(2, '0')}`;
  }

  // Match ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return clean;
  }

  return null;
}

export function parseStartMinutes(horario: string): number {
  const clean = horario.trim();
  if (!clean) return 9999;
  const match = clean.match(/(\d{1,2})[:h](\d{2})/);
  if (!match) return 9999;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return 9999;
  return hours * 60 + mins;
}

function parseBooleanCell(val: string | undefined): boolean {
  if (!val) return false;
  const norm = val.trim().toUpperCase();
  return (
    norm === 'TRUE' ||
    norm === 'VERDADEIRO' ||
    norm === 'SIM' ||
    norm === 'OK' ||
    norm === '1' ||
    norm === 'X'
  );
}

export function parseSpreadsheetRows(rows: string[][]): CerimonialEvent[] {
  if (!rows || rows.length === 0) return [];

  // Locate header row within first 15 rows
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const normalizedCells = rows[i].map((c) => normalizeHeader(c || ''));
    const hasData = normalizedCells.some((c) => c === 'DATA');
    const hasEvento = normalizedCells.some(
      (c) => c.includes('NOME DO EVENTO') || c === 'EVENTO'
    );
    if (hasData && hasEvento) {
      headerIdx = i;
      break;
    }
  }

  // Default column indices matching the Cerimonial spreadsheet structure
  let colMap = {
    data: 0,
    nomeEvento: 1,
    requerente: 2,
    espaco: 3,
    horario: 4,
    supervisao: 5,
    apoio: 6,
    realizado: 7,
  };

  let startRow = 0;
  if (headerIdx !== -1) {
    startRow = headerIdx + 1;
    const headers = rows[headerIdx].map((c) => normalizeHeader(c || ''));
    const findCol = (pred: (h: string) => boolean, fallback: number) => {
      const idx = headers.findIndex(pred);
      return idx !== -1 ? idx : fallback;
    };
    colMap = {
      data: findCol((h) => h === 'DATA', 0),
      nomeEvento: findCol(
        (h) => h.includes('NOME DO EVENTO') || h === 'EVENTO',
        1
      ),
      requerente: findCol((h) => h.includes('REQUERENTE'), 2),
      espaco: findCol((h) => h.includes('ESPACO') || h.includes('LOCAL'), 3),
      horario: findCol((h) => h.includes('HORARIO') || h.includes('HORA'), 4),
      supervisao: findCol((h) => h.includes('SUPERVISAO'), 5),
      apoio: findCol((h) => h.includes('APOIO'), 6),
      realizado: findCol((h) => h.includes('REALIZADO'), 7),
    };
  }

  const events: CerimonialEvent[] = [];

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const dataRaw = (row[colMap.data] || '').trim();
    const nomeEvento = (row[colMap.nomeEvento] || '').trim();

    // Skip empty template rows (like rows 26+ in screenshot)
    if (!dataRaw && !nomeEvento) continue;
    if (!nomeEvento) continue;

    const reqRaw = (row[colMap.requerente] || '').trim();
    const requerente = reqRaw === '.' ? '' : reqRaw;
    const espaco = (row[colMap.espaco] || '').trim();
    const horario = (row[colMap.horario] || '').trim();
    const supervisao = (row[colMap.supervisao] || '').trim();
    const apoio = (row[colMap.apoio] || '').trim();
    const realizado = parseBooleanCell(row[colMap.realizado]);
    const isoDate = parseBrazilianDateToIso(dataRaw);

    events.push({
      id: `row-${r + 1}-${isoDate || 'nodate'}-${nomeEvento.slice(0, 18)}`,
      rowNumber: r + 1,
      dataRaw,
      isoDate,
      nomeEvento,
      requerente,
      espaco,
      horario,
      startMinutes: parseStartMinutes(horario),
      supervisao,
      apoio,
      realizado,
    });
  }

  return events;
}

export function getInitialSnapshotEvents(): CerimonialEvent[] {
  const rows = parseCsvText(INITIAL_CSV_SNAPSHOT);
  return parseSpreadsheetRows(rows);
}
