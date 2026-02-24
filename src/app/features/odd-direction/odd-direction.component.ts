import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';

interface CatItem { id: number; isFlipped: boolean; }

const GAME: CatItem[] = [
    { id: 0, isFlipped: false },
    { id: 1, isFlipped: false },
    { id: 2, isFlipped: true }, // ← doğru cevap
    { id: 3, isFlipped: false },
    { id: 4, isFlipped: false },
];

interface OddDirState {
    selectedId: number;
    feedbackState: 'correct' | 'wrong' | null;
    errorCount: number;
}

const ID = 'odd-direction';

@Component({
    selector: 'app-odd-direction',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent],
    templateUrl: './odd-direction.component.html',
    styleUrl: './odd-direction.component.scss',
})
export class OddDirectionComponent implements OnInit {
    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService
    ) { }

    readonly cats = GAME;
    selectedId: number = -1;
    feedbackState: 'correct' | 'wrong' | null = null;
    errorCount = 0;
    showHint = false;

    get isNextUnlocked(): boolean { return this.feedbackState === 'correct' || this.gs.isCompleted(ID); }
    get isLocked(): boolean { return this.feedbackState === 'correct'; }

    // ── Lifecycle ─────────────────────────────────────────
    ngOnInit(): void {
        const saved = this.gs.getData<OddDirState>(ID);
        if (saved) {
            this.selectedId = saved.selectedId;
            this.feedbackState = saved.feedbackState;
            this.errorCount = saved.errorCount || 0;
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            selectedId: this.selectedId,
            feedbackState: this.feedbackState,
            errorCount: this.errorCount
        });
    }

    // ── Etkileşim ─────────────────────────────────────────
    /** Bir kedi seçer; oyun kilitliyse işlem yapmaz */
    selectCat(id: number): void {
        if (this.isLocked) return;
        this.selectedId = id;
        this.feedbackState = null;
        this.showHint = false;
        this.persist();
    }

    /** Seçilen kediyi doğrular; 2 hatadan sonra ipucu gösterir */
    checkAnswer(): void {
        if (this.selectedId === -1) {
            this.feedbackState = 'wrong';
            this.fb.showFeedback('error', 'Önce bir kedi seç!');
            this.persist();
            return;
        }
        const correct = GAME.find(c => c.isFlipped);
        this.feedbackState = correct?.id === this.selectedId ? 'correct' : 'wrong';
        if (this.feedbackState === 'correct') {
            this.gs.markCompleted(ID);
            this.fb.showFeedback('success', 'Tebrikler! Doğru kediyi buldun!');
        } else {
            this.errorCount++;
            if (this.errorCount >= 2) {
                this.showHint = true;
            }
            this.fb.showFeedback('error', 'Tekrar Denemelisin');
        }
        this.persist();
    }

    /** Tüm ilerlemeyi sıfırlar ve oyunu baştan başlatır */
    restartActivity(): void {
        this.selectedId = -1;
        this.feedbackState = null;
        this.errorCount = 0;
        this.showHint = false;
        this.gs.clear(ID);
    }

    // ── Navigasyon ────────────────────────────────────────
    goPrev(): void { this.router.navigate(['/pattern']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/shade-sorting']);
    }
}
