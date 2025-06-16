const express = require('express');
const router = express.Router();
const carsController = require('./../Controllers/carsController')
const { protected, restrictIfNotAdmin } = require('./../Controllers/authController')

// router.use(protected); // Protect all routes after this middleware

/**
 * @route GET /cars/groupByBrand/
 * @description Get all featured cars grouped by brand
 */
router.route('/groupByBrand').get(carsController.groupCarsByMake);


/**
 * @route POST /cars/
 * @description Add a new car
 */
router.route('/').post(protected, carsController.createCar);


/**
 * @route GET /cars/:id
 * @description Get a car by ID
 */
router.route('/:id').get(carsController.getCarById);


/**
 * @route DELETE /cars/:id
 * @description Delete a car by ID
 */
router.route('/:id').delete(protected, carsController.deleteCarById);


/**
 * @route PATCH /cars/:id
 * @description Update a car (partial update)
 */
router.route('/:id').patch(carsController.updateCarById);


/**
 * @route GET /cars/
 * @description Get all cars
 */
router.route('/').get(protected, carsController.getAllCars);


module.exports = router;
