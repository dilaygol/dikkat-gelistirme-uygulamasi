import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbacusCounting } from './abacus-counting';

describe('AbacusCounting', () => {
  let component: AbacusCounting;
  let fixture: ComponentFixture<AbacusCounting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbacusCounting]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbacusCounting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
