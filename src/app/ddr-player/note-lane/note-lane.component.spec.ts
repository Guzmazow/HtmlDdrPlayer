import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteLaneComponent } from './note-lane.component';

describe('NoteLaneComponent', () => {
  let component: NoteLaneComponent;
  let fixture: ComponentFixture<NoteLaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoteLaneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteLaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
