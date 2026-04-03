import { Directive, effect, inject, input } from '@angular/core';

import { Input } from '@open-policy-agent/opa';

import { AuthzOptions } from './config';
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
  private readonly opaIf = inject(OpaIf);

  public readonly path = input<string>(undefined, {
    alias: 'authz',
  });
  public readonly input = input<Input>(undefined, {
    alias: 'authzInput',
  });
  public readonly fromResult = input<AuthzOptions['defaultFromResult']>(undefined, {
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

      this.opaIf.opaIfLoadingState = isLoading;

      if (!isLoading) {
        this.opaIf.opaIf = this.authzResult.hasValue() ? this.authzResult.value() : undefined;
      }
    });
  }
}
