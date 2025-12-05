import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DfxQrcode } from './dfx-qrcode';

describe('DfxQrcode', () => {
  let component: DfxQrcode;
  let fixture: ComponentFixture<DfxQrcode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DfxQrcode],
    }).compileComponents();

    fixture = TestBed.createComponent(DfxQrcode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
