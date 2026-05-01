import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface StarCell {
    id: number;
    rotation: number;
    fillColor: string;
    scale: number;
    innerRadius: number;
    isDifferent: boolean;
    isSelected: boolean;
    isWrong: boolean;
}

interface StarDifferenceState { cells: { isSelected: boolean }[]; }

const ID = 'star-difference';

const STD_COLOR = '#FFD700';
const STD_ROT = 0;
const STD_SCALE = 1;
const STD_INNER = 17;
const OUTER_R = 40;

@Component({
    selector: 'app-star-difference',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './star-difference.component.html',
    styleUrl: './star-difference.component.scss'
})
export class StarDifferenceComponent implements OnInit {

    cells: StarCell[] = [];

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) {
        const make = (id: number, diff: Partial<StarCell> = {}): StarCell => ({
            id,
            rotation: STD_ROT,
            fillColor: STD_COLOR,
            scale: STD_SCALE,
            innerRadius: STD_INNER,
            isDifferent: false,
            isSelected: false,
            isWrong: false,
            ...diff,
        });

        // 4×4 = 16 yıldız, 4 tanesi "farklı"
        this.cells = [
            make(0),
            make(1),
            make(2,  { rotation: 20, isDifferent: true }),          // hafif eğilmiş yıldız
            make(3),
            make(4),
            make(5),
            make(6),
            make(7,  { fillColor: '#FFB347', isDifferent: true }),   // turuncu-sarı ton
            make(8),
            make(9),
            make(10, { innerRadius: 24, isDifferent: true }),        // kalın, az sivri yıldız
            make(11),
            make(12),
            make(13, { scale: 0.72, isDifferent: true }),            // küçük yıldız
            make(14),
            make(15),
        ];
    }

    getStarPoints(innerR: number): string {
        const points: string[] = [];
        for (let k = 0; k < 10; k++) {
            const r = k % 2 === 0 ? OUTER_R : innerR;
            const angle = (k * 36 - 90) * Math.PI / 180;
            points.push(`${(r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`);
        }
        return points.join(' ');
    }

    get showHint(): boolean { return this.hintService.shouldShowHint(ID); }
    get totalDifferent(): number { return this.cells.filter(c => c.isDifferent).length; }
    get foundCount(): number { return this.cells.filter(c => c.isDifferent && c.isSelected).length; }
    get isComplete(): boolean { return this.foundCount === this.totalDifferent; }
    get isNextUnlocked(): boolean { return this.isComplete || this.gs.isCompleted(ID); }

    ngOnInit(): void {
        const saved = this.gs.getData<StarDifferenceState>(ID);
        if (saved?.cells && saved.cells.length === this.cells.length) {
            this.cells.forEach((c, i) => { c.isSelected = saved.cells[i].isSelected; });
        } else {
            this.gs.clear(ID);
        }
    }

    onCellClick(cell: StarCell): void {
        if (this.isNextUnlocked || cell.isSelected) return;
        if (cell.isDifferent) {
            cell.isSelected = true;
            this.hintService.resetErrors(ID);
            this.persist();
            if (this.isComplete) {
                this.gs.markCompleted(ID);
                this.fb.showFeedback('success', 'Harika! Tüm farklı yıldızları buldun!');
            } else {
                this.fb.showFeedback('success', 'Aferin! Bir farklı yıldız daha buldun.');
            }
        } else {
            cell.isWrong = true;
            this.hintService.registerError(ID);
            this.fb.showFeedback('error', 'Bu yıldız diğerleriyle aynı. Daha dikkatli bak!');
            setTimeout(() => { cell.isWrong = false; }, 500);
        }
    }

    shouldHint(cell: StarCell): boolean {
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

    goPrev(): void { this.router.navigate(['/count-given-color']); }
    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/fruit-sequence']);
    }
}
