import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfxHelper } from './dfx-helper';

describe('DfxHelper', () => {
  let component: DfxHelper;
  let fixture: ComponentFixture<DfxHelper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfxHelper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DfxHelper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
