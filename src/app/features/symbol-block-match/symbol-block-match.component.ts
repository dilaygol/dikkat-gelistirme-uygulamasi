import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

export interface SymbolDef {
    char: string;
    color: string;
}

export interface SymbolBlock {
    id: number;
    patternId: number;
    cells: SymbolDef[];   // [TL, TR, BL, BR]
    isSelected: boolean;
    isMatched: boolean;
    isShaking: boolean;
}

interface SymbolBlockMatchState {
    matchedIds: number[];
    feedbackState: 'correct' | 'wrong' | null;
}

const ID = 'symbol-block-match';

// ── Sembol tanımları ─────────────────────────────────────
const SQ:   SymbolDef = { char: '■', color: '#4CAF50' };
const TRI:  SymbolDef = { char: '▲', color: '#00ACC1' };
const CIR:  SymbolDef = { char: '●', color: '#FF9800' };
const STAR: SymbolDef = { char: '★', color: '#FDD835' };
const HRT:  SymbolDef = { char: '♥', color: '#E91E63' };
const PLUS: SymbolDef = { char: '✚', color: '#455A64' };
const XMRK: SymbolDef = { char: '✕', color: '#455A64' };
const DOT:  SymbolDef = { char: '•', color: '#333333' };
const DIAM: SymbolDef = { char: '◆', color: '#7B1FA2' };
const DASH: SymbolDef = { char: '—', color: '#455A64' };

// 6 benzersiz desen [SolÜst, SağÜst, SolAlt, SağAlt]
// Kasıtlı olarak benzer tutuldu — dikkat gerektiriyor!
const PATTERNS: SymbolDef[][] = [
    [SQ,   PLUS, TRI,  DOT ],   // 0
    [SQ,   XMRK, DOT,  TRI ],   // 1
    [SQ,   DASH, STAR, TRI ],   // 2
    [SQ,   PLUS, DOT,  CIR ],   // 3
    [SQ,   XMRK, HRT,  TRI ],   // 4
    [DIAM, PLUS, STAR, CIR ],   // 5
];

@Component({
    selector: 'app-symbol-block-match',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './symbol-block-match.component.html',
    styleUrl: './symbol-block-match.component.scss'
})
export class SymbolBlockMatchComponent implements OnInit {

    blocks: SymbolBlock[] = [];
    selectedBlockId: number | null = null;
    feedbackState: 'correct' | 'wrong' | null = null;
    matchCount = 0;

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) {}

    get showHint(): boolean {
        return this.hintService.shouldShowHint(ID);
    }

    get isNextUnlocked(): boolean {
        return this.feedbackState === 'correct' || this.gs.isCompleted(ID);
    }

    get totalPairs(): number {
        return PATTERNS.length;
    }

    ngOnInit(): void {
        this.initBlocks();

        const saved = this.gs.getData<SymbolBlockMatchState>(ID);
        if (saved?.matchedIds) {
            saved.matchedIds.forEach(id => {
                const block = this.blocks.find(b => b.id === id);
                if (block) block.isMatched = true;
            });
            this.matchCount = Math.floor(saved.matchedIds.length / 2);
            this.feedbackState = saved.feedbackState ?? null;
        }
    }

    // ── Blokları oluştur ve karıştır ─────────────────────────
    private initBlocks(): void {
        const raw: SymbolBlock[] = [];
        PATTERNS.forEach((pattern, pid) => {
            for (let copy = 0; copy < 2; copy++) {
                raw.push({
                    id: pid * 2 + copy,
                    patternId: pid,
                    cells: [...pattern],
                    isSelected: false,
                    isMatched: false,
                    isShaking: false,
                });
            }
        });
        this.blocks = this.deterministicShuffle(raw);
    }

    /** Sabit sıra — sayfa yenilendiğinde aynı düzen */
    private deterministicShuffle(arr: SymbolBlock[]): SymbolBlock[] {
        const result = [...arr];
        let seed = 73;
        const rng = (): number => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    // ── Etkileşim ────────────────────────────────────────────
    onBlockClick(block: SymbolBlock): void {
        if (this.isNextUnlocked) return;
        if (block.isMatched || block.isShaking) return;

        if (this.selectedBlockId === null) {
            // İlk seçim
            block.isSelected = true;
            this.selectedBlockId = block.id;
        } else if (this.selectedBlockId === block.id) {
            // Aynı bloğa tekrar tıklandı → iptal
            block.isSelected = false;
            this.selectedBlockId = null;
        } else {
            // İkinci seçim — eşleşme kontrolü
            const first = this.blocks.find(b => b.id === this.selectedBlockId)!;

            if (first.patternId === block.patternId) {
                // ✓ Eşleşme bulundu
                first.isMatched = true;
                first.isSelected = false;
                block.isMatched = true;
                this.selectedBlockId = null;
                this.matchCount++;

                // Her doğru eşleşmede hata sayacını sıfırla —
                // böylece bir sonraki çift için tekrar 2 hata gerekir.
                this.hintService.resetErrors(ID);

                if (this.matchCount === this.totalPairs) {
                    this.feedbackState = 'correct';
                    this.gs.markCompleted(ID);
                    this.fb.showFeedback('success', 'Harika! Tüm eşleşmeleri buldun!');
                } else {
                    this.fb.showFeedback('success', 'Doğru eşleşme! 👏');
                }
            } else {
                // ✗ Yanlış eşleşme
                first.isShaking = true;
                block.isShaking = true;
                block.isSelected = true;
                this.hintService.registerError(ID);

                setTimeout(() => {
                    first.isShaking = false;
                    first.isSelected = false;
                    block.isShaking = false;
                    block.isSelected = false;
                    this.selectedBlockId = null;
                }, 650);

                this.fb.showFeedback('error', 'Bu bloklar aynı değil. Sembolleri dikkatlice karşılaştır!');
            }
            this.persist();
        }
    }

    checkAnswer(): void {
        if (this.matchCount === this.totalPairs) {
            this.feedbackState = 'correct';
            this.gs.markCompleted(ID);
            this.fb.showFeedback('success', 'Harika! Tüm eşleşmeleri buldun!');
        } else if (this.matchCount === 0) {
            this.fb.showFeedback('error', 'Eşleşen blokları bulmak için iki bloğa sırayla tıkla.');
        } else {
            const remaining = this.totalPairs - this.matchCount;
            this.fb.showFeedback('error', `${this.matchCount} eşleşme buldun, ${remaining} eşleşme daha kaldı!`);
        }
    }

    clearSelection(): void {
        this.blocks.forEach(b => {
            b.isSelected = false;
            b.isMatched = false;
            b.isShaking = false;
        });
        this.selectedBlockId = null;
        this.matchCount = 0;
        this.feedbackState = null;
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    /** Hint: eşleşmemiş ilk çiftin bloklarını vurgula */
    isHintBlock(block: SymbolBlock): boolean {
        if (!this.showHint || block.isMatched) return false;
        // İlk eşleşmemiş pattern'ı bul
        const unmatchedPattern = this.blocks.find(b => !b.isMatched);
        return unmatchedPattern ? block.patternId === unmatchedPattern.patternId : false;
    }

    private persist(): void {
        const matchedIds = this.blocks.filter(b => b.isMatched).map(b => b.id);
        this.gs.save(ID, { matchedIds, feedbackState: this.feedbackState });
    }

    goPrev(): void {
        this.router.navigate(['/object-addition']);
    }

    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/shade-sorting-2']);
    }
}
