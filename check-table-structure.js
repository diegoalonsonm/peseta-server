import { db } from './Models/database/db.js';

console.log('Checking users table structure...\n');

try {
    const [results] = await db.sequelize.query('DESCRIBE users');

    console.log('Users table structure:');
    console.table(results);

    const passwordField = results.find(field => field.Field === 'password');
    console.log('\nPassword field details:');
    console.log('  Type:', passwordField.Type);
    console.log('  Max length:', passwordField.Type.match(/\d+/)?.[0] || 'unknown');
    console.log('\n⚠️  Bcrypt hashes need VARCHAR(60) or more');

    const maxLength = parseInt(passwordField.Type.match(/\d+/)?.[0] || 0);
    if (maxLength < 60) {
        console.log('❌ Password field is too small!');
        console.log(`   Current: VARCHAR(${maxLength})`);
        console.log('   Required: VARCHAR(60)');
    }

    process.exit(0);
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
