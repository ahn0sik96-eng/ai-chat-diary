import {
  Diary,
  DiaryBackground,
  DiaryLayout,
  DiarySentence,
  DiaryStyle,
  PersonaId,
  CanvasElement,
} from '@/types';
import { now, uid } from '@/utils/id';
import { getDb } from '../db';

interface DiaryRow {
  id: string;
  sessionId: string;
  personaId: string;
  style: string;
  title: string;
  sentences: string;
  rawSummary: string;
  mood: string | null;
  coverImageUri: string | null;
  visibility: string;
  createdAt: number;
  updatedAt: number;
}

interface LayoutRow {
  id: string;
  diaryId: string;
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  elements: string;
  updatedAt: number;
}

function toDiary(r: DiaryRow): Diary {
  return {
    id: r.id,
    sessionId: r.sessionId,
    personaId: r.personaId as PersonaId,
    style: r.style as DiaryStyle,
    title: r.title,
    sentences: JSON.parse(r.sentences) as DiarySentence[],
    rawSummary: r.rawSummary,
    mood: r.mood ?? undefined,
    coverImageUri: r.coverImageUri ?? undefined,
    visibility: r.visibility as Diary['visibility'],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export interface CreateDiaryInput {
  sessionId: string;
  personaId: PersonaId;
  style: DiaryStyle;
  title: string;
  sentences: DiarySentence[];
  rawSummary: string;
  mood?: string;
}

export const DiaryRepository = {
  async create(input: CreateDiaryInput): Promise<Diary> {
    const db = await getDb();
    const ts = now();
    const diary: Diary = {
      id: uid(),
      ...input,
      visibility: 'private',
      createdAt: ts,
      updatedAt: ts,
    };
    await db.runAsync(
      `INSERT INTO diaries
         (id, sessionId, personaId, style, title, sentences, rawSummary, mood, coverImageUri, visibility, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        diary.id,
        diary.sessionId,
        diary.personaId,
        diary.style,
        diary.title,
        JSON.stringify(diary.sentences),
        diary.rawSummary,
        diary.mood ?? null,
        null,
        diary.visibility,
        diary.createdAt,
        diary.updatedAt,
      ],
    );
    return diary;
  },

  async list(): Promise<Diary[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<DiaryRow>(`SELECT * FROM diaries ORDER BY createdAt DESC`);
    return rows.map(toDiary);
  },

  async get(id: string): Promise<Diary | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<DiaryRow>(`SELECT * FROM diaries WHERE id = ?`, [id]);
    return row ? toDiary(row) : null;
  },

  async updateSentences(id: string, sentences: DiarySentence[]): Promise<void> {
    const db = await getDb();
    await db.runAsync(`UPDATE diaries SET sentences = ?, updatedAt = ? WHERE id = ?`, [
      JSON.stringify(sentences),
      now(),
      id,
    ]);
  },

  async setCoverImage(id: string, uri: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`UPDATE diaries SET coverImageUri = ?, updatedAt = ? WHERE id = ?`, [
      uri,
      now(),
      id,
    ]);
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM diary_layouts WHERE diaryId = ?`, [id]);
    await db.runAsync(`DELETE FROM diaries WHERE id = ?`, [id]);
  },

  /* ----------------------------- Layout (decoration) ----------------------------- */

  async getLayout(diaryId: string): Promise<DiaryLayout | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<LayoutRow>(
      `SELECT * FROM diary_layouts WHERE diaryId = ?`,
      [diaryId],
    );
    if (!row) return null;
    return {
      id: row.id,
      diaryId: row.diaryId,
      canvasWidth: row.canvasWidth,
      canvasHeight: row.canvasHeight,
      background: JSON.parse(row.background) as DiaryBackground,
      elements: JSON.parse(row.elements) as CanvasElement[],
      updatedAt: row.updatedAt,
    };
  },

  async saveLayout(input: {
    diaryId: string;
    canvasWidth: number;
    canvasHeight: number;
    background: DiaryBackground;
    elements: CanvasElement[];
  }): Promise<DiaryLayout> {
    const db = await getDb();
    const existing = await this.getLayout(input.diaryId);
    const layout: DiaryLayout = {
      id: existing?.id ?? uid(),
      diaryId: input.diaryId,
      canvasWidth: input.canvasWidth,
      canvasHeight: input.canvasHeight,
      background: input.background,
      elements: input.elements,
      updatedAt: now(),
    };
    await db.runAsync(
      `INSERT INTO diary_layouts (id, diaryId, canvasWidth, canvasHeight, background, elements, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(diaryId) DO UPDATE SET
         canvasWidth = excluded.canvasWidth,
         canvasHeight = excluded.canvasHeight,
         background = excluded.background,
         elements = excluded.elements,
         updatedAt = excluded.updatedAt`,
      [
        layout.id,
        layout.diaryId,
        layout.canvasWidth,
        layout.canvasHeight,
        JSON.stringify(layout.background),
        JSON.stringify(layout.elements),
        layout.updatedAt,
      ],
    );
    return layout;
  },
};
