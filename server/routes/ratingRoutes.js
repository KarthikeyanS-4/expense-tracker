const express = require('express');
const { Rating } = require('../models/tableSchema');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Submit a Rating
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { rideId, rating, feedback } = req.body;
        await Rating.create({ rideId, givenBy: req.user.userId, rating, feedback });

        res.status(201).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

module.exports = router;
