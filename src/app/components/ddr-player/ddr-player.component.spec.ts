import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DdrPlayerComponent } from './ddr-player.component';

describe('DdrPlayerComponent', () => {
  let component: DdrPlayerComponent;
  let fixture: ComponentFixture<DdrPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DdrPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DdrPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
