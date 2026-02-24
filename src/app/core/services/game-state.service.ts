import { Injectable } from '@angular/core';

/**
 * GameStateService – Her etkinliğin tam durumunu hafızada tutar.
 * Sayfa geçişleri arasında seçimler, doldurulmuş alanlar ve
 * tamamlanma durumu korunur.
 *
 * Etkinlik ID'leri:
 *   'pattern'         → Deseni Kopyala
 *   'odd-direction'   → Ters Yöne Bakanı Bul
 *   'shade-sorting'   → Açıktan Koyuya Sıralama
 *   'number-sequence' → Sayının Öncesi ve Sonrası
 *   'symbol-matching' → Benzer Sembolü Bul
 */
@Injectable({ providedIn: 'root' })
export class GameStateService {
    private store = new Map<string, { isCompleted: boolean; data: unknown }>();

    // ── Okuma ─────────────────────────────────────────────

    /** Etkinlik tamamlandı mı? */
    isCompleted(id: string): boolean {
        return this.store.get(id)?.isCompleted ?? false;
    }

    /** Kaydedilmiş veriyi döndürür; yoksa null */
    getData<T>(id: string): T | null {
        const entry = this.store.get(id);
        return entry ? (entry.data as T) : null;
    }

    // ── Yazma ─────────────────────────────────────────────

    /** Anlık durum (data) + tamamlanma bayrağını kaydeder */
    save(id: string, data: unknown, isCompleted = false): void {
        const prev = this.store.get(id);
        this.store.set(id, {
            isCompleted: isCompleted || (prev?.isCompleted ?? false),
            data,
        });
    }

    /** Etkinliği tamamlandı olarak işaretler (data aynı kalır) */
    markCompleted(id: string): void {
        const prev = this.store.get(id);
        this.store.set(id, { isCompleted: true, data: prev?.data ?? null });
    }

    /** Etkinliğin tüm durumunu siler → sıfırlama */
    clear(id: string): void {
        this.store.delete(id);
    }
}
