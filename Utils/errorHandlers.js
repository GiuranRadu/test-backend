class CustomError extends Error {
  constructor(message, statusCode) {
    // clasa Error stie deja cum sa afiseze mesajul de eroare, dar noi vreau sa il personalizam
    // apeleaza constructorul clasei parinte Error. pentru a extinde clasa Error
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'failed' : 'error';


    // captureStackTrace este o metoda statica a clasei Error care captureaza stack trace-ul
    // param targetObject: obiectul pe care vrem să salvăm informația (this, adică eroarea noastră).
    // param constructorFunction: din ce punct vrem să începem să generăm mesajul de eroare (stack trace).
    // construiește frumos raportul despre unde s-a întâmplat problema
    Error.captureStackTrace(this, this.constructor);
  }
}

//* catchAsync este o functie care primeste ca parametru o functie care returneaza o promisiune
//note: fn poate fi functia de register/login/createCar/getCarById sau orice alta functie care returneaza o promisiune
// si returneaza o alta functie care va prinde eroarea si o va trimite la middleware-ul de eroare
// middleware-ul de eroare este o functie care va prinde eroarea si o va trimite la client si este declarat in app.js
function catchAsync (fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};


const errorHandlers = { CustomError, catchAsync }

module.exports = errorHandlers;