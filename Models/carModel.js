const mongoose = require('mongoose');

//* CAR SCHEMA *
const carSchema = new mongoose.Schema({
  carBrand: {
    type: String,
    required: [true, 'Car brand is required'],
    enum: ["Toyota", "Ford", "Honda", "Volkswagen", "Nissan", "BMW", "Mercedes-Benz", "Audi", "Hyundai", "Tesla", "Subaru", "Mazda", "Lexus", "Jeep", "Volvo", "Porsche"]
  },
  carModel: {
    type: String,
    required: [true, 'Car model is required'],
  },
  bodyType: {
    type: String,
    enum: ["hatchback", "wagon", 'crossover', 'sedan', 'coupe', "suv", "cabriolet"],
    required: [true, 'Body type is required'],
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ["gasoline", "diesel", "hybrid", "electric"]
  },
  consumption: {
    type: Number,
    required: [true, 'Consumption is required'],
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
  },
  carImages: {
    type: [String],
  },
  dailyPrice: {
    required: [true, 'Daily price is required'],
    type: Number
  },
  addedBy : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
},
  {
    toJSON: { // This is for when we want to send the data to the client
      virtuals: true,
      versionKey: false, //! This removes the '__v' field
      transform: function (doc, ret) {
        delete ret.id; //! This removes the 'id' field         
      }
    },
    toObject: { virtuals: true } // This is for when we want to console.log the data
  }
);


//* Pre Hooks *
// Adds a default image if no images are provided
carSchema.pre('save', function (next) {
  if (this.carImages.length === 0) {
    this.carImages.push('default.jpg');
  }
  next();
});



const Car = mongoose.model('Car', carSchema);
module.exports = Car;
