export type PlaygroundCodeSnippetLanguage = 'angular-html' | 'angular-ts' | 'typescript' | 'json';

export interface PlaygroundCodeSnippetFile {
  id: string;
  filename: string;
  lang: PlaygroundCodeSnippetLanguage;
  code: string;
}
