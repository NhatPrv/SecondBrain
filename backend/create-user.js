const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'torikun2005@gmail.com';
  const password = '123456';
  const name = 'Torik';
  const initials = 'T';
  const color = 'bg-chart-1';

  console.log(`Checking if user ${email} exists...`);
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser) {
    console.log(`User ${email} already exists. Updating password...`);
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        name,
        initials,
        color
      }
    });
    console.log('User updated successfully.');
  } else {
    console.log(`Creating user ${email}...`);
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        initials,
        color,
        online: false
      }
    });
    console.log(`User created successfully with ID: ${newUser.id}`);

    // Add membership to default group chats
    const defaultConversations = ['family-all'];
    for (const convId of defaultConversations) {
      const conv = await prisma.conversation.findUnique({
        where: { id: convId }
      });
      if (conv) {
        await prisma.conversationMember.upsert({
          where: {
            conversationId_userId: {
              conversationId: convId,
              userId: newUser.id
            }
          },
          update: {},
          create: {
            conversationId: convId,
            userId: newUser.id
          }
        });
        console.log(`Added user to conversation: ${convId}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('Error creating user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
