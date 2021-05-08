import { TestBed } from '@angular/core/testing';

import { SimfileLoaderService } from './simfile-loader.service';

describe('SimfileLoaderService', () => {
  let service: SimfileLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimfileLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
