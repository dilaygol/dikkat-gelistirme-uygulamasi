import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface Bike {
    color: string;
    image: string;
    isSelected: boolean;
    isMatched: boolean;
    isWrong: boolean;
}

interface MatchLine {
    leftIndex: number;
    rightIndex: number;
    color: string;
}

interface BikeMatchingState {
    leftBikes: Bike[];
    rightBikes: Bike[];
    matchLines: MatchLine[];
}

const ID = 'bike-matching';

@Component({
    selector: 'app-bike-matching',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './bike-matching.component.html',
    styleUrl: './bike-matching.component.scss'
})
export class BikeMatchingComponent implements OnInit {

    // SVG layout constants
    readonly CONTAINER_WIDTH = 540;
    readonly CONTAINER_HEIGHT = 440;
    readonly ITEM_HEIGHT = 110;
    readonly LEFT_ANCHOR_X = 160;
    readonly RIGHT_ANCHOR_X = 380;

    leftBikes: Bike[] = [
        { color: 'sari', image: 'assets/bisiklet-sari.png', isSelected: false, isMatched: false, isWrong: false },
        { color: 'yesil', image: 'assets/bisiklet-yesil.png', isSelected: false, isMatched: false, isWrong: false },
        { color: 'mavi', image: 'assets/bisiklet-mavi.png', isSelected: false, isMatched: false, isWrong: false },
        { color: 'mor', image: 'assets/bisiklet-mor.png', isSelected: false, isMatched: false, isWrong: false },
    ];

    rightBikes: Bike[] = [
        { color: 'mavi', image: 'assets/bisiklet-mavi.png', isSelected: false, isMatched: false, isWrong: false },
        { color: 'mor', image: 'assets/bisiklet-mor.png', isSelected: false, isMatched: false, isWrong: false },
        { color: 'sari', image: 'assets/bisiklet-sari.png', isSelected: false, isMatched: false, isWrong: false },
        { color: 'yesil', image: 'assets/bisiklet-yesil.png', isSelected: false, isMatched: false, isWrong: false },
    ];

    matchLines: MatchLine[] = [];
    selectedLeftIndex: number | null = null;
    lastWrongColor: string | null = null;

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
        return this.leftBikes.every(b => b.isMatched) || this.gs.isCompleted(ID);
    }

    get hintLeftIndex(): number | null {
        if (!this.showHint || !this.lastWrongColor) return null;
        const idx = this.leftBikes.findIndex(b => !b.isMatched && b.color === this.lastWrongColor);
        return idx !== -1 ? idx : null;
    }

    get hintRightIndex(): number | null {
        if (!this.showHint || !this.lastWrongColor) return null;
        const idx = this.rightBikes.findIndex(b => !b.isMatched && b.color === this.lastWrongColor);
        return idx !== -1 ? idx : null;
    }

    ngOnInit(): void {
        const saved = this.gs.getData<BikeMatchingState>(ID);
        if (saved) {
            this.leftBikes = saved.leftBikes || this.leftBikes;
            this.rightBikes = saved.rightBikes || this.rightBikes;
            this.matchLines = saved.matchLines || [];
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            leftBikes: this.leftBikes,
            rightBikes: this.rightBikes,
            matchLines: this.matchLines
        });
    }

    getItemCenterY(index: number): number {
        return index * this.ITEM_HEIGHT + this.ITEM_HEIGHT / 2;
    }

    getLineColor(color: string): string {
        const colorMap: Record<string, string> = {
            sari: '#eab308',
            yesil: '#16a34a',
            mavi: '#2563eb',
            mor: '#7c3aed'
        };
        return colorMap[color] || '#334155';
    }

    selectLeft(index: number): void {
        if (this.isNextUnlocked) return;
        const bike = this.leftBikes[index];
        if (bike.isMatched) return;

        if (this.selectedLeftIndex === index) {
            // Toggle off
            bike.isSelected = false;
            this.selectedLeftIndex = null;
        } else {
            this.leftBikes.forEach(b => b.isSelected = false);
            bike.isSelected = true;
            this.selectedLeftIndex = index;
        }
    }

    selectRight(index: number): void {
        if (this.isNextUnlocked) return;
        if (this.selectedLeftIndex === null) return;
        const rightBike = this.rightBikes[index];
        if (rightBike.isMatched) return;

        const leftBike = this.leftBikes[this.selectedLeftIndex];
        const leftIndex = this.selectedLeftIndex;

        if (leftBike.color === rightBike.color) {
            leftBike.isMatched = true;
            rightBike.isMatched = true;
            leftBike.isSelected = false;
            this.matchLines.push({ leftIndex, rightIndex: index, color: leftBike.color });
            this.selectedLeftIndex = null;
            if (this.lastWrongColor === leftBike.color) {
                this.lastWrongColor = null;
            }

            if (this.isNextUnlocked) {
                this.gs.markCompleted(ID);
                this.hintService.resetErrors(ID);
                this.fb.showFeedback('success', 'Harika! Tüm bisikletleri doğru eşleştirdin!');
            }
            this.persist();
        } else {
            this.hintService.registerError(ID);
            this.lastWrongColor = leftBike.color;
            leftBike.isWrong = true;
            rightBike.isWrong = true;
            leftBike.isSelected = false;
            this.selectedLeftIndex = null;
            this.fb.showFeedback('error', 'Bu bisikletler aynı renk değil. Tekrar dene!');

            setTimeout(() => {
                leftBike.isWrong = false;
                rightBike.isWrong = false;
            }, 500);
        }
    }

    clearSelection(): void {
        this.leftBikes.forEach(b => { b.isSelected = false; b.isMatched = false; b.isWrong = false; });
        this.rightBikes.forEach(b => { b.isSelected = false; b.isMatched = false; b.isWrong = false; });
        this.matchLines = [];
        this.selectedLeftIndex = null;
        this.lastWrongColor = null;
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    goPrev(): void {
        this.router.navigate(['/dot-grid-copy']);
    }

    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/pencil-matching']);
    }
}
