import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface TriangleItem {
    id: number;
    order: number;
    shade: string;
    found: boolean;
    foundStep?: number;
    isShaking: boolean;
}

interface ShadeSortState {
    triangles: TriangleItem[];
    currentStep: number;
}

const ID = 'shade-sorting';

@Component({
    selector: 'app-shade-sorting',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './shade-sorting.component.html',
    styleUrl: './shade-sorting.component.scss',
})
export class ShadeSortingComponent implements OnInit {
    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) { }

    triangles: TriangleItem[] = [];
    currentStep = 1;

    get showHint(): boolean {
        return this.hintService.shouldShowHint(ID);
    }

    get isComplete(): boolean { return this.currentStep > 12; }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    ngOnInit(): void {
        const saved = this.gs.getData<ShadeSortState>(ID);
        if (saved) {
            // Kaydedilmiş durum var → geri yükle
            this.triangles = saved.triangles;
            this.currentStep = saved.currentStep;
        } else {
            this.initGame();
        }
    }

    initGame(): void {
        this.currentStep = 1;
        this.hintService.resetErrors(ID);
        this.triangles = this.buildAndScatter();
    }

    private buildAndScatter(): TriangleItem[] {
        const hStart = 182, hEnd = 189;
        const lStart = 95, lEnd = 12;
        const hStep = (hEnd - hStart) / 11;
        const lStep = (lStart - lEnd) / 11;

        const items: TriangleItem[] = Array.from({ length: 12 }, (_, i) => ({
            id: i, order: i + 1,
            shade: `hsl(${Math.round(hStart + i * hStep)}, 100%, ${Math.round(lStart - i * lStep)}%)`,
            found: false, foundStep: undefined, isShaking: false
        }));
        // Sabit karışık sıra
        const fixedOrder = [9, 2, 6, 11, 0, 7, 4, 10, 3, 8, 1, 5];
        return fixedOrder.map((origIdx) => items[origIdx]);
    }

    /** Ülüğü bulunan üçgene tıklandığında doğrulama yapar */
    onTriangleClick(tri: TriangleItem): void {
        if (tri.found || this.isComplete) return;
        if (tri.order === this.currentStep) {
            tri.found = true;
            tri.foundStep = this.currentStep;
            this.currentStep++;
            this.hintService.resetErrors(ID); // Doğru bulununca o adımın hatası sıfırlanır
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika bir iş çıkardın!');
            }
        } else {
            tri.isShaking = true;
            this.hintService.registerError(ID);
            setTimeout(() => (tri.isShaking = false), 500);
            this.persist();
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            triangles: this.triangles,
            currentStep: this.currentStep
        });
    }

    /** Tüm ilerlemeyi sıfırlar; sıra sabitlenir */
    restartGame(): void {
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
        this.initGame();
    }

    goPrev(): void { this.router.navigate(['/odd-direction']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/number-sequence']);
    }
}
