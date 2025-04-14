const DataTypes = require('sequelize');
const sequelize = require('../database/db');

// User Model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
}, {
    timestamps: false,
});

// Driver Model
const Driver = sequelize.define('Driver', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    vehicleType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    availability: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
    origin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    destination: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    registrationNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    licenseNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    licenseHolderName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    helmetRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    timestamps: false,
});

Driver.belongsTo(User, { foreignKey: 'userId' });

// Ride Model
const Ride = sequelize.define('Ride', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    riderId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    vehicleType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
    },
    seatsAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    src: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dest: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false,
});

// Rating Model
const Rating = sequelize.define('Rating', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    rideId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Ride,
            key: 'id',
        },
    },
    givenBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: false,
});

Rating.belongsTo(Ride, { foreignKey: 'rideId' });
Rating.belongsTo(User, { foreignKey: 'givenBy' });

// Auth Model
const Auth = sequelize.define('Auth', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    timestamps: false,
});

Auth.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Auth, { foreignKey: 'userId' });

// TripHistory Model
const TripHistory = sequelize.define('TripHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Driver,
            key: 'id',
        },
    },
    rideId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Ride,
            key: 'id',
        },
    },
    fare: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

TripHistory.belongsTo(Driver, { foreignKey: 'driverId' });
TripHistory.belongsTo(Ride, { foreignKey: 'rideId' });

module.exports = {
    User,
    Driver,
    Ride,
    Rating,
    Auth,
    TripHistory,
};