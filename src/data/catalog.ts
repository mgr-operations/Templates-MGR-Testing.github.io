import { Product } from '../types/store';

export const BUNDLE_DISCOUNT_THRESHOLD = 300;

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'operations-hq',
    slug: 'operations-hq',
    name: 'Operations HQ',
    category: 'Operations',
    price: 149,
    shortDescription:
      'A central operating system for recurring work, process ownership and team visibility.',
    description:
      'Built from our core ClickUp implementation framework. Consolidates department KPIs, recurring SOPs, weekly meeting agendas, and executive workload views into one structured workspace.',
    includes: 'ClickUp space template · 14 SOP docs · Loom setup walkthrough',
    platform: 'ClickUp 3.0 & 4.0',
    leadTime: 'Instant workspace link + PDF setup guide',
    coverEyebrow: 'Operations',
    coverTitle: 'HQ',
    coverTone: 'operations',
    variants: [
      {
        id: 'ops-hq-team',
        sku: 'MGR-OPS-TM',
        name: 'Team License (Up to 15 seats)',
        swatchHex: '#c9a24b',
        stock: 9,
      },
      {
        id: 'ops-hq-guided',
        sku: 'MGR-OPS-GD',
        name: 'Agency + 60m Onboarding Call',
        swatchHex: '#1c1c1c',
        stock: 2,
        priceDelta: 150,
      },
    ],
  },
  {
    id: 'sales-pipeline',
    slug: 'sales-pipeline',
    name: 'Sales Pipeline',
    category: 'Sales',
    price: 129,
    shortDescription:
      'A structured pipeline for leads, follow-ups, handoffs and sales activity visibility.',
    description:
      'Turn scattered spreadsheets and inbox threads into a disciplined revenue pipeline. Includes automated follow-up reminders, qualification scoring, and a clean sales-to-delivery handoff trigger.',
    includes: 'ClickUp CRM folder · Email templates · Deal stage automations',
    platform: 'ClickUp 3.0 & 4.0',
    leadTime: 'Instant workspace link + PDF setup guide',
    coverEyebrow: 'Sales',
    coverTitle: 'Pipeline',
    coverTone: 'sales',
    variants: [
      {
        id: 'sales-pipe-team',
        sku: 'MGR-SLS-TM',
        name: 'Team License (Up to 15 seats)',
        swatchHex: '#c9a24b',
        stock: 11,
      },
      {
        id: 'sales-pipe-guided',
        sku: 'MGR-SLS-GD',
        name: 'Agency + CRM Migration Guide',
        swatchHex: '#1c1c1c',
        stock: 3,
        priceDelta: 120,
      },
    ],
  },
  {
    id: 'client-delivery',
    slug: 'client-delivery',
    name: 'Client Delivery',
    category: 'Delivery',
    price: 169,
    shortDescription:
      'A repeatable client delivery workspace for onboarding, milestones, approvals and reporting.',
    description:
      'Standardize how every new client enters your business. Features client-ready portal views, milestone approval gates, retainer hour tracking, and automated status digests.',
    includes: 'ClickUp delivery space · Client portal views · Onboarding checklist',
    platform: 'ClickUp 3.0 & 4.0',
    leadTime: 'Instant workspace link + PDF setup guide',
    coverEyebrow: 'Client',
    coverTitle: 'Delivery',
    coverTone: 'delivery',
    variants: [
      {
        id: 'client-del-team',
        sku: 'MGR-DLV-TM',
        name: 'Team License (Up to 15 seats)',
        swatchHex: '#c9a24b',
        stock: 6,
      },
      {
        id: 'client-del-guided',
        sku: 'MGR-DLV-GD',
        name: 'Agency + Portal Customization',
        swatchHex: '#1c1c1c',
        stock: 1,
        priceDelta: 160,
      },
    ],
  },
  {
    id: 'executive-kpi-rhythm',
    slug: 'executive-kpi-rhythm',
    name: 'Executive KPI Rhythm',
    category: 'Operations',
    price: 119,
    shortDescription:
      'Leadership scorecard, quarterly OKR rollups, and structured L10 weekly meeting cadences.',
    description:
      'Give founders and department leads an unvarnished view of weekly numbers, quarterly rocks, and stalled blockers without manual slide-deck reporting.',
    includes: 'Scorecard list · OKR dashboard · Weekly L10 agenda doc',
    platform: 'ClickUp 3.0 & 4.0',
    leadTime: 'Instant workspace link + PDF setup guide',
    coverEyebrow: 'Leadership',
    coverTitle: 'Scorecard',
    coverTone: 'operations',
    variants: [
      {
        id: 'kpi-rhythm-team',
        sku: 'MGR-KPI-TM',
        name: 'Team License (Up to 15 seats)',
        swatchHex: '#c9a24b',
        stock: 14,
      },
      {
        id: 'kpi-rhythm-exec',
        sku: 'MGR-KPI-EX',
        name: 'Multi-Department Suite',
        swatchHex: '#1c1c1c',
        stock: 0,
        priceDelta: 90,
      },
    ],
  },
  {
    id: 'sop-onboarding-vault',
    slug: 'sop-onboarding-vault',
    name: 'SOP & Onboarding Vault',
    category: 'Delivery',
    price: 99,
    shortDescription:
      'Role-indexed standard operating procedure library with 30-60-90 day hire tracks.',
    description:
      'Capture institutional knowledge once and reuse it for every new hire. Pre-structured folders by department with review dates, process owners, and training checklists.',
    includes: 'SOP Doc hub · 30-60-90 checklist · Ownership matrix',
    platform: 'ClickUp 3.0 & 4.0',
    leadTime: 'Instant workspace link + PDF setup guide',
    coverEyebrow: 'Knowledge',
    coverTitle: 'SOP Vault',
    coverTone: 'delivery',
    variants: [
      {
        id: 'sop-vault-team',
        sku: 'MGR-SOP-TM',
        name: 'Team License (Up to 15 seats)',
        swatchHex: '#c9a24b',
        stock: 8,
      },
      {
        id: 'sop-vault-guided',
        sku: 'MGR-SOP-GD',
        name: 'Agency + SOP Audit Checklist',
        swatchHex: '#1c1c1c',
        stock: 4,
        priceDelta: 80,
      },
    ],
  },
  {
    id: 'ai-automation-ops-pack',
    slug: 'ai-automation-ops-pack',
    name: 'AI & Automation Pack',
    category: 'Automation',
    price: 189,
    shortDescription:
      'Production-ready Make, Zapier, and ClickUp automation blueprints for intake and reporting.',
    description:
      'Eliminate repetitive copy-paste work between forms, Slack, CRM deals, and ClickUp tasks. Includes JSON scenario blueprints and prompt templates for weekly summaries.',
    includes: '6 Make/Zapier blueprints · ClickUp AI prompts · Video walkthrough',
    platform: 'ClickUp + Make / Zapier',
    leadTime: 'Instant blueprint archive + setup guide',
    coverEyebrow: 'Automation',
    coverTitle: 'AI Ops',
    coverTone: 'sales',
    variants: [
      {
        id: 'ai-ops-team',
        sku: 'MGR-AUT-TM',
        name: 'Standard Blueprint Pack',
        swatchHex: '#c9a24b',
        stock: 5,
      },
      {
        id: 'ai-ops-guided',
        sku: 'MGR-AUT-GD',
        name: 'Blueprint Pack + Integration Review',
        swatchHex: '#1c1c1c',
        stock: 2,
        priceDelta: 140,
      },
    ],
  },
];
