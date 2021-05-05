import { TestBed } from '@angular/core/testing';

import { JudgementService } from './judgement.service';

describe('JudgementService', () => {
  let service: JudgementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JudgementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
