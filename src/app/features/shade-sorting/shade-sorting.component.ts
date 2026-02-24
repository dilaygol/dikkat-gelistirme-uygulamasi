import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';

interface TriangleItem {
    id: number;
    order: number;
    shade: string;
    found: boolean;
    foundStep?: number;
    isShaking: boolean;
    top: string;
    left: string;
}

interface ShadeSortState {
    triangles: TriangleItem[];
    currentStep: number;
    stepErrorCount: number;
}

const ID = 'shade-sorting';

@Component({
    selector: 'app-shade-sorting',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent],
    templateUrl: './shade-sorting.component.html',
    styleUrl: './shade-sorting.component.scss',
})
export class ShadeSortingComponent implements OnInit {
    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService
    ) { }

    triangles: TriangleItem[] = [];
    currentStep = 1;
    stepErrorCount = 0;

    get isComplete(): boolean { return this.currentStep > 16; }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    ngOnInit(): void {
        const saved = this.gs.getData<ShadeSortState>(ID);
        if (saved) {
            // Kaydedilmiş durum var → geri yükle
            this.triangles = saved.triangles;
            this.currentStep = saved.currentStep;
            this.stepErrorCount = saved.stepErrorCount || 0;
        } else {
            this.initGame();
        }
    }

    initGame(): void {
        this.currentStep = 1;
        this.stepErrorCount = 0;
        this.triangles = this.buildAndScatter();
    }

    private buildAndScatter(): TriangleItem[] {
        const hStart = 30, hEnd = 25;
        const sStart = 100, sEnd = 100;
        const lStart = 88, lEnd = 38;

        const hStep = (hStart - hEnd) / 15;
        const sStep = (sStart - sEnd) / 15;
        const lStep = (lStart - lEnd) / 15;

        const items: TriangleItem[] = Array.from({ length: 16 }, (_, i) => ({
            id: i, order: i + 1,
            shade: `hsl(${Math.round(hStart - i * hStep)}, ${Math.round(sStart - i * sStep)}%, ${Math.round(lStart - i * lStep)}%)`,
            found: false, foundStep: undefined, isShaking: false,
            top: '0%', left: '0%',
        }));
        // Sabit karışık sıra – her oyunda aynı görünüm
        const fixedOrder = [12, 3, 7, 15, 0, 10, 5, 13, 8, 1, 14, 6, 11, 4, 9, 2];
        const positions = this.generatePositions();
        return fixedOrder.map((origIdx, posIdx) => ({
            ...items[origIdx],
            top: positions[posIdx].top,
            left: positions[posIdx].left,
        }));
    }

    private generatePositions(): { top: string; left: string }[] {
        // Sabit 4×4 ızgara – canvas içinde ortalanmış
        return [
            { top: '4%', left: '8%' }, { top: '4%', left: '31%' }, { top: '4%', left: '54%' }, { top: '4%', left: '77%' },
            { top: '27%', left: '10%' }, { top: '27%', left: '33%' }, { top: '27%', left: '56%' }, { top: '27%', left: '75%' },
            { top: '50%', left: '8%' }, { top: '50%', left: '31%' }, { top: '50%', left: '54%' }, { top: '50%', left: '77%' },
            { top: '73%', left: '10%' }, { top: '73%', left: '33%' }, { top: '73%', left: '56%' }, { top: '73%', left: '75%' },
        ];
    }

    /** Ülüğü bulunan üçgene tıklandığında doğrulama yapar */
    onTriangleClick(tri: TriangleItem): void {
        if (tri.found || this.isComplete) return;
        if (tri.order === this.currentStep) {
            tri.found = true;
            tri.foundStep = this.currentStep;
            this.currentStep++;
            this.stepErrorCount = 0; // Doğru bulununca o adımın hatası sıfırlanır
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika bir iş çıkardın!');
            }
        } else {
            tri.isShaking = true;
            this.stepErrorCount++;
            setTimeout(() => (tri.isShaking = false), 500);
            this.persist();
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            triangles: this.triangles,
            currentStep: this.currentStep,
            stepErrorCount: this.stepErrorCount
        });
    }

    /** Tüm ilerlemeyi sıfırlar; positions ve sıra sabitlenir */
    restartGame(): void {
        this.gs.clear(ID);
        this.stepErrorCount = 0;
        this.initGame();
    }

    goPrev(): void { this.router.navigate(['/odd-direction']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/number-sequence']);
    }
}
