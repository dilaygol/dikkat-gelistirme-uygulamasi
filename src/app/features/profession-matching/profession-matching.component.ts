import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';
import { ActivityHeaderComponent } from '../../shared/activity-header/activity-header.component';

interface ProfessionItem {
    key: string;
    emoji?: string;
    label?: string;
    isSelected: boolean;
    isMatched: boolean;
    isWrong: boolean;
}

interface MatchLine {
    leftIndex: number;
    rightIndex: number;
    key: string;
}

interface ProfessionMatchingState {
    leftItems: ProfessionItem[];
    rightItems: ProfessionItem[];
    matchLines: MatchLine[];
}

const ID = 'profession-matching';

@Component({
    selector: 'app-profession-matching',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent, ActivityHeaderComponent],
    templateUrl: './profession-matching.component.html',
    styleUrl: './profession-matching.component.scss'
})
export class ProfessionMatchingComponent implements OnInit {

    readonly CONTAINER_WIDTH = 540;
    readonly CONTAINER_HEIGHT = 440;
    readonly ITEM_HEIGHT = 110;
    readonly LEFT_ANCHOR_X = 160;
    readonly RIGHT_ANCHOR_X = 380;

    // Sol sütun: meslek görselleri (emoji)
    leftItems: ProfessionItem[] = [
        { key: 'ogretmen',  emoji: '👩‍🏫', isSelected: false, isMatched: false, isWrong: false },
        { key: 'polis',     emoji: '👮',    isSelected: false, isMatched: false, isWrong: false },
        { key: 'doktor',    emoji: '👩‍⚕️', isSelected: false, isMatched: false, isWrong: false },
        { key: 'itfaiyeci', emoji: '🧑‍🚒', isSelected: false, isMatched: false, isWrong: false },
    ];

    // Sağ sütun: karışık etiketler
    rightItems: ProfessionItem[] = [
        { key: 'doktor',    label: 'Doktor',    isSelected: false, isMatched: false, isWrong: false },
        { key: 'itfaiyeci', label: 'İtfaiyeci', isSelected: false, isMatched: false, isWrong: false },
        { key: 'ogretmen',  label: 'Öğretmen',  isSelected: false, isMatched: false, isWrong: false },
        { key: 'polis',     label: 'Polis',     isSelected: false, isMatched: false, isWrong: false },
    ];

    matchLines: MatchLine[] = [];
    selectedLeftIndex: number | null = null;
    lastWrongKey: string | null = null;

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
        return this.leftItems.every(b => b.isMatched) || this.gs.isCompleted(ID);
    }

    get hintLeftIndex(): number | null {
        if (!this.showHint || !this.lastWrongKey) return null;
        const idx = this.leftItems.findIndex(b => !b.isMatched && b.key === this.lastWrongKey);
        return idx !== -1 ? idx : null;
    }

    get hintRightIndex(): number | null {
        if (!this.showHint || !this.lastWrongKey) return null;
        const idx = this.rightItems.findIndex(b => !b.isMatched && b.key === this.lastWrongKey);
        return idx !== -1 ? idx : null;
    }

    ngOnInit(): void {
        const saved = this.gs.getData<ProfessionMatchingState>(ID);
        if (saved) {
            this.leftItems = saved.leftItems || this.leftItems;
            this.rightItems = saved.rightItems || this.rightItems;
            this.matchLines = saved.matchLines || [];
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            leftItems: this.leftItems,
            rightItems: this.rightItems,
            matchLines: this.matchLines
        });
    }

    getItemCenterY(index: number): number {
        return index * this.ITEM_HEIGHT + this.ITEM_HEIGHT / 2;
    }

    getLineColor(key: string): string {
        const colorMap: Record<string, string> = {
            ogretmen:  '#eab308',
            polis:     '#2563eb',
            doktor:    '#16a34a',
            itfaiyeci: '#dc2626',
        };
        return colorMap[key] || '#334155';
    }

    selectLeft(index: number): void {
        if (this.isNextUnlocked) return;
        const item = this.leftItems[index];
        if (item.isMatched) return;

        if (this.selectedLeftIndex === index) {
            item.isSelected = false;
            this.selectedLeftIndex = null;
        } else {
            this.leftItems.forEach(b => b.isSelected = false);
            item.isSelected = true;
            this.selectedLeftIndex = index;
        }
    }

    selectRight(index: number): void {
        if (this.isNextUnlocked) return;
        if (this.selectedLeftIndex === null) return;
        const rightItem = this.rightItems[index];
        if (rightItem.isMatched) return;

        const leftItem = this.leftItems[this.selectedLeftIndex];
        const leftIndex = this.selectedLeftIndex;

        if (leftItem.key === rightItem.key) {
            leftItem.isMatched = true;
            rightItem.isMatched = true;
            leftItem.isSelected = false;
            this.matchLines.push({ leftIndex, rightIndex: index, key: leftItem.key });
            this.selectedLeftIndex = null;
            if (this.lastWrongKey === leftItem.key) {
                this.lastWrongKey = null;
            }

            if (this.isNextUnlocked) {
                this.gs.markCompleted(ID);
                this.hintService.resetErrors(ID);
                this.fb.showFeedback('success', 'Harika! Tüm meslekleri doğru eşleştirdin!');
            }
            this.persist();
        } else {
            this.hintService.registerError(ID);
            this.lastWrongKey = leftItem.key;
            leftItem.isWrong = true;
            rightItem.isWrong = true;
            leftItem.isSelected = false;
            this.selectedLeftIndex = null;
            this.fb.showFeedback('error', 'Bu eşleşme yanlış. Tekrar dene!');

            setTimeout(() => {
                leftItem.isWrong = false;
                rightItem.isWrong = false;
            }, 500);
        }
    }

    clearSelection(): void {
        this.leftItems.forEach(b => { b.isSelected = false; b.isMatched = false; b.isWrong = false; });
        this.rightItems.forEach(b => { b.isSelected = false; b.isMatched = false; b.isWrong = false; });
        this.matchLines = [];
        this.selectedLeftIndex = null;
        this.lastWrongKey = null;
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    goPrev(): void {
        this.router.navigate(['/set-match']);
    }

    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/fruit-basket']);
    }
}
