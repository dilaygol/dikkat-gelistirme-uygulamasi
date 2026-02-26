import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrafficSignMatching } from './traffic-sign-matching';

describe('TrafficSignMatching', () => {
  let component: TrafficSignMatching;
  let fixture: ComponentFixture<TrafficSignMatching>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrafficSignMatching]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrafficSignMatching);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
