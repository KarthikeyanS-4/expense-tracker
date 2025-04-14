const { Driver, User } = require('../models/tableSchema');

exports.registerDriver = async (req, res) => {
    try {
        const vehicleType=req.body.vehicleType;
        const origin=req.body.origin;
        const destination=req.body.destination;
        const price=req.body.price;
        const registrationNumber=req.body.registrationNumber;
        const licenseNumber=req.body.licenseNumber;
        const licenseHolderName=req.body.licenseHolderName;
        const availability=req.body.availability;
        // const { vehicleType, origin, destination, price, registrationNumber, licenseNumber, licenseHolderName } = req.body;
        console.log(req.body);
        
        
        const driver = await Driver.create({
            userId: req.user.userId, 
            vehicleType,
            origin,
            destination,
            price,
            registrationNumber,
            licenseNumber,
            licenseHolderName,
            status: 'pending'
        });

        res.status(201).json(driver);
    } catch (error) {
        console.log("error ",error);
        
        res.status(500).json({ error: 'Failed to register driver' });
    }
};

exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.findAll({ include: User });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};