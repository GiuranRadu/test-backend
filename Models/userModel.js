const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

//* USER SCHEMA *
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [20, 'Name must not exceed 20 characters'],
    minlength: [3, 'Name must have at least 3 characters'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, "Age field is required"],
    min: [16, "Age must be between 16 and 60"],
    max: [60, "Age must be between 16 and 60"]
  },
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    validate: {
      validator: function (value) {
        // Custom validator to check for at least 8 characters,1 number, and 1 special character
        const regex = /^(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

        return regex.test(value);
      },
      message: "Password must have a minimum length of 8 characters, at least 1 number, and 1 special character",
    },
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (value) {
        return value === this.password
      },
      message: 'Passwords & Confirm Password does not match'
    },
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  addedCars: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car'
    }
  ],
  passwordResetToken: String,
  passwordResetExpires: Date,
})

//* PRE-SAVE Hook - hash password 
userSchema.pre('save', async function (next) {
  let user = this //! this = req.body
  // isModified('password') verifica daca campul password a fost modificat.
  // Daca user-ul modifica doar email-ul/varsta/nume etc (fara sa schimbe parola), nu vrem sa hash-uim parola din nou.
  // Daca parola nu a fost modificata, apelam `next()` si iesim din middleware. Nu o mai hash-uim.
  if (!user.isModified('password')) {
    next();
  }

  // Hash-uim parola cu bcrypt
  this.password = await bcrypt.hash(this.password, 10);

  // Eliminam confirmPassword inainte de salvare (astfel nu va fi salvat in documentul din DB)
  this.confirmPassword = undefined;

  // Adaugam un camp `role` default 'user' inainte de salvare (poate avem vreun programator care nu a setat rolul explicit)
  this.role = 'user';

  next();
})

//* COMPARE password from req.body with DB hashed password (la login)
userSchema.methods.comparePassword = async function (passwordBody, passwordDB) {
  return await bcrypt.compare(passwordBody, passwordDB) //!boolean
}

//*CREATE TOKEN for password reset 
userSchema.methods.createPasswordResetToken = async function () {
  // Generam un token (6 digits)
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  // Hashuim tokenul pentru a-l salva in DB (pentru a nu-l salva in clar, adica acele 6 digits) , folosind sha256 (il transforma in string de 64 de caractere)
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  console.log({ resetToken }, this.passwordResetToken);

  // Setam cand se expire tokenul (10 minutes from now)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; 

  return resetToken;
};


//* Aici se creeaza colectia `USERS` , din User -> Users
const User = mongoose.model('User', userSchema);
module.exports = User