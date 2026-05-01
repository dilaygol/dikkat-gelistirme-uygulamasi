import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface Scale {
    id: number;
    leftEmoji: string;
    rightEmoji: string;
    leftCount: number;
    rightCount: number;
    picked: 'left' | 'right' | null;
    isWrong: boolean;
    isDone: boolean;
}

interface BalanceState { scales: { picked: 'left'|'right'|null; isDone: boolean }[]; }

const ID = 'balance-scale';

@Component({
    selector: 'app-balance-scale',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './balance-scale.component.html',
    styleUrl: './balance-scale.component.scss'
})
export class BalanceScaleComponent implements OnInit {

    scales: Scale[] = [
        { id: 1, leftEmoji: '🍎', rightEmoji: '🍎', leftCount: 5, rightCount: 2, picked: null, isWrong: false, isDone: false },
        { id: 2, leftEmoji: '🍓', rightEmoji: '🍓', leftCount: 3, rightCount: 6, picked: null, isWrong: false, isDone: false },
        { id: 3, leftEmoji: '🍊', rightEmoji: '🍊', leftCount: 4, rightCount: 7, picked: null, isWrong: false, isDone: false },
    ];

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) { }

    get showHint(): boolean { return this.hintService.shouldShowHint(ID); }
    get isComplete(): boolean { return this.scales.every(s => s.isDone); }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    heavierSide(s: Scale): 'left' | 'right' {
        return s.leftCount > s.rightCount ? 'left' : 'right';
    }

    tiltAngle(s: Scale): number {
        if (!s.isDone) return 0;
        return this.heavierSide(s) === 'left' ? -12 : 12;
    }

    ngOnInit(): void {
        const saved = this.gs.getData<BalanceState>(ID);
        if (saved?.scales && saved.scales.length === this.scales.length) {
            this.scales.forEach((s, i) => {
                s.picked = saved.scales[i].picked;
                s.isDone = saved.scales[i].isDone;
            });
        } else {
            this.gs.clear(ID);
        }
    }

    pick(scale: Scale, side: 'left' | 'right'): void {
        if (this.isNextUnlocked || scale.isDone) return;

        if (side === this.heavierSide(scale)) {
            scale.picked = side;
            scale.isDone = true;
            scale.isWrong = false;
            this.hintService.resetErrors(ID);
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika! Tüm terazileri çözdün!');
            } else {
                this.fb.showFeedback('success', 'Aferin! Bu taraf daha ağır.');
            }
        } else {
            scale.picked = side;
            scale.isWrong = true;
            this.hintService.registerError(ID);
            this.fb.showFeedback('error', 'Hmm, diğer tarafta daha çok var. Tekrar bak!');
            setTimeout(() => { scale.isWrong = false; scale.picked = null; }, 600);
        }
    }

    shouldHint(scale: Scale, side: 'left' | 'right'): boolean {
        return this.showHint && !scale.isDone && side === this.heavierSide(scale);
    }

    persist(): void {
        this.gs.save(ID, {
            scales: this.scales.map(s => ({ picked: s.picked, isDone: s.isDone }))
        });
    }

    clearSelection(): void {
        this.scales.forEach(s => { s.picked = null; s.isDone = false; s.isWrong = false; });
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    items(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }

    goPrev(): void { this.router.navigate(['/shade-sorting-2']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/two-feature-filter']);
    }
}
