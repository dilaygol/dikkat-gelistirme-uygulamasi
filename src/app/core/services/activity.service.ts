import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, map, filter, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActivityService {
    private router = inject(Router);

    // Ordered list of activity paths from app.routes.ts
    private readonly activityPaths = [
        'pattern', 'odd-direction', 'shade-sorting', 'number-sequence', 'symbol-matching',
        'multi-condition-selection', 'animal-position', 'pattern-2', 'shape-coloring',
        'liquid-selection', 'longest-rope', 'letter-matching', 'shape-pattern',
        'board-letter-matching', 'shape-to-color-match', 'sequence-rule-breaker',
        'living-things', 'traffic-sign-matching', 'abacus-counting', 'dot-pattern-drawing',
        'fruit-count-matching', 'find-most-balls', 'shadow-matching', 'letter-sequence',
        'identical-pattern', 'match-size', 'grid-coloring', 'find-same-symbols',
        'find-numbers', 'find-reversed-e', 'count-and-add', 'rhythmic-counting',
        'top-view', 'box-coloring', 'triangle-size', 'flower-coloring', 'not-in-word',
        'finding-green-lines', 'incorrect-numbers', 'water-capacity', 'fruit-size-ranking',
        'elderly-people', 'find-different', 'cylinder-selection', 'pattern-completion',
        'shape-counting', 'happy-children', 'different-mountain', 'letter-grid',
        'ice-cream-shape', 'most-colorful-ball', 'cat-position', 'dot-grid-copy', 'bike-matching', 'pencil-matching', 'symbol-grid-copy', 'ball-matching', 'orange-different', 'river-branches', 'symbol-grid-matching', 'shape-match-find', 'count-apples', 'ball-sequence', 'snake-letter', 'letter-color-match', 'fruit-subtraction', 'triangle-match', 'set-match', 'profession-matching', 'fruit-basket', 'flower-order', 'symbol-color-match', 'object-addition', 'symbol-block-match', 'shade-sorting-2', 'balance-scale', 'two-feature-filter', 'subtle-difference', 'letter-hunt', 'missing-number'
    ];

    private currentPath$ = new BehaviorSubject<string>('');

    constructor() {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            const path = event.urlAfterRedirects.split('/').pop() || '';
            this.currentPath$.next(path);
        });

        // Initial value
        const initialPath = this.router.url.split('/').pop() || '';
        this.currentPath$.next(initialPath);
    }

    readonly totalActivities = this.activityPaths.length;

    readonly currentIndex$ = this.currentPath$.pipe(
        map(path => {
            const index = this.activityPaths.indexOf(path);
            return index !== -1 ? index : 0;
        }),
        shareReplay(1)
    );

    readonly progress$ = this.currentIndex$.pipe(
        map(index => ((index + 1) / this.totalActivities) * 100),
        shareReplay(1)
    );

    readonly questionNumber$ = this.currentIndex$.pipe(
        map(index => index + 1),
        shareReplay(1)
    );
}
