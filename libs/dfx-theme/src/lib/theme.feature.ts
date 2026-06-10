import { Provider } from '@angular/core';

export enum ThemeFeatureKind {
  CONFIG,
  STORAGE,
  STRATEGIES,
  SERVICE,
}

declare interface ThemeFeature<KindT extends ThemeFeatureKind> {
  kind: KindT;
  providers: Provider[];
}

export declare type ThemeConfigFeature = ThemeFeature<ThemeFeatureKind.CONFIG>;
export declare type ThemeStorageFeature = ThemeFeature<ThemeFeatureKind.STORAGE>;
export declare type ThemeStrategiesFeature = ThemeFeature<ThemeFeatureKind.STRATEGIES>;
export declare type ThemeServiceFeature = ThemeFeature<ThemeFeatureKind.SERVICE>;

export declare type ThemeFeatures = ThemeConfigFeature | ThemeStorageFeature | ThemeStrategiesFeature | ThemeServiceFeature;
