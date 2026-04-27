import { Directive, EmbeddedViewRef, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

@Directive({
  selector: '[opaIf]',
})
export class OpaIf<T = unknown> {
  private _context: OpaIfContext<T> = new OpaIfContext<T>();

  private _elseTemplateRef: TemplateRef<OpaIfContext<T>> | null = null;
  private _loadingTemplateRef: TemplateRef<OpaIfContext<T>> | null = null;

  private _thenViewRef: EmbeddedViewRef<OpaIfContext<T>> | null = null;
  private _elseViewRef: EmbeddedViewRef<OpaIfContext<T>> | null = null;
  private _loadingViewRef: EmbeddedViewRef<OpaIfContext<T>> | null = null;

  private _isLoading = false;

  private readonly _viewContainer = inject(ViewContainerRef);

  private _thenTemplateRef: TemplateRef<OpaIfContext<T>> | null = inject<TemplateRef<OpaIfContext<T>>>(TemplateRef);

  @Input()
  set opaIf(condition: T) {
    this._context.$implicit = this._context.opaIf = condition;
    this._updateView();
  }

  @Input()
  set opaIfThen(templateRef: TemplateRef<OpaIfContext<T>> | null) {
    assertTemplate(templateRef, (typeof ngDevMode === 'undefined' || ngDevMode) && 'opaIfThen');
    this._thenTemplateRef = templateRef;
    this._thenViewRef = null;
    this._updateView();
  }

  @Input()
  set opaIfElse(templateRef: TemplateRef<OpaIfContext<T>> | null) {
    assertTemplate(templateRef, (typeof ngDevMode === 'undefined' || ngDevMode) && 'opaIfElse');
    this._elseTemplateRef = templateRef;
    this._elseViewRef = null;
    this._updateView();
  }

  @Input()
  set opaIfLoading(templateRef: TemplateRef<OpaIfContext<T>> | null) {
    assertTemplate(templateRef, (typeof ngDevMode === 'undefined' || ngDevMode) && 'opaIfLoading');
    this._loadingTemplateRef = templateRef;
    this._loadingViewRef = null;
    this._updateView();
  }

  @Input()
  set opaIfLoadingState(isLoading: boolean) {
    this._isLoading = isLoading;
    this._updateView();
  }

  private _clearViews() {
    this._viewContainer.clear();
    this._thenViewRef = null;
    this._elseViewRef = null;
    this._loadingViewRef = null;
  }

  private _updateView() {
    if (this._isLoading) {
      if (!this._loadingViewRef) {
        this._clearViews();

        if (this._loadingTemplateRef) {
          this._loadingViewRef = this._viewContainer.createEmbeddedView(this._loadingTemplateRef, this._context);
        }
      }

      return;
    }

    if (this._context.$implicit) {
      if (!this._thenViewRef) {
        this._clearViews();

        if (this._thenTemplateRef) {
          this._thenViewRef = this._viewContainer.createEmbeddedView(this._thenTemplateRef, this._context);
        }
      }
    } else {
      if (!this._elseViewRef) {
        this._clearViews();

        if (this._elseTemplateRef) {
          this._elseViewRef = this._viewContainer.createEmbeddedView(this._elseTemplateRef, this._context);
        }
      }
    }
  }

  public static opaIfUseIfTypeGuard: void;
  static ngTemplateGuard_opaIf: 'binding';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static ngTemplateContextGuard<T>(dir: OpaIf<T>, ctx: unknown): ctx is OpaIfContext<Exclude<T, false | 0 | '' | null | undefined>> {
    return true;
  }
}

export class OpaIfContext<T = unknown> {
  public $implicit: T = null!;
  public opaIf: T = null!;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertTemplate(templateRef: TemplateRef<any> | null, property: string | false | null): void {
  if (templateRef && !templateRef.createEmbeddedView) {
    console.error(`${property} must be a TemplateRef.`);
  }
}
