/**
 * Database Initialization Script
 * Creates tables if they don't exist
 * Run with: npm run db:init
 */
const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    const phase2SchemaPath = path.join(__dirname, '..', '..', 'database', 'phase2_schema.sql');
    const phase3SchemaPath = path.join(__dirname, '..', '..', 'database', 'phase3_schema.sql');
    const phase4SchemaPath = path.join(__dirname, '..', '..', 'database', 'phase4_schema.sql');
    const phase5SchemaPath = path.join(__dirname, '..', '..', 'database', 'phase5_schema.sql');
    const phase5SeedPath = path.join(__dirname, '..', '..', 'database', 'phase5_seed.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const phase2Schema = fs.readFileSync(phase2SchemaPath, 'utf-8');
    const phase3Schema = fs.readFileSync(phase3SchemaPath, 'utf-8');
    const phase4Schema = fs.readFileSync(phase4SchemaPath, 'utf-8');
    const phase5Schema = fs.readFileSync(phase5SchemaPath, 'utf-8');
    const phase5Seed = fs.readFileSync(phase5SeedPath, 'utf-8');

    console.log('🔄 Initializing database schema...');
    await client.query(schema);
    console.log('✅ Base schema initialized');

    console.log('🔄 Initializing Phase 2 schema...');
    await client.query(phase2Schema);
    console.log('✅ Phase 2 schema initialized successfully');

    console.log('🔄 Initializing Phase 3 schema...');
    await client.query(phase3Schema);
    console.log('✅ Phase 3 schema initialized successfully');

    console.log('🔄 Initializing Phase 4 schema...');
    await client.query(phase4Schema);
    console.log('✅ Phase 4 schema initialized successfully');

    console.log('🔄 Initializing Phase 5 schema...');
    await client.query(phase5Schema);
    console.log('✅ Phase 5 schema initialized successfully');

    console.log('🔄 Checking Phase 5 seed data...');
    const uniCheck = await client.query('SELECT COUNT(*) FROM universities');
    if (parseInt(uniCheck.rows[0].count, 10) === 0) {
      console.log('🔄 Loading Phase 5 seed data...');
      await client.query(phase5Seed);
      console.log('✅ Phase 5 seed data loaded successfully');
    } else {
      console.log(`ℹ️ Seed data already initialized (${uniCheck.rows[0].count} universities found). Skipping seed insertion.`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
