export type PlaygroundCodeSnippetLanguage = 'angular-html' | 'typescript' | 'json';

export interface PlaygroundCodeSnippetFile {
  id: string;
  label: string;
  filename: string;
  lang: PlaygroundCodeSnippetLanguage;
  code: string;
}
