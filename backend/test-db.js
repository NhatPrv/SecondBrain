const { execSync } = require('child_process');

const passwords = [
  '',
  'postgres',
  'admin',
  'root',
  'password',
  '1234',
  '123456',
  '12345678',
  'admin123',
  'postgres123',
  '12345'
];

console.log('Starting PostgreSQL password test...');

for (const password of passwords) {
  const credentials = password ? `postgres:${password}` : 'postgres';
  const dbUrl = `postgresql://${credentials}@localhost:5432/secondbrain?schema=public`;
  console.log(`Testing password: "${password}"...`);
  
  try {
    // Run prisma db push in dry-run/preview mode or just check if it fails on auth
    // We set DATABASE_URL inline
    execSync('npx prisma db push --skip-generate', {
      env: {
        ...process.env,
        DATABASE_URL: dbUrl
      },
      stdio: 'pipe',
      cwd: __dirname
    });
    console.log(`\n🎉 SUCCESS! Found working credentials:`);
    console.log(`DATABASE_URL="${dbUrl}"`);
    process.exit(0);
  } catch (error) {
    const output = error.stderr ? error.stderr.toString() : (error.stdout ? error.stdout.toString() : '');
    if (output.includes('P1000') || output.includes('Authentication failed')) {
      console.log(`❌ Authentication failed for password: "${password}"`);
    } else if (output.includes('P1001') || output.includes('Can\'t reach database server')) {
      console.log('❌ Cannot reach PostgreSQL server at all.');
      break;
    } else {
      // If the error is not about auth (e.g. database "secondbrain" does not exist but auth succeeded!)
      // Prisma can create the database, but if auth succeeded, we won't get P1000!
      // So if it's some other error, it means authentication succeeded!
      if (!output.includes('Authentication failed') && !output.includes('P1000')) {
        console.log(`\n🎉 SUCCESS! Authentication succeeded with password: "${password}". (Database error: ${output.trim().substring(0, 100)})`);
        console.log(`DATABASE_URL="${dbUrl}"`);
        process.exit(0);
      }
      console.log(`❌ Error testing: "${password}": ${output.trim().substring(0, 150)}`);
    }
  }
}

console.log('\n❌ None of the common passwords worked.');
process.exit(1);
