export interface CaseStudy {
  tag: string
  title: string
  body: string[]
}

export const caseStudies: CaseStudy[] = [
  {
    tag: 'Scale & Reliability',
    title: 'Distributed Payment System at Scale',
    body: [
      'Collaborate on a distributed payment system processing billions of dollars in throughput.',
      'Own 3 of 16+ services within that system.',
      'Currently leading the migration of ~200 legacy stored procedures and procedural logic into ~20 AWS-native microservices.',
    ],
  },
  {
    tag: 'AI Tooling / Org-wide Adoption',
    title: 'Agentic AI & SDLC Automation Rollout',
    body: [
      'Built and deployed a secure internal "caveman-mode" wrapper for AI coding agents, adopted by 120 engineers org-wide.',
      'Designed pipeline auto-wiring of environment variables into agentic harnesses, including a security rule blocking token/credential pass-through into Claude.',
      'Built a GitLab CLI (glab) connectivity harness enabling agents to interact with the org’s GitLab instance.',
      'Rewrote database documentation to materially improve AI retrieval accuracy for schema-aware tasks.',
    ],
  },
  {
    tag: 'ROI & Leadership',
    title: 'Data-Cleanliness Initiative',
    body: [
      'Led a data-cleanliness initiative that would have cost ~$150K in manual labor if done by hand.',
      'Saved more than 2,000 employee hours.',
      'Delivered on schedule and to spec.',
    ],
  },
]
