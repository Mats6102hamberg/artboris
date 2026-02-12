import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const partner = await prisma.printPartner.upsert({
    where: { id: 'crimson-stockholm' },
    update: {
      name: 'Crimson',
      countryCode: 'SE',
      isActive: true,
      apiBaseUrl: 'https://crimson.se',
      contactEmail: null,
      contactPhone: null,
    },
    create: {
      id: 'crimson-stockholm',
      name: 'Crimson',
      countryCode: 'SE',
      isActive: true,
      apiBaseUrl: 'https://crimson.se',
    },
  })

  console.log('✅ PrintPartner seeded:', partner)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
