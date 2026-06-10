import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.friendship.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.animalInstance.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.farmPlot.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.fish.deleteMany();
  await prisma.playerProfile.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.driveItem.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users
  const users = {
    maya: await prisma.user.create({
      data: {
        id: 'maya',
        email: 'maya@family.app',
        passwordHash,
        name: 'Maya Carter',
        initials: 'MC',
        color: 'bg-chart-1',
        online: true,
      },
    }),
    noah: await prisma.user.create({
      data: {
        id: 'noah',
        email: 'noah@family.app',
        passwordHash,
        name: 'Noah Carter',
        initials: 'NC',
        color: 'bg-chart-3',
        online: true,
      },
    }),
    ivy: await prisma.user.create({
      data: {
        id: 'ivy',
        email: 'ivy@family.app',
        passwordHash,
        name: 'Ivy Carter',
        initials: 'IC',
        color: 'bg-chart-4',
        online: false,
      },
    }),
    leo: await prisma.user.create({
      data: {
        id: 'leo',
        email: 'leo@family.app',
        passwordHash,
        name: 'Leo Carter',
        initials: 'LC',
        color: 'bg-chart-5',
        online: true,
      },
    }),
    grandma: await prisma.user.create({
      data: {
        id: 'grandma',
        email: 'grandma@family.app',
        passwordHash,
        name: 'Grandma Rose',
        initials: 'GR',
        color: 'bg-chart-2',
        online: false,
      },
    }),
  };

  console.log('Seeded users:', Object.keys(users).length);

  // 4. Create Conversations
  const convs = {
    familyAll: await prisma.conversation.create({
      data: {
        id: 'family-all',
        name: 'Carter Family',
        type: 'group',
        color: 'bg-chart-1',
        initials: 'CF',
        pinned: true,
      },
    }),
    kids: await prisma.conversation.create({
      data: {
        id: 'kids',
        name: 'The Kids',
        type: 'group',
        color: 'bg-chart-4',
        initials: 'TK',
      },
    }),
    noah: await prisma.conversation.create({
      data: {
        id: 'noah',
        name: 'Noah Carter',
        type: 'direct',
        color: 'bg-chart-3',
        initials: 'NC',
      },
    }),
    ivy: await prisma.conversation.create({
      data: {
        id: 'ivy',
        name: 'Ivy Carter',
        type: 'direct',
        color: 'bg-chart-4',
        initials: 'IC',
      },
    }),
    leo: await prisma.conversation.create({
      data: {
        id: 'leo',
        name: 'Leo Carter',
        type: 'direct',
        color: 'bg-chart-5',
        initials: 'LC',
      },
    }),
    grandma: await prisma.conversation.create({
      data: {
        id: 'grandma',
        name: 'Grandma Rose',
        type: 'direct',
        color: 'bg-chart-2',
        initials: 'GR',
      },
    }),
  };

  console.log('Seeded conversations:', Object.keys(convs).length);

  // 5. Create Memberships
  // Carter Family Group: Maya, Noah, Ivy, Leo, Grandma
  for (const user of Object.values(users)) {
    await prisma.conversationMember.create({
      data: {
        conversationId: convs.familyAll.id,
        userId: user.id,
      },
    });
  }

  // The Kids Group: Ivy, Leo, Maya (to view it)
  for (const userId of ['ivy', 'leo', 'maya']) {
    await prisma.conversationMember.create({
      data: {
        conversationId: convs.kids.id,
        userId,
      },
    });
  }

  // Direct chats: Maya + User
  for (const user of [users.noah, users.ivy, users.leo, users.grandma]) {
    await prisma.conversationMember.create({
      data: { conversationId: convs[user.id].id, userId: 'maya' },
    });
    await prisma.conversationMember.create({
      data: { conversationId: convs[user.id].id, userId: user.id },
    });
  }

  // 6. Create Messages & Reactions & Replies
  // Carter Family group chat
  const f1 = await prisma.message.create({
    data: {
      id: 'f1',
      conversationId: convs.familyAll.id,
      authorId: users.maya.id,
      text: "Hey everyone! Who's free for dinner tonight?",
      pinned: true,
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    },
  });

  const f2 = await prisma.message.create({
    data: {
      id: 'f2',
      conversationId: convs.familyAll.id,
      authorId: users.ivy.id,
      text: 'Me! Can we have tacos?',
      createdAt: new Date(Date.now() - 3600000 * 1.8),
    },
  });

  await prisma.reaction.create({
    data: {
      messageId: f2.id,
      userId: users.maya.id,
      emoji: '🌮',
    },
  });

  const f3 = await prisma.message.create({
    data: {
      id: 'f3',
      conversationId: convs.familyAll.id,
      authorId: users.leo.id,
      text: 'Tacos sound amazing',
      replyToId: f2.id,
      createdAt: new Date(Date.now() - 3600000 * 1.7),
    },
  });

  await prisma.reaction.create({
    data: {
      messageId: f3.id,
      userId: users.noah.id,
      emoji: '👍',
    },
  });

  const f4 = await prisma.message.create({
    data: {
      id: 'f4',
      conversationId: convs.familyAll.id,
      authorId: users.maya.id,
      text: "Tacos it is. I'll pick up ingredients on the way home.",
      createdAt: new Date(Date.now() - 3600000 * 1.5),
    },
  });

  await prisma.reaction.create({
    data: { messageId: f4.id, userId: users.noah.id, emoji: '❤️' },
  });

  const f5 = await prisma.message.create({
    data: {
      id: 'f5',
      conversationId: convs.familyAll.id,
      authorId: users.noah.id,
      text: 'Dinner at 7 works for me!',
      createdAt: new Date(Date.now() - 3600000 * 1.2),
    },
  });

  // Kids group chat
  await prisma.message.create({
    data: {
      id: 'k1',
      conversationId: convs.kids.id,
      authorId: users.leo.id,
      text: 'Movie night this weekend?',
      createdAt: new Date(Date.now() - 3600000 * 4),
    },
  });

  const k2 = await prisma.message.create({
    data: {
      id: 'k2',
      conversationId: convs.kids.id,
      authorId: users.ivy.id,
      text: 'can we get pizza 🍕',
      createdAt: new Date(Date.now() - 3600000 * 3.5),
    },
  });

  await prisma.reaction.create({
    data: { messageId: k2.id, userId: users.leo.id, emoji: '🍕' },
  });

  // Direct Noah chat
  await prisma.message.create({
    data: {
      id: 'n1',
      conversationId: convs.noah.id,
      authorId: users.noah.id,
      text: 'Are we still on for the parent meeting?',
      createdAt: new Date(Date.now() - 3600000 * 3),
    },
  });

  await prisma.message.create({
    data: {
      id: 'n2',
      conversationId: convs.noah.id,
      authorId: users.maya.id,
      text: 'Yes! 6pm at the school.',
      createdAt: new Date(Date.now() - 3600000 * 2.8),
    },
  });

  await prisma.message.create({
    data: {
      id: 'n3',
      conversationId: convs.noah.id,
      authorId: users.noah.id,
      text: 'Sounds good, see you then.',
      createdAt: new Date(Date.now() - 3600000 * 2.7),
    },
  });

  // Direct Ivy chat
  await prisma.message.create({
    data: {
      id: 'i1',
      conversationId: convs.ivy.id,
      authorId: users.maya.id,
      text: 'did you finish homework?',
      createdAt: new Date(Date.now() - 3600000 * 5),
    },
  });

  // Direct Leo chat
  await prisma.message.create({
    data: {
      id: 'l1',
      conversationId: convs.leo.id,
      authorId: users.leo.id,
      text: 'Mom can you pick me up at 5?',
      createdAt: new Date(Date.now() - 3600000 * 6),
    },
  });

  // Direct Grandma chat
  await prisma.message.create({
    data: {
      id: 'g1',
      conversationId: convs.grandma.id,
      authorId: users.grandma.id,
      text: 'Love you all! ❤️',
      createdAt: new Date(Date.now() - 3600000 * 24),
    },
  });

  console.log('Seeded chat messages.');

  // 7. Create DriveItems (Mock files and folders)
  // Root folders
  const fPhotos = await prisma.driveItem.create({
    data: { id: 'f-photos', name: 'Family Photos', kind: 'folder', modified: 'May 2', starred: true, parentId: null },
  });
  const fDocs = await prisma.driveItem.create({
    data: { id: 'f-docs', name: 'Documents', kind: 'folder', modified: 'Apr 28', parentId: null },
  });
  const fSchool = await prisma.driveItem.create({
    data: { id: 'f-school', name: 'School', kind: 'folder', modified: 'Apr 20', parentId: null },
  });
  const fTrips = await prisma.driveItem.create({
    data: { id: 'f-trips', name: 'Trips', kind: 'folder', modified: 'Mar 15', parentId: null },
  });

  // Root files
  await prisma.driveItem.create({
    data: { id: 'i-1', name: 'House_insurance.pdf', kind: 'pdf', size: '2.4 MB', modified: 'May 1', parentId: null },
  });
  await prisma.driveItem.create({
    data: { id: 'i-2', name: 'Budget_2026.sheet', kind: 'sheet', size: '180 KB', modified: 'Apr 30', starred: true, parentId: null },
  });
  await prisma.driveItem.create({
    data: { id: 'i-3', name: 'Family_calendar.doc', kind: 'doc', size: '92 KB', modified: 'Apr 25', parentId: null },
  });
  await prisma.driveItem.create({
    data: { id: 'i-4', name: 'Beach_sunset.jpg', kind: 'image', size: '5.1 MB', modified: 'Apr 22', parentId: null },
  });
  await prisma.driveItem.create({
    data: { id: 'i-5', name: 'Birthday_song.mp3', kind: 'audio', size: '3.2 MB', modified: 'Apr 18', parentId: null },
  });
  await prisma.driveItem.create({
    data: { id: 'i-6', name: 'Recital_clip.mp4', kind: 'video', size: '48 MB', modified: 'Apr 10', parentId: null },
  });

  // Inside Family Photos
  await prisma.driveItem.create({
    data: { id: 'p-1', name: 'Summer 2025', kind: 'folder', modified: 'May 2', parentId: fPhotos.id },
  });
  await prisma.driveItem.create({
    data: { id: 'p-2', name: 'Garden.jpg', kind: 'image', size: '4.2 MB', modified: 'May 1', parentId: fPhotos.id },
  });
  await prisma.driveItem.create({
    data: { id: 'p-3', name: 'Picnic.jpg', kind: 'image', size: '3.8 MB', modified: 'Apr 29', parentId: fPhotos.id },
  });

  // Inside Documents
  await prisma.driveItem.create({
    data: { id: 'd-1', name: 'Passports.pdf', kind: 'pdf', size: '1.1 MB', modified: 'Apr 28', starred: true, parentId: fDocs.id },
  });
  await prisma.driveItem.create({
    data: { id: 'd-2', name: 'Tax_2025.pdf', kind: 'pdf', size: '820 KB', modified: 'Apr 15', parentId: fDocs.id },
  });

  // Inside School
  await prisma.driveItem.create({
    data: { id: 's-1', name: 'Report_card.pdf', kind: 'pdf', size: '440 KB', modified: 'Apr 20', parentId: fSchool.id },
  });

  console.log('Seeded file manager items.');

  // 8. Create Notes
  await prisma.note.create({
    data: {
      id: 'n1',
      title: 'Summer trip checklist',
      body: "Pack sunscreen, beach towels, and the first-aid kit. Book the cabin by June 1st. Don't forget Leo's swim goggles and Ivy's favorite book for the drive.\n\nConfirm pet sitter for the dog.",
      category: 'Family',
      tags: ['travel', 'summer'],
      pinned: true,
      color: 'bg-chart-1',
      userId: users.maya.id,
    },
  });

  await prisma.note.create({
    data: {
      id: 'n2',
      title: 'Emergency contacts',
      body: "Dr. Patel (pediatrician): 555-0142\nPlumber: 555-0199\nGrandma Rose: 555-0123\nSchool office: 555-0177\n\nKeep a printed copy on the fridge.",
      category: 'Family',
      tags: ['important'],
      pinned: true,
      color: 'bg-chart-5',
      userId: users.maya.id,
    },
  });

  await prisma.note.create({
    data: {
      id: 'n3',
      title: "Grandma's lasagna recipe",
      body: "Layers: pasta, ricotta, mozzarella, meat sauce. Bake at 375°F for 45 minutes. Let it rest 10 minutes before serving.\n\nSecret: a pinch of nutmeg in the ricotta.",
      category: 'Recipes',
      tags: ['dinner', 'italian'],
      color: 'bg-chart-3',
      userId: users.maya.id,
    },
  });

  await prisma.note.create({
    data: {
      id: 'n4',
      title: 'Book outline: The Quiet Garden',
      body: "Chapter 1 — the move to the countryside.\nChapter 2 — discovering the overgrown garden.\nChapter 3 — meeting the old gardener next door.\n\nTheme: patience and growth.",
      category: 'Ideas',
      tags: ['writing', 'project'],
      color: 'bg-chart-4',
      userId: users.maya.id,
    },
  });

  await prisma.note.create({
    data: {
      id: 'n5',
      title: 'Weekly meal plan',
      body: "Mon: Tacos\nTue: Pasta night\nWed: Stir fry\nThu: Leftovers\nFri: Homemade pizza\nSat: BBQ\nSun: Roast dinner",
      category: 'Family',
      tags: ['food', 'planning'],
      color: 'bg-chart-2',
      userId: users.maya.id,
    },
  });

  await prisma.note.create({
    data: {
      id: 'n6',
      title: 'Q3 project goals',
      body: 'Ship the new onboarding flow. Improve load time by 30%. Run two user research sessions.',
      category: 'Work',
      tags: ['goals'],
      color: 'bg-chart-1',
      userId: users.maya.id,
    },
  });

  await prisma.note.create({
    data: {
      id: 'n7',
      title: 'Gift ideas',
      body: "Mom: gardening gloves, a good book, spa day.\nNoah: noise-cancelling headphones.\nIvy: art supplies set.\nLeo: soccer cleats.",
      category: 'Personal',
      tags: ['shopping'],
      color: 'bg-chart-4',
      userId: users.maya.id,
    },
  });

  console.log('Seeded notes.');

  // === SEED POCKET FARM CONFIGURATION AND CATALOGS ===
  console.log('Seeding Pocket Farm catalogs...');

  // Seed Crops
  const cropsData = [
    { name: 'Carrot', emoji: '🥕', category: 'Crops', rarity: 'common', growthTimeSeconds: 10, buyPrice: 10, sellPrice: 15, xpReward: 5 },
    { name: 'Strawberry', emoji: '🍓', category: 'Crops', rarity: 'common', growthTimeSeconds: 20, buyPrice: 20, sellPrice: 35, xpReward: 8 },
    { name: 'Corn', emoji: '🌽', category: 'Crops', rarity: 'common', growthTimeSeconds: 30, buyPrice: 15, sellPrice: 25, xpReward: 6 },
    { name: 'Eggplant', emoji: '🍆', category: 'Crops', rarity: 'common', growthTimeSeconds: 40, buyPrice: 25, sellPrice: 45, xpReward: 10 },
    { name: 'Pepper', emoji: '🌶️', category: 'Crops', rarity: 'common', growthTimeSeconds: 15, buyPrice: 12, sellPrice: 20, xpReward: 6 },
    { name: 'Sunflower', emoji: '🌻', category: 'Crops', rarity: 'common', growthTimeSeconds: 25, buyPrice: 18, sellPrice: 30, xpReward: 7 },
    { name: 'Tomato', emoji: '🍅', category: 'Crops', rarity: 'common', growthTimeSeconds: 35, buyPrice: 22, sellPrice: 38, xpReward: 9 },
    { name: 'Lettuce', emoji: '🥬', category: 'Crops', rarity: 'common', growthTimeSeconds: 8, buyPrice: 8, sellPrice: 12, xpReward: 4 },
    { name: 'Pumpkin', emoji: '🎃', category: 'Crops', rarity: 'common', growthTimeSeconds: 60, buyPrice: 30, sellPrice: 60, xpReward: 15 },
  ];
  for (const c of cropsData) {
    await prisma.crop.create({ data: c });
  }

  // Seed Animals
  const animalsData = [
    { name: 'Cow', species: 'Cow', emoji: '🐮', produces: 'Milk', productionTimeSeconds: 60, buyPrice: 300, feedCost: 10 },
    { name: 'Chicken', species: 'Chicken', emoji: '🐔', produces: 'Egg', productionTimeSeconds: 30, buyPrice: 100, feedCost: 5 },
    { name: 'Sheep', species: 'Sheep', emoji: '🐑', produces: 'Wool', productionTimeSeconds: 90, buyPrice: 500, feedCost: 15 },
    { name: 'Pig', species: 'Pig', emoji: '🐷', produces: 'Truffle', productionTimeSeconds: 120, buyPrice: 800, feedCost: 20 },
    { name: 'Rabbit', species: 'Rabbit', emoji: '🐰', produces: 'Fur', productionTimeSeconds: 80, buyPrice: 400, feedCost: 12 },
    { name: 'Duck', species: 'Duck', emoji: '🦆', produces: 'Feather', productionTimeSeconds: 50, buyPrice: 200, feedCost: 8 },
  ];
  for (const a of animalsData) {
    await prisma.animal.create({ data: a });
  }

  // Seed Fish
  const fishData = [
    { name: 'Bluegill', emoji: '🐟', rarity: 'common', baseValue: 15 },
    { name: 'Salmon', emoji: '🐠', rarity: 'common', baseValue: 25 },
    { name: 'Rainbow Trout', emoji: '🌈', rarity: 'rare', baseValue: 60 },
    { name: 'Moon Fish', emoji: '🌙', rarity: 'epic', baseValue: 120 },
    { name: 'Pearl Carp', emoji: '🦪', rarity: 'rare', baseValue: 50 },
    { name: 'Sunfish', emoji: '☀️', rarity: 'common', baseValue: 20 },
    { name: 'Star Tuna', emoji: '⭐', rarity: 'legendary', baseValue: 250 },
    { name: 'Coral Eel', emoji: '🪸', rarity: 'epic', baseValue: 140 },
  ];
  for (const f of fishData) {
    await prisma.fish.create({ data: f });
  }

  console.log('Seeded catalogs.');

  // Create Player Profiles, Farms, FarmPlots, and Inventories for our main users
  const carrot = await prisma.crop.findUnique({ where: { name: 'Carrot' } });
  const strawberry = await prisma.crop.findUnique({ where: { name: 'Strawberry' } });
  const corn = await prisma.crop.findUnique({ where: { name: 'Corn' } });

  const cow = await prisma.animal.findUnique({ where: { name: 'Cow' } });
  const chicken = await prisma.animal.findUnique({ where: { name: 'Chicken' } });

  // Maya's Game Data
  const profileMaya = await prisma.playerProfile.create({
    data: {
      userId: users.maya.id,
      title: 'Sprout Tender',
      level: 14,
      xp: 2840,
      xpToNext: 4000,
      gold: 8420,
      gems: 36,
      energy: 78,
      maxEnergy: 100,
      streak: 12,
      avatar: '🦊',
    }
  });

  const farmMaya = await prisma.farm.create({
    data: {
      userId: users.maya.id,
      name: 'Mossy Valley',
      level: 3,
    }
  });

  // Create 24 plots for Maya's farm
  for (let i = 0; i < 24; i++) {
    const states = ['empty', 'seeded', 'growing', 'ready', 'empty', 'growing', 'ready', 'empty'];
    const cropCandidates = [carrot, strawberry, corn];
    const cropSelected = cropCandidates[i % cropCandidates.length];
    const state = states[i % states.length];
    
    await prisma.farmPlot.create({
      data: {
        farmId: farmMaya.id,
        index: i,
        state,
        cropId: state !== 'empty' && cropSelected ? cropSelected.id : null,
        plantedAt: state !== 'empty' ? new Date(Date.now() - 5000) : null,
        lastWateredAt: state === 'growing' || state === 'ready' ? new Date() : null,
        watered: state === 'growing',
      }
    });
  }

  // Add animals for Maya
  if (cow && chicken) {
    await prisma.animalInstance.create({
      data: {
        farmId: farmMaya.id,
        animalId: cow.id,
        name: 'Bella',
        happy: 92,
        fed: true,
        fedAt: new Date(),
        readyAt: new Date(Date.now() - 60000), // ready to harvest
      }
    });
    await prisma.animalInstance.create({
      data: {
        farmId: farmMaya.id,
        animalId: chicken.id,
        name: 'Clucky',
        happy: 78,
        fed: true,
        fedAt: new Date(),
        readyAt: new Date(Date.now() + 30000), // ready in 30s
      }
    });
  }

  // Create inventories for Maya
  const inventoryMaya = [
    { name: 'Carrot', emoji: '🥕', qty: 24, category: 'Crops', rarity: 'common' },
    { name: 'Strawberry', emoji: '🍓', qty: 12, category: 'Crops', rarity: 'common' },
    { name: 'Milk', emoji: '🥛', qty: 8, category: 'Produce', rarity: 'common' },
    { name: 'Egg', emoji: '🥚', qty: 14, category: 'Produce', rarity: 'common' },
    { name: 'Rainbow Trout', emoji: '🌈', qty: 3, category: 'Fish', rarity: 'rare' },
    { name: 'Cave Crystal', emoji: '💎', qty: 5, category: 'Materials', rarity: 'rare' },
    { name: 'Iron Ore', emoji: '⛏️', qty: 22, category: 'Materials', rarity: 'common' },
    { name: 'Golden Carrot', emoji: '🥕', qty: 1, category: 'Crops', rarity: 'legendary' },
    { name: 'Watering Can', emoji: '🪣', qty: 1, category: 'Tools', rarity: 'epic' },
    { name: 'Fishing Rod', emoji: '🎣', qty: 1, category: 'Tools', rarity: 'rare' },
    { name: 'Wool', emoji: '🧶', qty: 6, category: 'Produce', rarity: 'common' },
    { name: 'Pumpkin', emoji: '🎃', qty: 3, category: 'Crops', rarity: 'common' },
  ];
  for (const item of inventoryMaya) {
    await prisma.inventoryItem.create({
      data: {
        userId: users.maya.id,
        ...item,
      }
    });
  }

  // Create Quests for Maya
  const questsMaya = [
    { title: 'Water 5 crops', progress: 3, goal: 5, reward: 120, type: 'gold', done: false },
    { title: 'Feed all animals', progress: 4, goal: 6, reward: 80, type: 'xp', done: false },
    { title: 'Catch a fish', progress: 1, goal: 1, reward: 1, type: 'gem', done: true },
    { title: "Visit a friend's farm", progress: 0, goal: 1, reward: 50, type: 'gold', done: false },
  ];
  for (const q of questsMaya) {
    await prisma.quest.create({
      data: {
        userId: users.maya.id,
        ...q,
      }
    });
  }

  // Create Achievements for Maya
  const achievementsMaya = [
    { name: 'First Sprout', desc: 'Plant your first crop', emoji: '🌱', done: true, progress: 1, goal: 1 },
    { name: 'Green Thumb', desc: 'Harvest 100 crops', emoji: '🌾', done: true, progress: 1284, goal: 100 },
    { name: 'Master Angler', desc: 'Catch 50 unique fish', emoji: '🎣', done: false, progress: 28, goal: 50 },
    { name: 'Cave Conqueror', desc: 'Defeat the Cave Troll', emoji: '🗡️', done: false, progress: 0, goal: 1 },
    { name: 'Best Friend', desc: 'Visit 10 friends', emoji: '💖', done: true, progress: 10, goal: 10 },
    { name: 'Tycoon', desc: 'Earn 10,000 gold', emoji: '💰', done: false, progress: 8420, goal: 10000 },
  ];
  for (const ach of achievementsMaya) {
    await prisma.achievement.create({
      data: {
        userId: users.maya.id,
        ...ach,
      }
    });
  }

  // Initialize other members profiles and farms (Noah, Ivy, Leo)
  const usersList = [
    { user: users.noah, name: 'Noah\'s Farm', level: 8, gold: 1200, avatar: '🐸', title: 'Seed Sower' },
    { user: users.ivy, name: 'Ivy\'s Garden', level: 5, gold: 600, avatar: '🐰', title: 'Pet Petter' },
    { user: users.leo, name: 'Leo\'s Meadow', level: 10, gold: 2500, avatar: '🦁', title: 'Cave Climber' },
    { user: users.grandma, name: 'Rose Haven', level: 20, gold: 20000, avatar: '👵', title: 'Flower Master' },
  ];

  for (const { user, name, level, gold, avatar, title } of usersList) {
    await prisma.playerProfile.create({
      data: {
        userId: user.id,
        title,
        level,
        xp: level * 120,
        xpToNext: (level + 1) * 300,
        gold,
        gems: level * 2,
        energy: 100,
        maxEnergy: 100,
        streak: 3,
        avatar,
      }
    });

    const farm = await prisma.farm.create({
      data: {
        userId: user.id,
        name,
        level: Math.ceil(level / 4),
      }
    });

    // Create 24 empty plots
    for (let i = 0; i < 24; i++) {
      await prisma.farmPlot.create({
        data: {
          farmId: farm.id,
          index: i,
          state: 'empty',
        }
      });
    }
  }

  // Create marketplace listings (mock market items)
  const listingsData = [
    { sellerId: users.noah.id, itemName: 'Tulip Bouquet', itemEmoji: '🌷', itemCategory: 'Decor', itemRarity: 'common', price: 240, qty: 1 },
    { sellerId: users.ivy.id, itemName: 'Magic Sapling', itemEmoji: '🌱', itemCategory: 'Seeds', itemRarity: 'epic', price: 1200, qty: 1 },
    { sellerId: users.grandma.id, itemName: 'Honey Jar', itemEmoji: '🍯', itemCategory: 'Produce', itemRarity: 'common', price: 380, qty: 2 },
    { sellerId: users.noah.id, itemName: 'Bread Loaf', itemEmoji: '🍞', itemCategory: 'Produce', itemRarity: 'common', price: 90, qty: 3 },
  ];
  for (const list of listingsData) {
    await prisma.marketplaceListing.create({ data: list });
  }

  // Establish Friendships
  const friendshipsData = [
    { userId: users.maya.id, friendId: users.noah.id },
    { userId: users.maya.id, friendId: users.ivy.id },
    { userId: users.maya.id, friendId: users.leo.id },
    { userId: users.noah.id, friendId: users.ivy.id },
    { userId: users.noah.id, friendId: users.leo.id },
  ];
  for (const friendship of friendshipsData) {
    await prisma.friendship.create({ data: friendship });
  }

  console.log('Seeded Pocket Farm user data successfully!');
  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
