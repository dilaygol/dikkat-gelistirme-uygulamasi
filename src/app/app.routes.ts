import { Routes } from '@angular/router';
import { PatternMatchingComponent } from './features/pattern-matching/pattern-matching.component';
import { OddDirectionComponent } from './features/odd-direction/odd-direction.component';
import { ShadeSortingComponent } from './features/shade-sorting/shade-sorting.component';
import { NumberSequenceComponent } from './features/number-sequence/number-sequence.component';
import { SymbolMatchingComponent } from './features/symbol-matching/symbol-matching.component';

export const routes: Routes = [
    { path: '', redirectTo: 'pattern', pathMatch: 'full' },
    { path: 'pattern', component: PatternMatchingComponent },
    { path: 'odd-direction', component: OddDirectionComponent },
    { path: 'shade-sorting', component: ShadeSortingComponent },
    { path: 'number-sequence', component: NumberSequenceComponent },
    { path: 'symbol-matching', component: SymbolMatchingComponent },
    { path: '**', redirectTo: 'pattern' },
];
