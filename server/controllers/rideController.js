const { Ride } = require('../models/tableSchema');
const { Op, where } = require('sequelize');

exports.createRide = async (req, res) => {

    try {
        const { driverId, vehicleType, seatsAvailable, price, src, dest } = req.body;
        const ride = await Ride.create({
            riderId : req.user.userId, 
            driverId,
            vehicleType,
            seatsAvailable,
            price,
            src,
            dest,
            status: 'pending',
        });
        console.log("ride ",ride);
        ride.save();
        res.status(201).json(ride);
    } catch (error) {
        console.log("error ",error);
        res.status(500).json({ error: 'Failed to create ride' });
    }
};

exports.bookRide = async (req, res) => {
    try {
        const ride = await Ride.findByPk(req.params.id);
        if (!ride || ride.status !== 'pending') return res.status(404).json({ message: 'Ride not available' });

        // ride.riderId = req.user.userId;
        ride.status = 'ongoing';
        await ride.save();

        res.json({ message: 'Ride booked successfully!', ride });
    } catch (error) {
        res.status(500).json({ error: 'Failed to book ride' });
    }
};

exports.completeRide = async (req, res) => {
    try {
        const ride = await Ride.findByPk(req.params.id);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        ride.status = 'completed';
        await ride.save();

        res.json({ message: 'Ride completed successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete ride' });
    }
};

exports.getAvailableRides = async (req, res) => {
    try {
        // Fetching the rides along with rider and vehicle details
        const rides = await Ride.findAll();
        res.json(rides);  // Send the rides data with rider and vehicle details
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch ride requests' });
    }
};

exports.getRidebyId = async (req, res) => {
    const Id = req.params.id;
    console.log(Id);
    try{
        const ride = await Ride.findByPk(Id);
        res.json(ride);
    }catch{
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch ride request' });
    }
}
 