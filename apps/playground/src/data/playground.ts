export type PlaygroundProject = {
  title: string;
  text: string;
  href: string;
};

export type PlaygroundVariant = {
  label: string;
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
    text: 'Tiny and simple-to-use Angular QR-Code generator library.',
    href: 'qrcode',
  },
  {
    title: 'dfx-transloco-markup',
    text: 'A translation component to render translations with markup',
    href: 'transloco-markup',
  },
  {
    title: 'dfx-theme',
    text: 'Tiny and simple-to-use Angular Theme management library.',
    href: 'theme',
  },
  {
    title: 'dfx-opa',
    text: 'Angular services and directives for frontend authorization based on @open-policy-agent/opa',
    href: 'opa',
  },
];

export const variants: PlaygroundVariant[] = [
  { label: 'Original', href: '/' },
  { label: '1', href: '/1/' },
  { label: '2', href: '/2/' },
  { label: '3', href: '/3/' },
  { label: '4', href: '/4/' },
  { label: '5', href: '/5/' },
];
