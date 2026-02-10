/**
 * @license
 * Original work Copyright Google LLC All Rights Reserved.
 * Modified work Copyright DatePoll-Systems
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  CDK_TABLE,
  CdkTable,
  DataRowOutlet,
  FooterRowOutlet,
  HeaderRowOutlet,
  NoDataRowOutlet,
  STICKY_POSITIONING_LISTENER,
} from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation, booleanAttribute } from '@angular/core';

/**
 * Wrapper for the CdkTable with Bootstrap styles.
 */
@Component({
  selector: 'ngb-table, table[ngb-table]',
  exportAs: 'ngbTable',
  // Note that according to MDN, the `caption` element has to be projected as the **first**
  // element in the table. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
  // We can't reuse `CDK_TABLE_TEMPLATE` because it's incompatible with local compilation mode.
  template: `
    <ng-content select="caption" />
    <ng-content select="colgroup, col" />

    <!--
      Unprojected content throws a hydration error so we need this to capture it.
      It gets removed on the client so it doesn't affect the layout.
    -->
    @if (_isServer) {
      <ng-content />
    }

    @if (_isNativeHtmlTable) {
      <thead role="rowgroup">
        <ng-container headerRowOutlet />
      </thead>
      <tbody class="mdc-data-table__content" role="rowgroup">
        <ng-container rowOutlet />
        <ng-container noDataRowOutlet />
      </tbody>
      <tfoot role="rowgroup">
        <ng-container footerRowOutlet />
      </tfoot>
    } @else {
      <ng-container headerRowOutlet />
      <ng-container rowOutlet />
      <ng-container noDataRowOutlet />
      <ng-container footerRowOutlet />
    }
  `,
  providers: [
    { provide: CdkTable, useExisting: NgbTable },
    { provide: CDK_TABLE, useExisting: NgbTable },
    // Prevent nested tables from seeing this table's StickyPositioningListener.
    { provide: STICKY_POSITIONING_LISTENER, useValue: null },
  ],
  encapsulation: ViewEncapsulation.None,
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [HeaderRowOutlet, DataRowOutlet, NoDataRowOutlet, FooterRowOutlet],
})
export class NgbTable<T> extends CdkTable<T> {
  /** Overrides the need to add position: sticky on every sticky cell element in `CdkTable`. */
  protected override needsPositionStickyOnElement = false;

  @HostBinding('class.cdk-table')
  cdkTable = true;

  @HostBinding('class.table')
  table = true;

  @HostBinding('class.table-hover')
  @Input({ transform: booleanAttribute })
  hover = false;

  @HostBinding('class.table-striped')
  @Input({ transform: booleanAttribute })
  striped = false;
}
