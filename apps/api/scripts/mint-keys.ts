/**
 * One-off: mint a project plus a sandbox (pk_test) and prod (pk_live) API key.
 * Run from apps/api:  pnpm exec tsx scripts/mint-keys.ts
 * Full keys are printed ONCE — they are bcrypt-hashed in the DB and unrecoverable.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { generateApiKey, hashApiKey } from '../src/utils/api-keys.js';

const prisma = new PrismaClient();

async function main() {
  const projectName = process.argv[2] ?? 'Test dApp';

  // A project row needs a unique legacy apiKey column; we don't use it for auth
  // (the real keys live in the ApiKey table), so give it an inert random value.
  const legacy = generateApiKey('production').fullKey;
  const project = await prisma.project.create({
    data: {
      name: projectName,
      apiKey: legacy,
      apiKeyHash: await hashApiKey(legacy),
      tier: 'free',
    },
  });

  async function mint(environment: 'staging' | 'production', label: string) {
    const { fullKey, prefix } = generateApiKey(environment);
    await prisma.apiKey.create({
      data: {
        projectId: project.id,
        name: label,
        prefix,
        hash: await hashApiKey(fullKey),
        environment,
      },
    });
    return fullKey;
  }

  const sandboxKey = await mint('staging', 'Sandbox key');
  const prodKey = await mint('production', 'Production key');

  console.log('\n==================  RABIT KEYS  ==================');
  console.log(`Project: ${projectName}`);
  console.log(`projectId : ${project.id}`);
  console.log('-------------------------------------------------');
  console.log(`SANDBOX  apiKey : ${sandboxKey}`);
  console.log(`PROD     apiKey : ${prodKey}`);
  console.log('=================================================');
  console.log('Store these now — they cannot be retrieved later.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
