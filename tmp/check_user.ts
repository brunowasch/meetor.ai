import { prisma } from '@/lib/prisma';

async function main(){
  const user = await prisma.mentorconnect_usuario.findFirst({
    where: { email: 'bwaschburgersilva@gmail.com' }
  });
  console.log('found:', user);
}

main().catch(e=>console.error(e)).finally(()=>process.exit());
