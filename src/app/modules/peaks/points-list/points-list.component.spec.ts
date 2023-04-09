import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsListComponent } from './points-list.component';

describe('PointsListComponent', () => {
  let component: PointsListComponent;
  let fixture: ComponentFixture<PointsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PointsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
