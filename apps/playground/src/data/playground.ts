export type PlaygroundProject = {
  title: string;
  text: string;
  href: string;
};

export const projects: PlaygroundProject[] = [
  {
    title: 'dfx-bootstrap-table',
    text: 'Angular table CDK implementation for Bootstrap with filtering, sorting and pagination.',
    href: 'bootstrap-table',
  },
  {
    title: 'dfx-qrcode',
    text: 'dfx-qrcode is a tiny and simple-to-use Angular QR-Code generator library.',
    href: 'qrcode',
  },
  {
    title: 'dfx-transloco-markup',
    text: 'A translation component to render translations with markup',
    href: 'transloco-markup',
  },
  {
    title: 'dfx-theme',
    text: 'dfx-theme is a tiny and simple-to-use Angular Theme management library.',
    href: 'theme',
  },
  {
    title: 'dfx-opa',
    text: 'Angular services, directives and guards for frontend authorization based on @open-policy-agent/opa.',
    href: 'opa',
  },
];
