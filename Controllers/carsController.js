const Car = require('./../Models/carModel')
const User = require('./../Models/userModel');


//* CREATE CAR
exports.createCar = async (req, res) => {
  console.log(req.user);
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: `No user found with id ${req.user.id}`
      });
    }

    let carPlusCreator = { ...req.body, addedBy: req.user.id };
    const newCar = await Car.create(carPlusCreator);

    //note: Adauga ID-ul masinii in lista utilizatorului `addedCars` folosing JS pur
    user.addedCars.push(newCar._id);

    //note: Adauga ID-ul masinii in lista utilizatorului folosind MongoDB
    // await User.updateOne(
    //   { _id: req.user.id },
    //   { $push: { addedCars: newCar._id } }
    // );

    //note: Salvează utilizatorul cu noua masina adaugata
    await user.save({
      validateModifiedOnly: true // Salveaza doar campurile modificate
    });

    res.status(201).json({
      status: 'success',
      data: newCar
    });

  } catch (error) {
    res.status(400).json({
      status: 'failed',
      message: error.message
    });
  }
}

//* GET CAR BY ID
exports.getCarById = async (req, res) => {
  console.log(req.params);
  try {
    // Find car by ID
    const foundCar = await Car.findById(req.params.id);

    // If no car is found, return 404
    if (!foundCar) {
      return res.status(404).json({
        status: 'failed',
        message: `No car found with id ${req.params.id}`
      });
    }

    // If car is found, return it
    res.status(200).json({
      status: 'success',
      data: foundCar
    });

  } catch (error) {
    res.status(500).json({
      status: 'Something went wrong2222',
      error: error.message
    })
  }
};


//* DELETE CAR BY ID
exports.deleteCarById = async (req, res) => {
  try {
    //note: Find the user by ID from the token (din protected)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'failed',
        message: `No user found with id ${req.user.id}`
      });
    }

    //note: Find the car we want to delete => by ID
    const carToDelete = await Car.findById(req.params.id);
    if (!carToDelete) {
      return res.status(404).json({
        status: 'failed',
        message: `No car found with id ${req.params.id}`
      });
    }

    //note: Check if the car belongs to the user => if the user making the request is the  creator of the car
    if (!user.addedCars.includes(carToDelete._id)) {
      return res.status(403).json({
        status: 'failed',
        message: `You are not authorized to delete this car`
      });
    }

    //note: Sterge masina din addedCars array folosind JS pur.
    // user.addedCars = user.addedCars.filter(carId => carId.toString() !== req.params.id.toString());

    //note: Sterge masina din addedCars folosing o metoda mongoose
    user.addedCars.pull(carToDelete._id);

    //note: Save the user with the updated addedCars array
    await user.save({
      validateModifiedOnly: true // Save only modified fields, permite salvarea partiala a documentului, fara a verifica toate campurile
    });

    //note: Delete the car
    await Car.findByIdAndDelete(req.params.id); // Șterge mașina (nu mai verifici rezultatul)


    res.status(200).json({
      message: 'Car deleted successfully',
    });


  } catch (error) {
    res.status(500).json({
      status: 'Something went wrong',
      error: error.message
    })
  }
};


//* UPDATE CAR BY ID
exports.updateCarById = async (req, res) => {
  try {
    const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,         // Returnează mașina actualizată
      runValidators: false // Validează datele
    });

    if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.status(200).json({
      status: 'success',
      data: updatedCar
    });

  } catch (error) {
    res.status(500).json({
      status: 'Something went wrong',
      error: error.message
    })
  }
};


//* GET ALL CARS
exports.getAllCars = async (req, res) => {
  try {
    const cars = await Car.find();

    res.status(200).json({
      status: 'success',
      results: cars.length,
      data: cars
    });

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};


//* GROUP CARS BY MAKE
exports.groupCarsByMake = async (req, res) => {
  try {
    const groupedCars = await Car.aggregate([
      {
        $group: {
          _id: '$carBrand',
          //* INCLUDE ALL FIELDS OF THE CAR
          // cars: { $push: '$$ROOT' } // Include all fields of the car

          //* INCLUDE SPECIFIC FIELDS OF THE CAR
          // cars: {
          //   $push: {
          //     carBrand: '$carBrand',
          //     carModel: '$carModel',
          //     year: '$year',
          //     _id: '$_id'              
          //   }
          // } // Include only specific fields of the car

          //* RETURNS THE BRAND COUNT
          // count: { $sum: 1 } //util pentru a trimite doar numarul de masini (ex autovit.ro)

          //* CALCULATE THE AVERAGE PRICE OF BRANDS
          averagePrice: { $avg: '$dailyPrice' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: groupedCars
    });

  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
