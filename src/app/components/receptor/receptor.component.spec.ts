import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptorComponent } from './receptor.component';

describe('ReceptorComponent', () => {
  let component: ReceptorComponent;
  let fixture: ComponentFixture<ReceptorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceptorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceptorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
