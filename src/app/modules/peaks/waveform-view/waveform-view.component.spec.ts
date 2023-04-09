import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveformViewComponent } from './waveform-view.component';

describe('WaveformViewComponent', () => {
  let component: WaveformViewComponent;
  let fixture: ComponentFixture<WaveformViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaveformViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaveformViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
