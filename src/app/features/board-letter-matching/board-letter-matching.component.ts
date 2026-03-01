import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { HintService } from '../../core/services/hint.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';

interface LetterItem {
    id: number;
    letter: string;
    isSelected: boolean;
    isMatched: boolean;
    isShaking?: boolean;
}

interface BoardLetterState {
    firstSelection: number | null;
    matchedPairs: number;
    lettersState: { id: number, isMatched: boolean }[];
}

const ID = 'board-letter-matching';

@Component({
    selector: 'app-board-letter-matching',
    standalone: true,
    imports: [CommonModule, ActionButtonsComponent],
    templateUrl: './board-letter-matching.component.html',
    styleUrl: './board-letter-matching.component.scss'
})
export class BoardLetterMatchingComponent implements OnInit {

    constructor(
        private router: Router,
        private gs: GameStateService,
        private fb: FeedbackService,
        private hintService: HintService
    ) { }

    letters: LetterItem[] = [
        { id: 1, letter: 'A', isSelected: false, isMatched: false },
        { id: 2, letter: 'N', isSelected: false, isMatched: false },
        { id: 3, letter: 'E', isSelected: false, isMatched: false },
        { id: 4, letter: 'İ', isSelected: false, isMatched: false },
        { id: 5, letter: 'T', isSelected: false, isMatched: false }, // Çeldirici
        { id: 6, letter: 'A', isSelected: false, isMatched: false },
        { id: 7, letter: 'E', isSelected: false, isMatched: false },
        { id: 8, letter: 'N', isSelected: false, isMatched: false },
        { id: 9, letter: 'İ', isSelected: false, isMatched: false }
    ];

    firstSelection: number | null = null;
    matchedPairs = 0;

    get showHint(): boolean {
        return this.hintService.shouldShowHint(ID);
    }

    get activeHintLetter(): string | null {
        // Eğer ilk seçim yapılmışsa, aranacak olan eş harf odur
        if (this.firstSelection !== null) {
            const first = this.letters.find(l => l.id === this.firstSelection);
            if (first) return first.letter;
        }

        // Eğer henüz seçim yapılmamışsa, eşleşmemiş olan ilk harf çiftini bul
        // Çeldiricileri eliyoruz ('T' harfi tek başına çeldirici olarak bırakılmıştı, ama daha dinamik
        // olması için eşi olan ilk harfi arayalım).
        const unmatchedLetters = this.letters.filter(l => !l.isMatched);

        for (const l1 of unmatchedLetters) {
            // Eşi var mı diye bak
            const pairCount = unmatchedLetters.filter(l2 => l2.letter === l1.letter).length;
            if (pairCount > 1) {
                return l1.letter; // Eşi olan ilk harfi hedef yap
            }
        }

        return null;
    }

    get isNextUnlocked(): boolean {
        return this.matchedPairs >= 4 || this.gs.isCompleted(ID);
    }

    ngOnInit(): void {
        const saved = this.gs.getData<BoardLetterState>(ID);
        if (saved) {
            this.firstSelection = saved.firstSelection;
            this.matchedPairs = saved.matchedPairs || 0;

            if (saved.lettersState) {
                saved.lettersState.forEach(ls => {
                    const l = this.letters.find(x => x.id === ls.id);
                    if (l) {
                        l.isMatched = ls.isMatched;
                    }
                });
            }

            // İlk seçim açıksa onun isSelected'ini TRUE yapmamız lazım State kurtarımı için.
            if (this.firstSelection !== null) {
                const f = this.letters.find(l => l.id === this.firstSelection);
                if (f) f.isSelected = true;
            }
        }
    }

    private persist(): void {
        this.gs.save(ID, {
            firstSelection: this.firstSelection,
            matchedPairs: this.matchedPairs,
            lettersState: this.letters.map(l => ({ id: l.id, isMatched: l.isMatched }))
        });
    }

    selectLetter(id: number): void {
        if (this.gs.isCompleted(ID)) return;

        const letter = this.letters.find(l => l.id === id);
        if (!letter || letter.isMatched || letter.isSelected) return;

        if (this.firstSelection === null) {
            // İlk kez seçiliyor
            this.firstSelection = id;
            letter.isSelected = true;
            this.persist();
        } else {
            // İkinci seçim yapıldı, karşılaştır!
            const firstLetter = this.letters.find(l => l.id === this.firstSelection)!;
            letter.isSelected = true; // Make the second letter selected instantly

            if (firstLetter.letter === letter.letter) {
                // Eşleşme Başarılı! Anında işaretle
                firstLetter.isMatched = true;
                letter.isMatched = true;
                firstLetter.isSelected = false;
                letter.isSelected = false;
                this.firstSelection = null;
                this.matchedPairs++;
                this.hintService.resetErrors(ID);
                this.persist();
            } else {
                // Eşleşme Hatalı! Anında seçimleri temizle ve titret
                this.hintService.registerError(ID);
                firstLetter.isSelected = false;
                letter.isSelected = false;

                firstLetter.isShaking = true;
                letter.isShaking = true;

                setTimeout(() => {
                    firstLetter.isShaking = false;
                    letter.isShaking = false;
                }, 500);

                this.firstSelection = null;
                this.persist();
            }
        }
    }

    clearSelection(): void {
        this.firstSelection = null;
        this.matchedPairs = 0;
        this.letters.forEach(l => {
            l.isSelected = false;
            l.isMatched = false;
            l.isShaking = false;
        });
        this.gs.clear(ID);
        this.hintService.resetErrors(ID);
    }

    checkAnswer(): void {
        if (this.matchedPairs === 0 && this.firstSelection === null) {
            this.fb.showFeedback('error', 'Lütfen kontrol etmeden önce bir seçim yapın!');
            return;
        }

        if (this.matchedPairs >= 4) {
            this.gs.markCompleted(ID);
            this.fb.showFeedback('success', 'Harika yetenek! Bütün eşleri buldun.');
        } else {
            this.fb.showFeedback('error', 'Hala eşleştirmediğin harfler var! Aynı harflerin üzerine teker teker tıkla.');
        }
    }

    goPrev(): void {
        this.router.navigate(['/shape-pattern']);
    }

    goNext(): void {
        if (!this.isNextUnlocked) return;
        this.router.navigate(['/shape-to-color-match']);
    }
}
