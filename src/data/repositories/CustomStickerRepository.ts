import { CustomSticker } from '@/types';
import { now, uid } from '@/utils/id';
import { getDb } from '../db';

export const CustomStickerRepository = {
  async list(): Promise<CustomSticker[]> {
    const db = await getDb();
    return db.getAllAsync<CustomSticker>(
      `SELECT * FROM custom_stickers ORDER BY createdAt DESC`,
    );
  },

  async add(uri: string): Promise<CustomSticker> {
    const db = await getDb();
    const sticker: CustomSticker = { id: uid(), uri, createdAt: now() };
    await db.runAsync(
      `INSERT INTO custom_stickers (id, uri, createdAt) VALUES (?, ?, ?)`,
      [sticker.id, sticker.uri, sticker.createdAt],
    );
    return sticker;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(`DELETE FROM custom_stickers WHERE id = ?`, [id]);
  },
};
