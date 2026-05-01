import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface FlowerCell {
    id: number;
    rotation: number;     // degrees
    color: string;        // petal color
    petalScale: number;   // 1 = normal; different if scaled
    centerColor: string;  // center color
    isDifferent: boolean; // whether this one is subtly different
    isSelected: boolean;
    isWrong: boolean;
}

interface SubtleState { cells: { isSelected: boolean }[]; }

const ID = 'subtle-difference';

// Standart (ortak) özellikler
const STD_COLOR = '#FF9800';
const STD_CENTER = '#FFC107';
const STD_ROT = 0;
const STD_SCALE = 1;

@Component({
    selector: 'app-subtle-difference',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './subtle-difference.component.html',
    styleUrl: './subtle-difference.component.scss'
})
export class SubtleDifferenceComponent implements OnInit {

    // 4×4 = 16 çiçek; 4 tanesi "farklı"
    cells: FlowerCell[] = [];

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) {
        const make = (id: number, diff: Partial<FlowerCell> = {}): FlowerCell => ({
            id,
            rotation: STD_ROT,
            color: STD_COLOR,
            petalScale: STD_SCALE,
            centerColor: STD_CENTER,
            isDifferent: false,
            isSelected: false,
            isWrong: false,
            ...diff,
        });

        this.cells = [
            make(0),
            make(1),
            make(2,  { rotation: 22, isDifferent: true }),             // eğilmiş
            make(3),
            make(4),
            make(5,  { color: '#FFB74D', isDifferent: true }),         // daha soluk turuncu
            make(6),
            make(7),
            make(8),
            make(9,  { petalScale: 0.78, isDifferent: true }),         // küçük taç yaprakları
            make(10),
            make(11),
            make(12),
            make(13),
            make(14, { centerColor: '#FB8C00', isDifferent: true }),   // farklı merkez rengi
            make(15),
        ];
    }

    get showHint(): boolean { return this.hintService.shouldShowHint(ID); }
    get totalDifferent(): number { return this.cells.filter(c => c.isDifferent).length; }
    get foundCount(): number { return this.cells.filter(c => c.isDifferent && c.isSelected).length; }
    get isComplete(): boolean { return this.foundCount === this.totalDifferent; }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    ngOnInit(): void {
        const saved = this.gs.getData<SubtleState>(ID);
        if (saved?.cells && saved.cells.length === this.cells.length) {
            this.cells.forEach((c, i) => { c.isSelected = saved.cells[i].isSelected; });
        } else {
            this.gs.clear(ID);
        }
    }

    onCellClick(cell: FlowerCell): void {
        if (this.isNextUnlocked || cell.isSelected) return;
        if (cell.isDifferent) {
            cell.isSelected = true;
            this.hintService.resetErrors(ID);
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika! Tüm farklı çiçekleri buldun!');
            } else {
                this.fb.showFeedback('success', 'Aferin! Bir farklı çiçek daha buldun.');
            }
        } else {
            cell.isWrong = true;
            this.hintService.registerError(ID);
            this.fb.showFeedback('error', 'Bu çiçek diğerlerle aynı. Daha dikkatli bak!');
            setTimeout(() => { cell.isWrong = false; }, 500);
        }
    }

    shouldHint(cell: FlowerCell): boolean {
        if (!this.showHint || cell.isSelected) return false;
        const firstUnfound = this.cells.find(c => c.isDifferent && !c.isSelected);
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

    goPrev(): void { this.router.navigate(['/two-feature-filter']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/letter-hunt']);
    }
}
