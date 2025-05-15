const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

// Azure SQL configuration
const sqlConfig = {
    user: 'pramod',
    password: 'server@123',
    database: 'mydb',
    server: 'srlogin.database.windows.net',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true, // Required for Azure
        trustServerCertificate: false, // Use true only for local dev with self-signed certificates
    }
};

// ✅ Signup API
app.post('/signup', async (req, res) => {
    const { firstname, lastname, email, password, address, gender, country, dob } = req.body;

    // Check for required fields
    if (!firstname || !lastname || !email || !password || !address || !gender || !country || !dob) {
        return res.status(400).json({ message: 'All fields including DOB are required' });
    }

    try {
        const pool = await sql.connect(sqlConfig);

        // Check if user already exists
        const checkResult = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM [user2] WHERE email = @email');

        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Insert new user
        await pool.request()
            .input('firstname', sql.VarChar, firstname)
            .input('lastname', sql.VarChar, lastname)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .input('address', sql.VarChar, address)
            .input('gender', sql.VarChar, gender)
            .input('country', sql.VarChar, country)
            .input('dob', sql.Date, dob)
            .query(`
                INSERT INTO [user2] (firstname, lastname, email, password, address, gender, country, dob)
                VALUES (@firstname, @lastname, @email, @password, @address, @gender, @country, @dob)
            `);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// ✅ Login API
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query('SELECT * FROM [user2] WHERE email = @email AND password = @password');

        if (result.recordset.length > 0) {
            res.json({ message: 'Login successful', user: result.recordset[0] });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Default API
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// Start server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
