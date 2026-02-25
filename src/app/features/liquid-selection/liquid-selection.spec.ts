import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiquidSelection } from './liquid-selection';

describe('LiquidSelection', () => {
  let component: LiquidSelection;
  let fixture: ComponentFixture<LiquidSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiquidSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiquidSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
