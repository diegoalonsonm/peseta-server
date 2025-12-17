import bcrypt from 'bcrypt';
import { db } from './Models/database/db.js';

const email = 'diegoalonsonm@gmail.com';
const passwordToTest = 'MUee#TQY';

console.log('Checking user:', email);
console.log('Password to test:', passwordToTest);
console.log('---\n');

try {
    const users = await db.sequelize.query('SELECT * FROM users WHERE email = :email', {
        replacements: { email },
        type: db.sequelize.QueryTypes.SELECT
    });

    if (users.length === 0) {
        console.log('❌ User NOT found in database');
        process.exit(1);
    }

    const user = users[0];
    console.log('✓ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name, user.lastName);
    console.log('  Password stored in DB:', user.password);
    console.log('  Password starts with $2b$ (hashed)?', user.password.startsWith('$2b$'));
    console.log('---\n');

    // Test if it's a plain text password
    if (user.password === passwordToTest) {
        console.log('✓ Password matches (PLAIN TEXT)');
        console.log('⚠️  You need to run the migration script to hash passwords');
    } else if (user.password.startsWith('$2b$')) {
        // It's hashed, try to compare
        const isMatch = await bcrypt.compare(passwordToTest, user.password);
        console.log('Password comparison result:', isMatch);
        if (isMatch) {
            console.log('✓ Password is correct (HASHED)');
        } else {
            console.log('❌ Password does NOT match the hash');
            console.log('   The stored password is different from what you\'re trying');
        }
    } else {
        console.log('❌ Password does NOT match');
        console.log('   Stored password:', user.password);
        console.log('   Trying password:', passwordToTest);
    }

    process.exit(0);
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
