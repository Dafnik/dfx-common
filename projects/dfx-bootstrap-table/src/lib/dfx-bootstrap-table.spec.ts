import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfxBootstrapTable } from './dfx-bootstrap-table';

describe('DfxBootstrapTable', () => {
  let component: DfxBootstrapTable;
  let fixture: ComponentFixture<DfxBootstrapTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfxBootstrapTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DfxBootstrapTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
