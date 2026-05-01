import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

type ShapeKind = 'triangle' | 'circle' | 'square';
type ColorKind = 'red' | 'blue' | 'green';

interface Cell {
    id: number;
    shape: ShapeKind;
    color: ColorKind;
    isTarget: boolean;   // matches both target shape + color
    isSelected: boolean; // user clicked it correctly
    isWrong: boolean;
}

interface TwoFeatureState {
    cells: { isSelected: boolean }[];
}

const ID = 'two-feature-filter';

@Component({
    selector: 'app-two-feature-filter',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './two-feature-filter.component.html',
    styleUrl: './two-feature-filter.component.scss'
})
export class TwoFeatureFilterComponent implements OnInit {

    readonly TARGET_SHAPE: ShapeKind = 'triangle';
    readonly TARGET_COLOR: ColorKind = 'red';

    // 5×4 = 20 cells. Fixed deterministic layout.
    cells: Cell[] = [
        { id: 0,  shape: 'triangle', color: 'red',   isTarget: true,  isSelected: false, isWrong: false },
        { id: 1,  shape: 'circle',   color: 'red',   isTarget: false, isSelected: false, isWrong: false },
        { id: 2,  shape: 'triangle', color: 'blue',  isTarget: false, isSelected: false, isWrong: false },
        { id: 3,  shape: 'square',   color: 'green', isTarget: false, isSelected: false, isWrong: false },
        { id: 4,  shape: 'triangle', color: 'red',   isTarget: true,  isSelected: false, isWrong: false },

        { id: 5,  shape: 'square',   color: 'red',   isTarget: false, isSelected: false, isWrong: false },
        { id: 6,  shape: 'triangle', color: 'green', isTarget: false, isSelected: false, isWrong: false },
        { id: 7,  shape: 'triangle', color: 'red',   isTarget: true,  isSelected: false, isWrong: false },
        { id: 8,  shape: 'circle',   color: 'blue',  isTarget: false, isSelected: false, isWrong: false },
        { id: 9,  shape: 'triangle', color: 'blue',  isTarget: false, isSelected: false, isWrong: false },

        { id: 10, shape: 'circle',   color: 'green', isTarget: false, isSelected: false, isWrong: false },
        { id: 11, shape: 'triangle', color: 'red',   isTarget: true,  isSelected: false, isWrong: false },
        { id: 12, shape: 'square',   color: 'blue',  isTarget: false, isSelected: false, isWrong: false },
        { id: 13, shape: 'triangle', color: 'green', isTarget: false, isSelected: false, isWrong: false },
        { id: 14, shape: 'circle',   color: 'red',   isTarget: false, isSelected: false, isWrong: false },

        { id: 15, shape: 'triangle', color: 'red',   isTarget: true,  isSelected: false, isWrong: false },
        { id: 16, shape: 'square',   color: 'red',   isTarget: false, isSelected: false, isWrong: false },
        { id: 17, shape: 'circle',   color: 'blue',  isTarget: false, isSelected: false, isWrong: false },
        { id: 18, shape: 'triangle', color: 'blue',  isTarget: false, isSelected: false, isWrong: false },
        { id: 19, shape: 'square',   color: 'green', isTarget: false, isSelected: false, isWrong: false },
    ];

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) { }

    get showHint(): boolean { return this.hintService.shouldShowHint(ID); }
    get targetCount(): number { return this.cells.filter(c => c.isTarget).length; }
    get foundCount(): number { return this.cells.filter(c => c.isTarget && c.isSelected).length; }
    get isComplete(): boolean { return this.foundCount === this.targetCount; }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    ngOnInit(): void {
        const saved = this.gs.getData<TwoFeatureState>(ID);
        if (saved?.cells && saved.cells.length === this.cells.length) {
            this.cells.forEach((c, i) => { c.isSelected = saved.cells[i].isSelected; });
        } else {
            this.gs.clear(ID);
        }
    }

    onCellClick(cell: Cell): void {
        if (this.isNextUnlocked || cell.isSelected) return;
        if (cell.isTarget) {
            cell.isSelected = true;
            this.hintService.resetErrors(ID);
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika! Tüm kırmızı üçgenleri buldun!');
            }
        } else {
            cell.isWrong = true;
            this.hintService.registerError(ID);
            const reason = cell.shape === 'triangle'
                ? 'Bu üçgen ama rengi farklı!'
                : cell.color === 'red'
                    ? 'Bu kırmızı ama şekli farklı!'
                    : 'Ne üçgen ne kırmızı!';
            this.fb.showFeedback('error', reason);
            setTimeout(() => { cell.isWrong = false; }, 500);
        }
    }

    shouldHint(cell: Cell): boolean {
        if (!this.showHint || cell.isSelected) return false;
        // Highlight first unfound target
        const firstUnfound = this.cells.find(c => c.isTarget && !c.isSelected);
        return firstUnfound?.id === cell.id;
    }

    private persist(): void {
        this.gs.save(ID, { cells: this.cells.map(c => ({ isSelected: c.isSelected })) });
    }

    clearSelection(): void {
        this.cells.forEach(c => { c.isSelected = false; c.isWrong = false; });
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    goPrev(): void { this.router.navigate(['/balance-scale']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/subtle-difference']);
    }
}
