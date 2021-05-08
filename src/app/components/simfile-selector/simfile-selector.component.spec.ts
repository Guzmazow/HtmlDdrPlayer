import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimfileSelectorComponent } from './simfile-selector.component';

describe('SimfileSelectorComponent', () => {
  let component: SimfileSelectorComponent;
  let fixture: ComponentFixture<SimfileSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimfileSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimfileSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
