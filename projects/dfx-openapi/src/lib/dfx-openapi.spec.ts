import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfxOpenapi } from './dfx-openapi';

describe('DfxOpenapi', () => {
  let component: DfxOpenapi;
  let fixture: ComponentFixture<DfxOpenapi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfxOpenapi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DfxOpenapi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
