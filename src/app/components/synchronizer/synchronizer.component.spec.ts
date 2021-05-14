import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SynchronizerComponent } from './synchronizer.component';

describe('SynchronizerComponent', () => {
  let component: SynchronizerComponent;
  let fixture: ComponentFixture<SynchronizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SynchronizerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SynchronizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
