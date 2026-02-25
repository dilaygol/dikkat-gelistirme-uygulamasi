import { Routes } from '@angular/router';
import { PatternMatchingComponent } from './features/pattern-matching/pattern-matching.component';
import { OddDirectionComponent } from './features/odd-direction/odd-direction.component';
import { ShadeSortingComponent } from './features/shade-sorting/shade-sorting.component';
import { NumberSequenceComponent } from './features/number-sequence/number-sequence.component';
import { SymbolMatchingComponent } from './features/symbol-matching/symbol-matching.component';
import { MultiConditionSelectionComponent } from './features/multi-condition-selection/multi-condition-selection.component';
import { AnimalPositionComponent } from './features/animal-position/animal-position.component';
import { PatternMatchingTwoComponent } from './features/pattern-matching-two/pattern-matching-two.component';
import { ShapeColoringComponent } from './features/shape-coloring/shape-coloring.component';
import { LiquidSelectionComponent } from './features/liquid-selection/liquid-selection.component';

export const routes: Routes = [
    { path: '', redirectTo: 'pattern', pathMatch: 'full' },
    { path: 'pattern', component: PatternMatchingComponent },
    { path: 'odd-direction', component: OddDirectionComponent },
    { path: 'shade-sorting', component: ShadeSortingComponent },
    { path: 'number-sequence', component: NumberSequenceComponent },
    { path: 'symbol-matching', component: SymbolMatchingComponent },
    { path: 'multi-condition-selection', component: MultiConditionSelectionComponent },
    { path: 'animal-position', component: AnimalPositionComponent },
    { path: 'pattern-2', component: PatternMatchingTwoComponent },
    { path: 'shape-coloring', component: ShapeColoringComponent },
    { path: 'liquid-selection', component: LiquidSelectionComponent },
    { path: '**', redirectTo: 'pattern' },
];
