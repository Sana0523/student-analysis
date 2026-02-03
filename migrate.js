/**
 * Database Migration Script
 * ==========================
 * This script addresses the audit finding:
 * "NO DATABASE SCHEMA FOUND in workspace"
 * 
 * Usage: npm run migrate
 * 
 * Features:
 * - Reads and executes schema.sql
 * - Creates all tables with proper constraints
 * - Seeds initial data with hashed passwords
 * - Provides clear success/error messages
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Configuration from environment
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_analysis',
    multipleStatements: true, // Required for executing schema.sql
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    console.log(`${colors.cyan}[Step ${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
}

async function createDatabaseIfNotExists(connection) {
    logStep(1, 'Checking if database exists...');
    
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await connection.query(`USE \`${dbConfig.database}\``);
        logSuccess(`Database '${dbConfig.database}' is ready`);
    } catch (error) {
        throw new Error(`Failed to create database: ${error.message}`);
    }
}

async function executeSchema(connection) {
    logStep(2, 'Reading schema.sql...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    let schema = fs.readFileSync(schemaPath, 'utf8');
    logSuccess('Schema file loaded');
    
    logStep(3, 'Executing schema (creating tables)...');
    
    // Split schema into individual statements and filter out empty ones
    // We need to handle the schema carefully due to multi-statement execution
    try {
        // Remove the seed data section - we'll handle it separately with proper password hashing
        const seedDataMarker = '-- INITIAL SEED DATA';
        const seedDataIndex = schema.indexOf(seedDataMarker);
        
        if (seedDataIndex !== -1) {
            // Get only the schema part (tables, views, etc.)
            const schemaOnly = schema.substring(0, seedDataIndex);
            await connection.query(schemaOnly);
            logSuccess('Tables and views created successfully');
        } else {
            await connection.query(schema);
            logSuccess('Schema executed successfully');
        }
    } catch (error) {
        // If error is about syntax, try executing statement by statement
        if (error.code === 'ER_PARSE_ERROR') {
            logError('Multi-statement execution failed, trying individual statements...');
            await executeStatementsIndividually(connection, schema);
        } else {
            throw error;
        }
    }
}

async function executeStatementsIndividually(connection, schema) {
    // Split by semicolon but be careful with strings
    const statements = schema
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
        try {
            if (statement.toLowerCase().startsWith('insert')) {
                // Skip INSERT statements - we'll handle seeding separately
                continue;
            }
            await connection.query(statement);
        } catch (error) {
            // Ignore "table already exists" errors
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                console.warn(`Warning: ${error.message}`);
            }
        }
    }
    logSuccess('Tables created (individual execution)');
}

async function seedData(connection) {
    logStep(4, 'Seeding initial data...');
    
    // Hash password for seed users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    try {
        // Check if users already exist
        const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
        
        if (existingUsers[0].count > 0) {
            log('  Users already exist, skipping user seed...', 'yellow');
        } else {
            // Insert users with properly hashed passwords
            await connection.query(`
                INSERT INTO users (email, password_hash, role) VALUES
                (?, ?, 'teacher'),
                (?, ?, 'student'),
                (?, ?, 'student')
            `, [
                'teacher@school.vps', passwordHash,
                'student@school.vps', passwordHash,
                'alice@school.vps', passwordHash
            ]);
            logSuccess('Users seeded (3 users with hashed passwords)');
        }
        
        // Check if students already exist
        const [existingStudents] = await connection.query('SELECT COUNT(*) as count FROM students');
        
        if (existingStudents[0].count > 0) {
            log('  Students already exist, skipping student seed...', 'yellow');
        } else {
            // Get user IDs for linking
            const [users] = await connection.query("SELECT id FROM users WHERE email = 'alice@school.vps'");
            const aliceUserId = users.length > 0 ? users[0].id : null;
            
            // Insert students
            await connection.query(`
                INSERT INTO students (id, user_id, name, email, age, study_hours, failures, absences) VALUES
                ('st1', ?, 'Alice Johnson', 'alice@school.vps', 16, 15, 0, 1),
                ('st2', NULL, 'Bob Smith', 'bob@school.vps', 15, 12, 1, 4),
                ('st3', NULL, 'Charlie Brown', 'charlie@school.vps', 16, 18, 0, 0)
            `, [aliceUserId]);
            logSuccess('Students seeded (3 students)');
        }
        
        // Check if grades already exist
        const [existingGrades] = await connection.query('SELECT COUNT(*) as count FROM grades');
        
        if (existingGrades[0].count > 0) {
            log('  Grades already exist, skipping grade seed...', 'yellow');
        } else {
            // Insert grades
            await connection.query(`
                INSERT INTO grades (student_id, subject, score, max_marks, grade, date) VALUES
                ('st1', 'Math', 88, 100, 'B+', '2024-01-15'),
                ('st1', 'Science', 92, 100, 'A', '2024-01-16'),
                ('st1', 'History', 75, 100, 'C+', '2024-01-17'),
                ('st2', 'Math', 65, 100, 'D', '2024-01-15'),
                ('st2', 'Science', 72, 100, 'C', '2024-01-16'),
                ('st3', 'Math', 95, 100, 'A+', '2024-01-15'),
                ('st3', 'English', 89, 100, 'B+', '2024-01-16')
            `);
            logSuccess('Grades seeded (7 grade records)');
        }
        
        // Check if predictions already exist
        const [existingPredictions] = await connection.query('SELECT COUNT(*) as count FROM predictions');
        
        if (existingPredictions[0].count > 0) {
            log('  Predictions already exist, skipping prediction seed...', 'yellow');
        } else {
            // Insert predictions
            await connection.query(`
                INSERT INTO predictions (student_id, predicted_grade, risk_level, confidence) VALUES
                ('st1', 85.50, 'Low', 85.0),
                ('st2', 68.00, 'Medium', 78.0),
                ('st3', 92.00, 'Low', 92.0)
            `);
            logSuccess('Predictions seeded (3 prediction records)');
        }
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            log('  Some seed data already exists, skipping duplicates...', 'yellow');
        } else {
            throw error;
        }
    }
}

async function verifyTables(connection) {
    logStep(5, 'Verifying table creation...');
    
    const expectedTables = ['users', 'students', 'grades', 'predictions'];
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    for (const table of expectedTables) {
        if (tableNames.includes(table)) {
            const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
            logSuccess(`Table '${table}' exists (${rows[0].count} rows)`);
        } else {
            logError(`Table '${table}' NOT FOUND`);
        }
    }
}

async function migrate() {
    console.log('\n' + '='.repeat(50));
    log('  Student Analysis Dashboard - Database Migration', 'bold');
    console.log('='.repeat(50) + '\n');
    
    log(`Database: ${dbConfig.database}`, 'cyan');
    log(`Host: ${dbConfig.host}`, 'cyan');
    log(`User: ${dbConfig.user}\n`, 'cyan');
    
    let connection;
    
    try {
        // Connect without database first (to create it if needed)
        const connectionWithoutDb = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            multipleStatements: true,
        });
        
        await createDatabaseIfNotExists(connectionWithoutDb);
        await connectionWithoutDb.end();
        
        // Connect to the database
        connection = await mysql.createConnection(dbConfig);
        
        await executeSchema(connection);
        await seedData(connection);
        await verifyTables(connection);
        
        console.log('\n' + '='.repeat(50));
        log('  ✓ Migration completed successfully!', 'green');
        console.log('='.repeat(50) + '\n');
        
        log('Next steps:', 'cyan');
        log('  1. Verify your .env.local has correct DB credentials', 'reset');
        log('  2. Run: npm run dev', 'reset');
        log('  3. Test login with: teacher@school.vps / password123\n', 'reset');
        
    } catch (error) {
        console.log('\n' + '='.repeat(50));
        logError(`Migration failed: ${error.message}`);
        console.log('='.repeat(50) + '\n');
        
        log('Troubleshooting:', 'yellow');
        log('  1. Check .env.local has correct DB_HOST, DB_USER, DB_PASSWORD', 'reset');
        log('  2. Ensure MySQL server is running', 'reset');
        log('  3. Verify user has CREATE DATABASE privileges\n', 'reset');
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration
migrate();
