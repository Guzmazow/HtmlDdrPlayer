import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgementComponent } from './judgement.component';

describe('JudgementComponent', () => {
  let component: JudgementComponent;
  let fixture: ComponentFixture<JudgementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JudgementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
