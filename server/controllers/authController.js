const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Auth } = require('../models/tableSchema');

exports.register = async (req, res) => {
    try {
        const { name, age, gender, phone, email, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const newUser = await User.create({ name, age, gender, phone, email });
        const hashedPassword = await bcrypt.hash(password, 10);
        await Auth.create({ userId: newUser.id, passwordHash: hashedPassword });

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const user = await User.findOne({ where: { email }, include: Auth });

//         if (!user || !(await bcrypt.compare(password, user.Auth.passwordHash))) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }

//         const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
//         res.json({ token, user });
//     } catch (error) {
//         res.status(500).json({ error: 'Login failed' });
//     }
// };

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email }, include: Auth });

        if (!user || !(await bcrypt.compare(password, user.Auth.passwordHash))) {
            console.log("❌ Invalid login attempt");
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log("✅ Login successful for user:", user.id);

        // Send token and success response
        res.json({
            message: "Login successful!", 
            token, 
            userId: user.id
        });

    } catch (error) {
        console.error("❌ Login failed:", error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};


