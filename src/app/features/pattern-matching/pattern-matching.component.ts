import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { ActionButtonsComponent } from '../../shared/action-buttons/action-buttons.component';

// ─────────────────────────────────────────────────────────
const PUZZLE_PAGES: boolean[][][] = [
  [
    [true, false, false, false, false, false],
    [false, true, false, false, false, false],
    [true, false, false, false, true, false],
    [false, false, true, true, false, true],
    [false, false, false, false, false, true],
    [false, false, false, false, false, false],
  ],
];

interface PatternState {
  userGrid: boolean[][];
  feedbackState: 'correct' | 'wrong' | null;
  errorCount: number;
}

const ID = 'pattern';

@Component({
  selector: 'app-pattern-matching',
  standalone: true,
  imports: [CommonModule, ActionButtonsComponent],
  templateUrl: './pattern-matching.component.html',
  styleUrl: './pattern-matching.component.scss',
})
export class PatternMatchingComponent implements OnInit {
  constructor(
    private router: Router,
    private gs: GameStateService,
    private fb: FeedbackService
  ) { }

  readonly currentPage = signal(0);
  readonly totalPages = PUZZLE_PAGES.length;
  readonly targetGrid = computed(() => PUZZLE_PAGES[this.currentPage()]);

  userGrid: boolean[][] = this.createEmptyGrid();
  feedbackState: 'correct' | 'wrong' | null = null;
  errorCount = 0;
  showHints = false;

  get isNextUnlocked(): boolean {
    return this.feedbackState === 'correct' || this.gs.isCompleted(ID);
  }

  readonly isPrevEnabled = false;

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit(): void {
    const saved = this.gs.getData<PatternState>(ID);
    if (saved) {
      this.userGrid = saved.userGrid.map(row => [...row]);
      this.feedbackState = saved.feedbackState;
      this.errorCount = saved.errorCount || 0;
    }
  }

  // ── Yardımcı ──────────────────────────────────────────
  private createEmptyGrid(): boolean[][] {
    return Array.from({ length: 6 }, () => Array(6).fill(false));
  }

  private persist(): void {
    this.gs.save(ID, {
      userGrid: this.userGrid,
      feedbackState: this.feedbackState,
      errorCount: this.errorCount
    });
  }

  // ── Etkileşim ─────────────────────────────────────────
  /** Hücreyi açar/kapar; oyun kilitliyse işlem yapmaz */
  toggleCell(row: number, col: number): void {
    if (this.gs.isCompleted(ID) && this.feedbackState === 'correct') return; // kilitli
    this.userGrid[row][col] = !this.userGrid[row][col];
    this.feedbackState = null;
    this.showHints = false; // Kullanıcı hamle yaptığında ipuçları gizlenir
    this.persist();
  }

  /** Izgarı ve ilerlemeyi sıfırlar */
  clearGrid(): void {
    this.userGrid = this.createEmptyGrid();
    this.feedbackState = null;
    this.errorCount = 0;
    this.showHints = false;
    this.gs.clear(ID);       // servisten de sil
  }

  /** Deseni hedefle karşılaştırır; 2 hatadan sonra ipucu gösterir */
  checkPattern(): void {
    const target = this.targetGrid();
    const isCorrect = target.every((row, r) =>
      row.every((cell, c) => cell === this.userGrid[r][c])
    );
    this.feedbackState = isCorrect ? 'correct' : 'wrong';
    if (isCorrect) {
      this.gs.markCompleted(ID);
      this.fb.showFeedback('success', 'Tebrikler! Deseni mükemmel kopyaladın!');
    } else {
      this.errorCount++;
      if (this.errorCount >= 2) {
        this.showHints = true;
      }
      this.fb.showFeedback('error', 'Tekrar Denemelisin');
    }
    this.persist();
  }

  isHintRemove(r: number, c: number): boolean {
    if (!this.showHints) return false;
    return this.userGrid[r][c] && !this.targetGrid()[r][c]; // Fazladan boyanmış
  }

  isHintAdd(r: number, c: number): boolean {
    if (!this.showHints) return false;
    return !this.userGrid[r][c] && this.targetGrid()[r][c]; // Eksik boyanmış
  }

  // ── Navigasyon ────────────────────────────────────────
  goPrev(): void { /* İlk etkinlik – önceki sayfa yok */ }

  goNext(): void {
    if (!this.isNextUnlocked) return;
    const next = this.currentPage() + 1;
    if (next >= this.totalPages) {
      this.router.navigate(['/odd-direction']);
    } else {
      this.currentPage.set(next);
      this.resetSession();
    }
  }

  private resetSession(): void {
    this.userGrid = this.createEmptyGrid();
    this.feedbackState = null;
    this.errorCount = 0;
    this.showHints = false;
  }

  readonly rowIndices = [0, 1, 2, 3, 4, 5] as const;
  readonly colIndices = [0, 1, 2, 3, 4, 5] as const;
}
