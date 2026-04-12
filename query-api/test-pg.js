const { Pool } = require('pg');

// Test 1 — hardcoded 127.0.0.1
async function test1() {
  console.log('\n--- Test 1: host=127.0.0.1 ---');
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'alerts',
  });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS:', res.rows[0]);
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

// Test 2 — hardcoded localhost
async function test2() {
  console.log('\n--- Test 2: host=localhost ---');
  const pool = new Pool({
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'alerts',
  });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS:', res.rows[0]);
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

// Test 3 — connection string
async function test3() {
  console.log('\n--- Test 3: connection string ---');
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/alerts',
  });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS:', res.rows[0]);
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

// Test 4 — no password (trust auth)
async function test4() {
  console.log('\n--- Test 4: trust (no password) ---');
  const pool = new Pool({
    host:     '127.0.0.1',
    port:     5432,
    user:     'postgres',
    database: 'alerts',
    password: '',
  });
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS:', res.rows[0]);
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  await test1();
  await test2();
  await test3();
  await test4();
  console.log('\nDone.');
}

main();