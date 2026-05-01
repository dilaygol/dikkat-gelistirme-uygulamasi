import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface CircleItem {
    id: number;
    order: number;
    shade: string;
    found: boolean;
    foundStep?: number;
    isShaking: boolean;
}

interface ShadeSortState {
    circles: CircleItem[];
    currentStep: number;
}

const ID = 'shade-sorting-2';

@Component({
    selector: 'app-shade-sorting-2',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './shade-sorting-2.component.html',
    styleUrl: './shade-sorting-2.component.scss',
})
export class ShadeSorting2Component implements OnInit {

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) { }

    circles: CircleItem[] = [];
    currentStep = 1;

    get showHint(): boolean {
        return this.hintService.shouldShowHint(ID);
    }

    get isComplete(): boolean { return this.currentStep > 12; }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    ngOnInit(): void {
        const saved = this.gs.getData<ShadeSortState>(ID);
        if (saved) {
            this.circles = saved.circles;
            this.currentStep = saved.currentStep;
        } else {
            this.initGame();
        }
    }

    initGame(): void {
        this.currentStep = 1;
        this.hintService.resetErrors(ID);
        this.circles = this.buildAndScatter();
    }

    private buildAndScatter(): CircleItem[] {
        const hue = 265; // mor
        const lStart = 93, lEnd = 18;
        const lStep = (lStart - lEnd) / 11;

        const items: CircleItem[] = Array.from({ length: 12 }, (_, i) => ({
            id: i, order: i + 1,
            shade: `hsl(${hue}, 90%, ${Math.round(lStart - i * lStep)}%)`,
            found: false, foundStep: undefined, isShaking: false
        }));
        // Sabit karışık sıra
        const fixedOrder = [8, 1, 10, 4, 11, 2, 7, 0, 5, 9, 3, 6];
        return fixedOrder.map((origIdx) => items[origIdx]);
    }

    onCircleClick(circle: CircleItem): void {
        if (circle.found || this.isComplete) return;
        if (circle.order === this.currentStep) {
            circle.found = true;
            circle.foundStep = this.currentStep;
            this.currentStep++;
            this.hintService.resetErrors(ID);
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika bir iş çıkardın!');
            }
        } else {
            circle.isShaking = true;
            this.hintService.registerError(ID);
            setTimeout(() => (circle.isShaking = false), 500);
            this.persist();
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            circles: this.circles,
            currentStep: this.currentStep
        });
    }

    restartGame(): void {
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
        this.initGame();
    }

    goPrev(): void { this.router.navigate(['/symbol-block-match']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/balance-scale']);
    }
}
