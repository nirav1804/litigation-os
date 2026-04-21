import { PrismaClient, UserRole, MatterType, MatterStatus, HearingStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Litigation OS database...')

  // ─── Organization ────────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'sharma-associates' },
    update: {},
    create: {
      name: 'Sharma & Associates',
      slug: 'sharma-associates',
      barCouncil: 'BAR/DL/2001/12345',
      address: '12, Lawyers Chamber, Supreme Court of India, New Delhi - 110001',
      phone: '+91 11 2338 4000',
      website: 'https://sharmaassociates.in',
    },
  })
  console.log(`✅ Organization: ${org.name}`)

  // ─── Users ───────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password@123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sharmaassociates.in' },
    update: {},
    create: {
      email: 'admin@sharmaassociates.in',
      password: passwordHash,
      firstName: 'Rajiv',
      lastName: 'Sharma',
      role: UserRole.ADMIN,
      barNumber: 'D/1234/2001',
      phone: '+91 98765 43210',
      organizationId: org.id,
    },
  })

  const seniorLawyer = await prisma.user.upsert({
    where: { email: 'priya@sharmaassociates.in' },
    update: {},
    create: {
      email: 'priya@sharmaassociates.in',
      password: passwordHash,
      firstName: 'Priya',
      lastName: 'Mehta',
      role: UserRole.SENIOR_LAWYER,
      barNumber: 'D/5678/2010',
      organizationId: org.id,
    },
  })

  const associate = await prisma.user.upsert({
    where: { email: 'arjun@sharmaassociates.in' },
    update: {},
    create: {
      email: 'arjun@sharmaassociates.in',
      password: passwordHash,
      firstName: 'Arjun',
      lastName: 'Kapoor',
      role: UserRole.ASSOCIATE,
      barNumber: 'D/9012/2020',
      organizationId: org.id,
    },
  })

  const clerk = await prisma.user.upsert({
    where: { email: 'ravi@sharmaassociates.in' },
    update: {},
    create: {
      email: 'ravi@sharmaassociates.in',
      password: passwordHash,
      firstName: 'Ravi',
      lastName: 'Kumar',
      role: UserRole.CLERK,
      organizationId: org.id,
    },
  })

  console.log(`✅ Users: ${admin.email}, ${seniorLawyer.email}, ${associate.email}, ${clerk.email}`)

  // ─── Courts ───────────────────────────────────────────────────────────────────
  const supremeCourt = await prisma.court.upsert({
    where: { id: 'court-sc-001' },
    update: {},
    create: {
      id: 'court-sc-001',
      name: 'Supreme Court of India',
      shortName: 'SCI',
      city: 'New Delhi',
      state: 'Delhi',
      courtType: 'Supreme Court',
      organizationId: org.id,
    },
  })

  const delhiHC = await prisma.court.upsert({
    where: { id: 'court-dhc-001' },
    update: {},
    create: {
      id: 'court-dhc-001',
      name: 'High Court of Delhi',
      shortName: 'DHC',
      city: 'New Delhi',
      state: 'Delhi',
      courtType: 'High Court',
      organizationId: org.id,
    },
  })

  const bombayHC = await prisma.court.upsert({
    where: { id: 'court-bhc-001' },
    update: {},
    create: {
      id: 'court-bhc-001',
      name: 'Bombay High Court',
      shortName: 'BHC',
      city: 'Mumbai',
      state: 'Maharashtra',
      courtType: 'High Court',
      organizationId: org.id,
    },
  })

  console.log(`✅ Courts: Supreme Court, Delhi HC, Bombay HC`)

  // ─── Sample Matters ───────────────────────────────────────────────────────────
  const matter1 = await prisma.matter.create({
    data: {
      title: 'M/s TechCorp Pvt Ltd vs Union of India',
      caseNumber: 'WP(C) 12345/2024',
      internalRef: 'REF/2024/001',
      type: MatterType.CONSTITUTIONAL,
      status: MatterStatus.ACTIVE,
      description: 'Writ petition challenging the IT Amendment Rules 2024 as violative of Article 19(1)(g) of the Constitution of India',
      reliefSought: 'Quashing of IT Amendment Rules 2024 and interim stay on enforcement',
      courtId: delhiHC.id,
      judgeName: 'Justice Sanjay Kumar',
      benchNumber: 'DB-V',
      filingDate: new Date('2024-03-15'),
      nextHearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      createdById: admin.id,
      assignments: {
        create: [
          { userId: admin.id, role: 'lead' },
          { userId: seniorLawyer.id, role: 'supporting' },
          { userId: associate.id, role: 'research' },
        ],
      },
      parties: {
        create: [
          { name: 'M/s TechCorp Pvt Ltd', type: 'PETITIONER', address: '123, Cyber City, Gurugram', counsel: 'Rajiv Sharma' },
          { name: 'Union of India', type: 'RESPONDENT', address: 'Ministry of Electronics and IT, New Delhi', counsel: 'Solicitor General of India' },
          { name: 'Ministry of Electronics and IT', type: 'RESPONDENT', address: 'Electronics Niketan, New Delhi' },
        ],
      },
    },
  })

  const matter2 = await prisma.matter.create({
    data: {
      title: 'Suresh Agarwal vs HDFC Bank Ltd',
      caseNumber: 'CS(COMM) 456/2023',
      internalRef: 'REF/2023/045',
      type: MatterType.CIVIL,
      status: MatterStatus.ACTIVE,
      description: 'Commercial suit for recovery of ₹2.5 crores wrongfully debited from plaintiff\'s account',
      reliefSought: 'Decree for ₹2,50,00,000 with interest at 18% p.a. and costs',
      courtId: delhiHC.id,
      judgeName: 'Justice Amit Sharma',
      filingDate: new Date('2023-08-20'),
      nextHearingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      createdById: seniorLawyer.id,
      assignments: {
        create: [
          { userId: seniorLawyer.id, role: 'lead' },
          { userId: associate.id, role: 'supporting' },
        ],
      },
      parties: {
        create: [
          { name: 'Suresh Agarwal', type: 'PLAINTIFF', address: '45, Golf Links, New Delhi' },
          { name: 'HDFC Bank Ltd', type: 'DEFENDANT', address: 'HDFC Bank House, Lower Parel, Mumbai', counsel: 'Adv. Ramesh Patel' },
        ],
      },
    },
  })

  const matter3 = await prisma.matter.create({
    data: {
      title: 'State of Maharashtra vs Raju Bhai Patel',
      caseNumber: 'Crl. Appeal 789/2024',
      internalRef: 'REF/2024/023',
      type: MatterType.CRIMINAL,
      status: MatterStatus.ACTIVE,
      description: 'Criminal appeal against acquittal in Sessions Court in IPC 420 and 406 case',
      courtId: bombayHC.id,
      judgeName: 'Justice Priya Desai',
      filingDate: new Date('2024-01-10'),
      nextHearingDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      organizationId: org.id,
      createdById: admin.id,
      assignments: {
        create: [{ userId: admin.id, role: 'lead' }],
      },
      parties: {
        create: [
          { name: 'State of Maharashtra', type: 'APPELLANT' },
          { name: 'Raju Bhai Patel', type: 'RESPONDENT', address: 'Dharavi, Mumbai' },
        ],
      },
    },
  })

  console.log(`✅ Sample matters created: ${matter1.title}, ${matter2.title}, ${matter3.title}`)

  // ─── Sample Hearings ──────────────────────────────────────────────────────────
  await prisma.hearing.createMany({
    data: [
      {
        matterId: matter1.id,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        purpose: 'Arguments on interim stay',
        status: HearingStatus.SCHEDULED,
        courtRoom: 'Court No. 5',
      },
      {
        matterId: matter1.id,
        scheduledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        purpose: 'Admission',
        status: HearingStatus.COMPLETED,
        outcome: 'ARGUMENTS_HEARD',
        summary: 'Notice issued to respondents. Matter admitted. Next date for hearing on stay.',
      },
      {
        matterId: matter2.id,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        purpose: 'Written statement due',
        status: HearingStatus.SCHEDULED,
      },
    ],
  })

  // ─── Sample Tasks ─────────────────────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        matterId: matter1.id,
        title: 'File written submissions on stay application',
        description: 'Draft and file comprehensive written submissions on the stay application before the next hearing',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assigneeId: associate.id,
        createdById: admin.id,
      },
      {
        matterId: matter1.id,
        title: 'Research precedents on Article 19(1)(g)',
        description: 'Compile Supreme Court judgments on reasonable restrictions under Article 19(1)(g)',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assigneeId: associate.id,
        createdById: seniorLawyer.id,
      },
      {
        matterId: matter2.id,
        title: 'Obtain bank statements for 2022-2023',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        assigneeId: clerk.id,
        createdById: seniorLawyer.id,
      },
      {
        matterId: matter1.id,
        title: 'Prepare hearing brief for next date',
        priority: 'URGENT',
        status: 'TODO',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        assigneeId: seniorLawyer.id,
        createdById: admin.id,
      },
    ],
  })

  // ─── Timeline events ──────────────────────────────────────────────────────────
  await prisma.timelineEvent.createMany({
    data: [
      {
        matterId: matter1.id,
        createdById: admin.id,
        eventDate: new Date('2024-03-15'),
        title: 'Matter Filed',
        description: 'Writ petition filed in Delhi High Court challenging IT Amendment Rules 2024',
        eventType: 'filing',
      },
      {
        matterId: matter1.id,
        createdById: admin.id,
        eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        title: 'First Hearing — Admission',
        description: 'Matter admitted. Notice issued to UoI and MeitY. Next date for stay arguments.',
        eventType: 'hearing',
      },
    ],
  })

  console.log(`✅ Sample hearings, tasks, and timeline events created`)
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('📧 Login credentials (all use password: Password@123):')
  console.log(`   Admin:         admin@sharmaassociates.in`)
  console.log(`   Senior Lawyer: priya@sharmaassociates.in`)
  console.log(`   Associate:     arjun@sharmaassociates.in`)
  console.log(`   Clerk:         ravi@sharmaassociates.in`)
  console.log('')
  console.log('🏢 Organization slug: sharma-associates')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
