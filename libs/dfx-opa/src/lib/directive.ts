import { Directive, effect, inject, input } from '@angular/core';

import { Input } from '@open-policy-agent/opa';

import { AUTHZ_OPTIONS, AuthzOptions } from './config';
import { OpaIf } from './opa-if';
import { useAuthz } from './useAuthz';

@Directive({
  selector: '[authz]',
  hostDirectives: [
    {
      directive: OpaIf,
      inputs: ['opaIfElse: authzElse', 'opaIfLoading: authzLoading'],
    },
  ],
})
export class AuthzDirective {
  private readonly ngIfDirective = inject(OpaIf);
  private readonly authzOptions = inject(AUTHZ_OPTIONS);

  public readonly path = input<string>(undefined, {
    alias: 'authz',
  });
  public readonly input = input<Input>(undefined, {
    alias: 'authzInput',
  });
  public readonly fromResult = input<AuthzOptions['defaultFromResult']>(this.authzOptions.defaultFromResult, {
    alias: 'authzFromResult',
  });

  private readonly authzResult = useAuthz({
    path: this.path,
    input: this.input,
    fromResult: this.fromResult(),
  });

  constructor() {
    effect(() => {
      const isLoading = this.authzResult.isLoading();

      this.ngIfDirective.opaIfLoadingState = isLoading;

      if (!isLoading) {
        this.ngIfDirective.opaIf = this.authzResult.hasValue() ? this.authzResult.value() : undefined;
      }
    });
  }
}
