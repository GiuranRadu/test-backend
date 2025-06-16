const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

//* Rutele aplicației
const carRoutes = require('./Routes/carsRoutes');
const authRoutes = require('./Routes/authRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const uploadImageRoute = require('./Routes/uploadImageRoute');

//* Clasa noastra personalizata de erori (CustomError)
const { CustomError } = require('./Utils/errorHandlers');

const app = express();

//* Middleware global - transformă body-ul JSON în obiect JS
app.use(express.json());

//* Middleware pentru a putea accesa cookie-urile din request (ex: req.cookies.jwt)
app.use(cookieParser()); // 🔥 esențial pentru req.cookies.jwt


//* Middleware pentru CORS (permite accesul din alte browsere sau servere)
app.use(cors({
  origin: 'http://localhost:5173', // frontend
  credentials: true // 🔥 OBLIGATORIU pentru cookie-uri
}));

//* Middleware personalizat - adaugă timestamp pentru fiecare request
app.use((req, _res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

//* ROUTES
app.get('/', (req, res) =>  res.send('Default route of myCarPicks project'));
app.use('/cars', carRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/uploadImage', uploadImageRoute);

//* RUTA PENTRU RUTE NEEXISTENTE (404)
app.all('*', (req, res, next) => {
  next(new CustomError(`Route ${req.originalUrl} not found`, 404));
});

//* MIDDLEWARE GLOBAL DE EROARE
app.use((err, req, res, next) => {
  //note: MongoDB/Mongoose → genereaza erori fara statusCode
  //note: Dacă eroarea este una bruta (ex: Mongo), nu are statusCode si se transforma automat in 500 (Internal Server Error)
  //! real-life ar trebui sa handluim erorile manual in functie de tipul de eroare. (vezi in app_cu_toate_erorile.js) -> nu vom face asta acum
  err.statusCode = err.statusCode || 500; // fallback la 500 
  err.status = err.status || 'error';     // fallback la "error"

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
