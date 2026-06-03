// =============================================================================
// DEMO SEED — realistic but entirely FAKE data.
// =============================================================================
// Everyone and everything here is invented so the suite is fully interactive
// out of the box. This file is the ONLY place demo content lives. To go live,
// replace this with an import from your real source of truth (Jira/Linear/CSV/
// an API) that writes the same models — the app code never changes.
//
// Run: npm run db:seed   (or npm run db:reset to wipe + reseed)
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Relative-date helpers (everything is anchored to "now") ---------------
const now = new Date();
const day = 1000 * 60 * 60 * 24;
const daysAgo = (n: number) => new Date(now.getTime() - n * day);
const daysFromNow = (n: number) => new Date(now.getTime() + n * day);

type TaskSpec = {
  title: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignee?: string;
  effort?: number;
  dueInDays?: number; // negative = overdue
  completedDaysAgo?: number; // for DONE tasks → drives velocity
  staleDays?: number; // backdate updatedAt → drives "stale" signal
};

async function main() {
  console.log("🌱 Resetting demo data…");
  // Order matters for FK constraints.
  await prisma.checkIn.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.member.deleteMany();
  await prisma.team.deleteMany();
  await prisma.company.deleteMany();

  // ---- Company -------------------------------------------------------------
  await prisma.company.create({
    data: {
      id: "company",
      name: "Northwind",
      mission:
        "Help operations teams run their business on one source of truth — fast, reliable, and loved.",
      period: "Q3 2026",
    },
  });

  // ---- Teams ---------------------------------------------------------------
  const teamDefs = [
    { slug: "product", name: "Product", color: "#14b8a6", lead: "Priya Natarajan" },
    { slug: "engineering", name: "Engineering", color: "#6366f1", lead: "Marcus Lee" },
    { slug: "design", name: "Design", color: "#ec4899", lead: "Sofia Alvarez" },
    { slug: "marketing", name: "Marketing", color: "#f97316", lead: "Dani Brooks" },
    { slug: "data", name: "Data", color: "#8b5cf6", lead: "Owen Fitzgerald" },
  ];
  const teams: Record<string, string> = {};
  for (const t of teamDefs) {
    const created = await prisma.team.create({ data: t });
    teams[t.slug] = created.id;
  }

  // ---- Members (fake people) ----------------------------------------------
  const memberDefs: {
    name: string;
    email: string;
    role: string;
    team: string;
    avatar: string;
  }[] = [
    { name: "Priya Natarajan", email: "priya@northwind.test", role: "Head of Product", team: "product", avatar: "🦅" },
    { name: "Jordan Park", email: "jordan@northwind.test", role: "Senior PM", team: "product", avatar: "🧭" },
    { name: "Aisha Mohammed", email: "aisha@northwind.test", role: "PM, Growth", team: "product", avatar: "🌱" },
    { name: "Marcus Lee", email: "marcus@northwind.test", role: "Eng Director", team: "engineering", avatar: "⚙️" },
    { name: "Wei Chen", email: "wei@northwind.test", role: "Staff Engineer", team: "engineering", avatar: "🛠️" },
    { name: "Tomás Rivera", email: "tomas@northwind.test", role: "Senior Engineer", team: "engineering", avatar: "🚀" },
    { name: "Hannah Kim", email: "hannah@northwind.test", role: "Engineer", team: "engineering", avatar: "💡" },
    { name: "Sofia Alvarez", email: "sofia@northwind.test", role: "Design Lead", team: "design", avatar: "🎨" },
    { name: "Liam O'Brien", email: "liam@northwind.test", role: "Product Designer", team: "design", avatar: "✏️" },
    { name: "Dani Brooks", email: "dani@northwind.test", role: "Head of Marketing", team: "marketing", avatar: "📣" },
    { name: "Noah Schwartz", email: "noah@northwind.test", role: "Growth Marketer", team: "marketing", avatar: "📈" },
    { name: "Owen Fitzgerald", email: "owen@northwind.test", role: "Data Lead", team: "data", avatar: "📊" },
  ];
  // name -> member id, so projects can reference owners & point people.
  const members: Record<string, string> = {};
  for (const m of memberDefs) {
    const created = await prisma.member.create({
      data: {
        name: m.name,
        email: m.email,
        role: m.role,
        avatar: m.avatar,
        teamId: teams[m.team],
      },
    });
    members[m.name] = created.id;
  }

  // ---- Initiatives + outcomes + projects -----------------------------------
  // Each initiative carries success metrics (outcomes) the whole company can
  // read, plus delivery projects that ladder up to it.

  let order = 0;
  const staleUpdates: { id: string; days: number }[] = [];

  async function createProject(
    initiativeId: string,
    p: {
      name: string;
      team: string;
      lead: string;
      impact: string;
      description?: string;
      status?: string;
      health: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
      targetInDays?: number;
      startedDaysAgo?: number;
      // The single accountable owner (DRI), by member name.
      owner: string;
      // Cross-functional teams involved. The owning team is added automatically
      // as ACCOUNTABLE (with the owner as its point person) if not listed here.
      contributors?: {
        team: string;
        pointPerson?: string;
        responsibility?:
          | "ACCOUNTABLE"
          | "RESPONSIBLE"
          | "CONTRIBUTING"
          | "CONSULTED"
          | "INFORMED";
      }[];
      tasks: TaskSpec[];
      milestones: { name: string; dueInDays: number; status?: string }[];
    },
  ) {
    const project = await prisma.project.create({
      data: {
        name: p.name,
        description: p.description,
        impact: p.impact,
        status: p.status ?? "ACTIVE",
        health: p.health,
        lead: p.lead,
        ownerId: members[p.owner],
        teamId: teams[p.team],
        initiativeId,
        startDate: daysAgo(p.startedDaysAgo ?? 40),
        targetDate: p.targetInDays != null ? daysFromNow(p.targetInDays) : null,
      },
    });

    // Ensure the owning team is represented as ACCOUNTABLE, then layer on any
    // additional cross-functional contributors.
    const contribs = [...(p.contributors ?? [])];
    if (!contribs.some((c) => c.team === p.team)) {
      contribs.unshift({
        team: p.team,
        pointPerson: p.owner,
        responsibility: "ACCOUNTABLE",
      });
    }
    for (const c of contribs) {
      await prisma.projectContributor.create({
        data: {
          projectId: project.id,
          teamId: teams[c.team],
          pointPersonId: c.pointPerson ? members[c.pointPerson] : null,
          responsibility: c.responsibility ?? "CONTRIBUTING",
        },
      });
    }

    for (const t of p.tasks) {
      const created = await prisma.task.create({
        data: {
          title: t.title,
          status: t.status,
          priority: t.priority ?? "MEDIUM",
          assignee: t.assignee,
          effort: t.effort ?? 3,
          projectId: project.id,
          dueDate: t.dueInDays != null ? daysFromNow(t.dueInDays) : null,
          completedAt:
            t.status === "DONE" && t.completedDaysAgo != null
              ? daysAgo(t.completedDaysAgo)
              : null,
        },
      });
      if (t.staleDays) staleUpdates.push({ id: created.id, days: t.staleDays });
    }

    for (const m of p.milestones) {
      await prisma.milestone.create({
        data: {
          name: m.name,
          status: m.status ?? "UPCOMING",
          dueDate: daysFromNow(m.dueInDays),
          projectId: project.id,
        },
      });
    }
    return project;
  }

  // --- Initiative 1: Land Enterprise ---------------------------------------
  const enterprise = await prisma.initiative.create({
    data: {
      name: "Land Enterprise",
      description:
        "Make Northwind a credible choice for 500+ seat customers by closing the security, identity, and onboarding gaps that block large deals.",
      rationale:
        "Enterprise is the company's largest revenue lever this year; three deals are gated on SSO and SOC 2.",
      status: "ACTIVE",
      health: "AT_RISK",
      owner: "Jordan Park",
      order: order++,
      targetDate: daysFromNow(70),
    },
  });
  await prisma.outcome.createMany({
    data: [
      { initiativeId: enterprise.id, teamId: teams.product, name: "Enterprise ARR", metricType: "CURRENCY", unit: "$", baseline: 1200000, current: 1650000, target: 3000000 },
      { initiativeId: enterprise.id, teamId: teams.product, name: "New enterprise logos", metricType: "NUMBER", unit: "logos", baseline: 8, current: 11, target: 20 },
      { initiativeId: enterprise.id, teamId: teams.engineering, name: "SSO / SAML shipped", metricType: "BOOLEAN", baseline: 0, current: 0, target: 1 },
    ],
  });
  await createProject(enterprise.id, {
    name: "SSO & SCIM provisioning",
    team: "engineering",
    lead: "Wei Chen",
    owner: "Wei Chen",
    contributors: [
      { team: "product", pointPerson: "Jordan Park", responsibility: "CONSULTED" },
      { team: "design", pointPerson: "Liam O'Brien", responsibility: "CONTRIBUTING" },
    ],
    impact: "Unblocks 3 gated enterprise deals worth ~$900K ARR by supporting SAML login and automated user provisioning.",
    health: "AT_RISK",
    targetInDays: 21,
    startedDaysAgo: 35,
    tasks: [
      { title: "SAML auth flow", status: "DONE", priority: "HIGH", assignee: "Wei Chen", effort: 8, completedDaysAgo: 3 },
      { title: "SCIM user provisioning API", status: "IN_PROGRESS", priority: "HIGH", assignee: "Hannah Kim", effort: 8, dueInDays: 6 },
      { title: "IdP integration tests (Okta, Entra)", status: "BLOCKED", priority: "URGENT", assignee: "Hannah Kim", effort: 5, dueInDays: -2 },
      { title: "Admin SSO settings UI", status: "TODO", priority: "MEDIUM", assignee: "Liam O'Brien", effort: 3, dueInDays: 9 },
      { title: "Security review sign-off", status: "TODO", priority: "HIGH", effort: 2, dueInDays: 14 },
    ],
    milestones: [
      { name: "SSO beta with design partner", dueInDays: 10 },
      { name: "GA release", dueInDays: 21 },
    ],
  });
  await createProject(enterprise.id, {
    name: "SOC 2 Type II readiness",
    team: "engineering",
    lead: "Marcus Lee",
    owner: "Marcus Lee",
    contributors: [
      { team: "product", pointPerson: "Jordan Park", responsibility: "INFORMED" },
    ],
    impact: "Removes the #1 procurement blocker for regulated buyers; required by 6 of 9 open enterprise opportunities.",
    health: "ON_TRACK",
    targetInDays: 55,
    startedDaysAgo: 60,
    tasks: [
      { title: "Gap assessment with auditor", status: "DONE", priority: "HIGH", effort: 5, completedDaysAgo: 12 },
      { title: "Access-control policy rollout", status: "DONE", priority: "MEDIUM", effort: 3, completedDaysAgo: 5 },
      { title: "Centralized audit logging", status: "IN_PROGRESS", priority: "HIGH", assignee: "Tomás Rivera", effort: 8, dueInDays: 12 },
      { title: "Vendor risk reviews", status: "TODO", priority: "LOW", effort: 2, dueInDays: 30, staleDays: 14 },
    ],
    milestones: [
      { name: "Observation window starts", dueInDays: 14 },
      { name: "Auditor report", dueInDays: 55 },
    ],
  });
  await createProject(enterprise.id, {
    name: "Enterprise onboarding revamp",
    team: "product",
    lead: "Jordan Park",
    owner: "Jordan Park",
    contributors: [
      { team: "design", pointPerson: "Liam O'Brien", responsibility: "CONTRIBUTING" },
      { team: "engineering", pointPerson: "Hannah Kim", responsibility: "CONTRIBUTING" },
    ],
    impact: "Cuts white-glove onboarding from 6 weeks to 2, raising the number of enterprise accounts a CSM can land per quarter.",
    health: "ON_TRACK",
    targetInDays: 40,
    tasks: [
      { title: "Map current onboarding journey", status: "DONE", priority: "MEDIUM", effort: 3, completedDaysAgo: 9 },
      { title: "Define rollout playbook templates", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "Aisha Mohammed", effort: 5, dueInDays: 8 },
      { title: "Bulk import & sandbox tooling", status: "TODO", priority: "HIGH", effort: 5, dueInDays: 20 },
    ],
    milestones: [{ name: "Pilot with 2 accounts", dueInDays: 25 }],
  });

  // --- Initiative 2: Activation & Growth -----------------------------------
  const activation = await prisma.initiative.create({
    data: {
      name: "Activation & Growth",
      description:
        "Get more new teams to their first 'aha' faster, and keep them coming back weekly.",
      rationale:
        "Self-serve activation is the cheapest growth lever and compounds into expansion revenue.",
      status: "ACTIVE",
      health: "ON_TRACK",
      owner: "Aisha Mohammed",
      order: order++,
      targetDate: daysFromNow(60),
    },
  });
  await prisma.outcome.createMany({
    data: [
      { initiativeId: activation.id, teamId: teams.product, name: "Activation rate", metricType: "PERCENT", unit: "%", baseline: 34, current: 41, target: 55 },
      { initiativeId: activation.id, teamId: teams.design, name: "Time to first value", metricType: "NUMBER", unit: "min", baseline: 28, current: 19, target: 10, higherIsBetter: false },
      { initiativeId: activation.id, teamId: teams.data, name: "Weekly active teams", metricType: "NUMBER", unit: "teams", baseline: 2100, current: 2480, target: 3200 },
    ],
  });
  await createProject(activation.id, {
    name: "Onboarding redesign",
    team: "design",
    lead: "Sofia Alvarez",
    owner: "Sofia Alvarez",
    contributors: [
      { team: "engineering", pointPerson: "Hannah Kim", responsibility: "RESPONSIBLE" },
      { team: "product", pointPerson: "Aisha Mohammed", responsibility: "CONSULTED" },
      { team: "data", pointPerson: "Owen Fitzgerald", responsibility: "CONSULTED" },
    ],
    impact: "A guided, role-aware setup that gets new teams to first value in under 10 minutes — directly moves activation rate.",
    health: "ON_TRACK",
    targetInDays: 18,
    tasks: [
      { title: "Usability test current flow", status: "DONE", priority: "HIGH", effort: 3, completedDaysAgo: 4 },
      { title: "New setup wizard designs", status: "DONE", priority: "HIGH", assignee: "Liam O'Brien", effort: 5, completedDaysAgo: 2 },
      { title: "Build wizard front-end", status: "IN_PROGRESS", priority: "HIGH", assignee: "Hannah Kim", effort: 8, dueInDays: 7 },
      { title: "Instrument funnel events", status: "TODO", priority: "MEDIUM", assignee: "Owen Fitzgerald", effort: 3, dueInDays: 12 },
    ],
    milestones: [{ name: "Ship to 50% A/B", dueInDays: 14 }],
  });
  await createProject(activation.id, {
    name: "Lifecycle email program",
    team: "marketing",
    lead: "Noah Schwartz",
    owner: "Noah Schwartz",
    contributors: [
      { team: "engineering", pointPerson: "Hannah Kim", responsibility: "CONTRIBUTING" },
      { team: "product", pointPerson: "Aisha Mohammed", responsibility: "CONSULTED" },
    ],
    impact: "Behavior-triggered emails that pull stalled new teams back into setup — recovers otherwise-lost activations.",
    health: "ON_TRACK",
    targetInDays: 25,
    tasks: [
      { title: "Define lifecycle journey map", status: "DONE", priority: "MEDIUM", effort: 3, completedDaysAgo: 6 },
      { title: "Write 6 onboarding emails", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "Noah Schwartz", effort: 5, dueInDays: 10 },
      { title: "Wire triggers to product events", status: "TODO", priority: "MEDIUM", effort: 5, dueInDays: 18 },
    ],
    milestones: [{ name: "First send", dueInDays: 20 }],
  });

  // --- Initiative 3: Brand & Demand ----------------------------------------
  const brand = await prisma.initiative.create({
    data: {
      name: "Brand & Demand",
      description:
        "Build a demand engine that makes Northwind the default name operations leaders think of.",
      rationale:
        "Pipeline is too dependent on outbound; we need durable inbound and brand pull.",
      status: "ACTIVE",
      health: "OFF_TRACK",
      owner: "Dani Brooks",
      order: order++,
      targetDate: daysFromNow(80),
    },
  });
  await prisma.outcome.createMany({
    data: [
      { initiativeId: brand.id, teamId: teams.marketing, name: "Qualified pipeline", metricType: "CURRENCY", unit: "$", baseline: 2400000, current: 2550000, target: 5000000 },
      { initiativeId: brand.id, teamId: teams.marketing, name: "Organic signups / mo", metricType: "NUMBER", unit: "signups", baseline: 850, current: 910, target: 2000 },
      { initiativeId: brand.id, teamId: teams.data, name: "Aided brand awareness", metricType: "PERCENT", unit: "%", baseline: 12, current: 13, target: 25 },
    ],
  });
  await createProject(brand.id, {
    name: "Website relaunch",
    team: "design",
    lead: "Sofia Alvarez",
    owner: "Sofia Alvarez",
    contributors: [
      { team: "marketing", pointPerson: "Dani Brooks", responsibility: "RESPONSIBLE" },
      { team: "engineering", pointPerson: "Tomás Rivera", responsibility: "RESPONSIBLE" },
      { team: "product", pointPerson: "Jordan Park", responsibility: "CONSULTED" },
    ],
    impact: "A clearer story and faster site that lifts organic signup conversion — the top of the entire demand funnel.",
    health: "OFF_TRACK",
    targetInDays: 12,
    startedDaysAgo: 55,
    tasks: [
      { title: "New messaging & narrative", status: "DONE", priority: "HIGH", effort: 5, completedDaysAgo: 18 },
      { title: "Homepage & pricing design", status: "BLOCKED", priority: "URGENT", assignee: "Liam O'Brien", effort: 8, dueInDays: -5, staleDays: 12 },
      { title: "CMS migration", status: "BLOCKED", priority: "HIGH", assignee: "Tomás Rivera", effort: 8, dueInDays: -3 },
      { title: "SEO redirect plan", status: "TODO", priority: "HIGH", effort: 3, dueInDays: 4, staleDays: 16 },
      { title: "Launch QA pass", status: "TODO", priority: "MEDIUM", effort: 3, dueInDays: 10 },
    ],
    milestones: [
      { name: "Design freeze", dueInDays: -2, status: "MISSED" },
      { name: "Go live", dueInDays: 12 },
    ],
  });
  await createProject(brand.id, {
    name: "Content engine",
    team: "marketing",
    lead: "Dani Brooks",
    owner: "Dani Brooks",
    contributors: [
      { team: "design", pointPerson: "Liam O'Brien", responsibility: "CONTRIBUTING" },
    ],
    impact: "A repeatable publishing system that compounds organic traffic and inbound pipeline over the quarter.",
    health: "AT_RISK",
    targetInDays: 45,
    tasks: [
      { title: "Keyword & topic strategy", status: "DONE", priority: "MEDIUM", effort: 3, completedDaysAgo: 11 },
      { title: "Editorial calendar Q3", status: "DONE", priority: "LOW", effort: 2, completedDaysAgo: 8 },
      { title: "Publish 8 cornerstone posts", status: "IN_PROGRESS", priority: "MEDIUM", assignee: "Noah Schwartz", effort: 8, dueInDays: 30, staleDays: 13 },
    ],
    milestones: [{ name: "4 posts live", dueInDays: 15 }],
  });

  // --- Initiative 4: Platform Reliability ----------------------------------
  const reliability = await prisma.initiative.create({
    data: {
      name: "Platform Reliability",
      description:
        "Make Northwind fast and boringly dependable as we scale into larger customers.",
      rationale:
        "Reliability is table stakes for enterprise trust and protects expansion revenue.",
      status: "ACTIVE",
      health: "ON_TRACK",
      owner: "Marcus Lee",
      order: order++,
      targetDate: daysFromNow(50),
    },
  });
  await prisma.outcome.createMany({
    data: [
      { initiativeId: reliability.id, teamId: teams.engineering, name: "p95 API latency", metricType: "NUMBER", unit: "ms", baseline: 540, current: 410, target: 250, higherIsBetter: false },
      { initiativeId: reliability.id, teamId: teams.engineering, name: "Uptime", metricType: "PERCENT", unit: "%", baseline: 99.5, current: 99.85, target: 99.95 },
      { initiativeId: reliability.id, teamId: teams.engineering, name: "Sev-1 incidents / qtr", metricType: "NUMBER", unit: "incidents", baseline: 6, current: 3, target: 1, higherIsBetter: false },
    ],
  });
  await createProject(reliability.id, {
    name: "Observability rollout",
    team: "engineering",
    lead: "Tomás Rivera",
    owner: "Tomás Rivera",
    impact: "Tracing and SLO dashboards across services so we catch regressions before customers do — protects uptime.",
    health: "ON_TRACK",
    targetInDays: 28,
    tasks: [
      { title: "Standardize structured logging", status: "DONE", priority: "MEDIUM", effort: 5, completedDaysAgo: 7 },
      { title: "Distributed tracing in core path", status: "IN_PROGRESS", priority: "HIGH", assignee: "Wei Chen", effort: 8, dueInDays: 9 },
      { title: "SLO dashboards & alerts", status: "TODO", priority: "MEDIUM", effort: 5, dueInDays: 20 },
    ],
    milestones: [{ name: "Tracing in production", dueInDays: 16 }],
  });
  await createProject(reliability.id, {
    name: "Database sharding",
    team: "engineering",
    lead: "Wei Chen",
    owner: "Wei Chen",
    contributors: [
      { team: "data", pointPerson: "Owen Fitzgerald", responsibility: "CONSULTED" },
    ],
    impact: "Horizontal scaling for the largest accounts, directly lowering p95 latency under load.",
    health: "ON_TRACK",
    status: "PLANNING",
    targetInDays: 48,
    tasks: [
      { title: "Shard key design RFC", status: "IN_PROGRESS", priority: "HIGH", assignee: "Marcus Lee", effort: 5, dueInDays: 11 },
      { title: "Migration tooling spike", status: "TODO", priority: "MEDIUM", effort: 5, dueInDays: 25 },
    ],
    milestones: [{ name: "RFC approved", dueInDays: 12 }],
  });

  // ---- Backdate updatedAt for "stale" tasks (raw — @updatedAt can't be set) -
  for (const s of staleUpdates) {
    const ts = daysAgo(s.days).toISOString();
    await prisma.$executeRawUnsafe(
      `UPDATE "Task" SET "updatedAt" = ? WHERE "id" = ?`,
      ts,
      s.id,
    );
  }

  // ---- A couple of seed check-ins so the history isn't empty ---------------
  const lastMonday = startOfWeek(daysAgo(7));
  await prisma.checkIn.create({
    data: {
      initiativeId: brand.id,
      weekOf: lastMonday,
      source: "MANUAL",
      healthAssessment: "OFF_TRACK",
      summary:
        "Website relaunch slipped its design freeze and is now blocking the demand funnel. Pipeline is flat vs. plan.",
      highlights: "Messaging & narrative finalized\nEditorial calendar locked for Q3",
      risks:
        "Homepage design blocked on legal review\nCMS migration stuck behind the redesign\nGo-live date at serious risk",
      nextSteps:
        "Escalate legal review to unblock homepage\nDecide go/no-go on the launch date by Friday",
    },
  });

  // ---- Assign human-readable tracking ids (INIT-1, PRJ-1, TASK-1, …) -------
  const initRows = await prisma.initiative.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  for (let i = 0; i < initRows.length; i++) {
    await prisma.initiative.update({
      where: { id: initRows[i].id },
      data: { key: `INIT-${i + 1}` },
    });
  }
  const projRows = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  for (let i = 0; i < projRows.length; i++) {
    await prisma.project.update({
      where: { id: projRows[i].id },
      data: { key: `PRJ-${i + 1}` },
    });
  }
  const taskRows = await prisma.task.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  for (let i = 0; i < taskRows.length; i++) {
    await prisma.task.update({
      where: { id: taskRows[i].id },
      data: { key: `TASK-${i + 1}` },
    });
  }

  const counts = {
    teams: teamDefs.length,
    members: memberDefs.length,
    initiatives: 4,
    projects: await prisma.project.count(),
    outcomes: await prisma.outcome.count(),
    tasks: await prisma.task.count(),
  };
  console.log("✅ Seed complete:", counts);
}

// Local copy of startOfWeek to avoid importing app code into the seed.
function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const dow = date.getDay();
  const diff = (dow === 0 ? -6 : 1) - dow;
  date.setDate(date.getDate() + diff);
  return date;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
