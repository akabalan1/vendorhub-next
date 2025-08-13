import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(){
  // Capabilities
  await prisma.$transaction([
    prisma.capability.upsert({ where:{ slug:'rlhf' }, update:{}, create:{ slug:'rlhf', name:'RLHF' }}),
    prisma.capability.upsert({ where:{ slug:'evals' }, update:{}, create:{ slug:'evals', name:'Evaluations' }}),
    prisma.capability.upsert({ where:{ slug:'search' }, update:{}, create:{ slug:'search', name:'Search' }}),
    prisma.capability.upsert({ where:{ slug:'reasoning' }, update:{}, create:{ slug:'reasoning', name:'Reasoning' }}),
  ]);

  // Vendors
  const telus = await prisma.vendor.upsert({
    where: { name: 'Telus' },
    update: {},
    create: { name: 'Telus', industries: ['LLM SFT','RLHF','evals'], platforms: ['Meta'], overview: 'Recommended for simple workflows.' }
  });
  const invisible = await prisma.vendor.upsert({
    where: { name: 'Invisible' },
    update: {},
    create: { name: 'Invisible', industries: ['Reasoning','Agentic'], platforms: ['Meta'], overview: 'Strong on reasoning projects.' }
  });
  const scale = await prisma.vendor.upsert({
    where: { name: 'Scale' },
    update: {},
    create: { name: 'Scale', industries: ['LLM SFT','Multilingual'], platforms: ['Meta'], overview: 'Strong multilingual coverage.' }
  });

  // Links
  const capIdx: Record<string,string> = {};
  for (const c of await prisma.capability.findMany()) capIdx[c.slug]=c.id;
  await prisma.vendorCapability.createMany({ data: [
    { vendorId: telus.id, capId: capIdx['evals'] },
    { vendorId: telus.id, capId: capIdx['search'] },
    { vendorId: invisible.id, capId: capIdx['reasoning'] },
    { vendorId: scale.id, capId: capIdx['rlhf'] },
    { vendorId: scale.id, capId: capIdx['evals'] },
  ], skipDuplicates: true });

  // Costs
  await prisma.costTier.createMany({ data: [
    { vendorId: telus.id, tierLabel: 'Tier 1', hourlyUsdMin: 35 },
    { vendorId: telus.id, tierLabel: 'Tier 2', hourlyUsdMin: 50 },
    { vendorId: invisible.id, tierLabel: 'Tier 2', hourlyUsdMin: 55 },
    { vendorId: invisible.id, tierLabel: 'Tier 3', hourlyUsdMin: 71 },
    { vendorId: scale.id, tierLabel: 'Tier 1', hourlyUsdMin: 49 },
    { vendorId: scale.id, tierLabel: 'Tier 2', hourlyUsdMin: 89 }
  ], skipDuplicates: true });

  // Feedback
  await prisma.feedback.createMany({ data: [
    { vendorId: telus.id, author: 'PMO', ratingQuality: 3, ratingSpeed: 4, ratingComm: 3, text: 'Needed tighter QA alignment.' },
    { vendorId: invisible.id, author: 'Research', ratingQuality: 4, ratingSpeed: 4, ratingComm: 5, text: 'Excellent on guideline iteration.' },
    { vendorId: scale.id, author: 'PjM', ratingQuality: 4, ratingSpeed: 3, ratingComm: 4, text: 'Good multilingual capacity; schedule risk.' }
  ]});
}

main().finally(()=> prisma.$disconnect());
