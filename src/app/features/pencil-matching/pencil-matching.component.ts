import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface Pencil {
    color: string; // 'red' | 'orange' | 'green' | 'yellow'
    size: string;  // 'xl' | 'lg' | 'md' | 'sm'
    isSelected: boolean;
    isMatched: boolean;
    isWrong: boolean;
}

interface MatchLine {
    leftIndex: number;
    rightIndex: number;
    size: string;
}

interface PencilMatchingState {
    leftPencils: Pencil[];
    rightPencils: Pencil[];
    matchLines: MatchLine[];
}

const ID = 'pencil-matching';

@Component({
    selector: 'app-pencil-matching',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './pencil-matching.component.html',
    styleUrl: './pencil-matching.component.scss'
})
export class PencilMatchingComponent implements OnInit {

    // SVG overlay layout constants
    readonly CONTAINER_WIDTH = 560;
    readonly CONTAINER_HEIGHT = 440;
    readonly ITEM_HEIGHT = 110;
    readonly LEFT_ANCHOR_X = 240;  // right edge of left column
    readonly RIGHT_ANCHOR_X = 320; // left edge of right column

    // Left column: fixed order, tips point RIGHT
    leftPencils: Pencil[] = [
        { color: 'red',    size: 'xl', isSelected: false, isMatched: false, isWrong: false },
        { color: 'orange', size: 'lg', isSelected: false, isMatched: false, isWrong: false },
        { color: 'green',  size: 'md', isSelected: false, isMatched: false, isWrong: false },
        { color: 'yellow', size: 'sm', isSelected: false, isMatched: false, isWrong: false },
    ];

    // Right column: shuffled, tips point LEFT (flipped)
    // Matches by SIZE: green(sm)↔yellow(sm), orange(xl)↔red(xl), red(lg)↔orange(lg), yellow(md)↔green(md)
    rightPencils: Pencil[] = [
        { color: 'green',  size: 'sm', isSelected: false, isMatched: false, isWrong: false },
        { color: 'orange', size: 'xl', isSelected: false, isMatched: false, isWrong: false },
        { color: 'red',    size: 'lg', isSelected: false, isMatched: false, isWrong: false },
        { color: 'yellow', size: 'md', isSelected: false, isMatched: false, isWrong: false },
    ];

    matchLines: MatchLine[] = [];
    selectedLeftIndex: number | null = null;
    lastWrongSize: string | null = null;

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
        return this.leftPencils.every(p => p.isMatched) || this.gs.isCompleted(ID);
    }

    get hintLeftIndex(): number | null {
        if (!this.showHint || !this.lastWrongSize) return null;
        const idx = this.leftPencils.findIndex(p => !p.isMatched && p.size === this.lastWrongSize);
        return idx !== -1 ? idx : null;
    }

    get hintRightIndex(): number | null {
        if (!this.showHint || !this.lastWrongSize) return null;
        const idx = this.rightPencils.findIndex(p => !p.isMatched && p.size === this.lastWrongSize);
        return idx !== -1 ? idx : null;
    }

    ngOnInit(): void {
        const saved = this.gs.getData<PencilMatchingState>(ID);
        if (saved) {
            this.leftPencils = saved.leftPencils || this.leftPencils;
            this.rightPencils = saved.rightPencils || this.rightPencils;
            this.matchLines = saved.matchLines || [];
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            leftPencils: this.leftPencils,
            rightPencils: this.rightPencils,
            matchLines: this.matchLines
        });
    }

    getItemCenterY(index: number): number {
        return index * this.ITEM_HEIGHT + this.ITEM_HEIGHT / 2;
    }

    selectLeft(index: number): void {
        if (this.isNextUnlocked) return;
        const pencil = this.leftPencils[index];
        if (pencil.isMatched) return;

        if (this.selectedLeftIndex === index) {
            pencil.isSelected = false;
            this.selectedLeftIndex = null;
        } else {
            this.leftPencils.forEach(p => p.isSelected = false);
            pencil.isSelected = true;
            this.selectedLeftIndex = index;
        }
    }

    selectRight(index: number): void {
        if (this.isNextUnlocked) return;
        if (this.selectedLeftIndex === null) return;
        const right = this.rightPencils[index];
        if (right.isMatched) return;

        const left = this.leftPencils[this.selectedLeftIndex];
        const leftIndex = this.selectedLeftIndex;

        if (left.size === right.size) {
            left.isMatched = true;
            right.isMatched = true;
            left.isSelected = false;
            this.matchLines.push({ leftIndex, rightIndex: index, size: left.size });
            this.selectedLeftIndex = null;
            if (this.lastWrongSize === left.size) this.lastWrongSize = null;

            if (this.isNextUnlocked) {
                this.gs.markCompleted(ID);
                this.hintService.resetErrors(ID);
                this.fb.showFeedback('success', 'Harika! Tüm kalemleri doğru eşleştirdin!');
            }
            this.persist();
        } else {
            this.hintService.registerError(ID);
            this.lastWrongSize = left.size;
            left.isWrong = true;
            right.isWrong = true;
            left.isSelected = false;
            this.selectedLeftIndex = null;
            this.fb.showFeedback('error', 'Bu kalemler aynı uzunlukta değil. Tekrar dene!');

            setTimeout(() => {
                left.isWrong = false;
                right.isWrong = false;
            }, 500);
        }
    }

    clearSelection(): void {
        this.leftPencils.forEach(p => { p.isSelected = false; p.isMatched = false; p.isWrong = false; });
        this.rightPencils.forEach(p => { p.isSelected = false; p.isMatched = false; p.isWrong = false; });
        this.matchLines = [];
        this.selectedLeftIndex = null;
        this.lastWrongSize = null;
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    goPrev(): void {
        this.router.navigate(['/bike-matching']);
    }

    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/symbol-grid-copy']);
    }
}
