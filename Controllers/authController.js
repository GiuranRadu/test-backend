const User = require('../Models/userModel');
const jwt = require('jsonwebtoken');
const util = require('util');
const sendEmail = require('../Utils/maitrapConfig');
const crypto = require('crypto');
const { CustomError, catchAsync } = require('../Utils/errorHandlers');

// * REGISTER + cookie
//note: aici ne inregistram si ne logam in acelasi timp, deci generam tokenul dupa inregistrare
exports.register = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  console.log(req.body);

  //* 1. Verificăm dacă userul există deja în DB
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return next(new CustomError('You are already registered', 400));
  }

  //* 2. Creăm userul dacă nu există deja
  const newUser = await User.create(req.body);

  const token = createToken(newUser); // generăm tokenul după înregistrare

  //* 3. Setăm cookie-ul JWT
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: false ,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 oră
    // maxAge: 15 * 1000 // 15sec
  });

  //* 4. Setăm parola ca undefined pentru a nu o trimite în răspuns
  newUser.password = undefined;

  //* 5. Răspundem cu succes
  res.status(201).json({
    status: 'success',
    message: `User ${req.body.name} created and logged in`,
    data: newUser
  });
});


//* LOGIN + cookie
//note: aici ne logam cu cookie, deci nu mai trebuie sa trimitem tokenul in body
exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(req.requestedAt);

  //note: Verify if email and password exists in req.body
  if (!email || !password) {
    //! if not email or password 
    return next(new CustomError('Please provide email and password for login', 400));
  }

  //note: Find `user` document in "USERS" collection with specified `email`
  const userDB = await User.findOne({ email: email }).select('+password');
  if (!userDB) {
    //! daca nu gaseste un user cu emailul introdus
    return next(new CustomError('Incorrect email or password', 400));
  }

  //note: Verify if the found `user` password is correct
  const isPasswordValid = await userDB.comparePassword(password, userDB.password); //!boolean

  if (!isPasswordValid) {
    //! daca parola introdusa nu corespunde cu parola din DB
    return next(new CustomError('Incorrect email or password', 400));
  }

  //note: aici am trecut si de validarea parolei, urmeaza sa generam un token jwt
  const token = createToken(userDB); // Generam un token JWT securizat

  //note: Setam JWT-ul in cookie cu httpOnly + secure pentru productie
  res.cookie('jwt', token, {
    httpOnly: true, // nu poate fi accesat din JavaScript
    secure: false, // true doar in productie (HTTPS)
    sameSite: 'lax', // protejeaza impotriva CSRF
    maxAge: 60 * 60 * 1000 // valabil 1 ora
    // maxAge: 15 * 1000 // valabil 15 sec
  });

  userDB.password = undefined; // Stergem parola inainte de a trimite user-ul în response

  //note: returnam mesajul + datele userului, tokenul e deja in cookie
  res.status(200).json({
    status: "success",
    message: "Logged in successfully with cookie",
    data: userDB
  });
});


//* LOGOUT + cookie
//note Pentru ca frontendul NU poate sterge un cookie HttpOnly, trebuie sa-i spunem serverului sa faca asta -> sterge cookie-ul JWT de pe client.
//! Daca cookie-ul e simplu (fara flags, adica secure, sameSite, httpOnly), putem sa folosim res.clearCookie('jwt').
//! res.clearCookie() e mai rapid, dar poate esua daca nu specifici aceleasi opțiuni ca la setare.
//note: In cazul nostru, cookie-ul este setat cu httpOnly, secure si sameSite, deci trebuie sa-l stergem manual folosind aceleasi optiuni.
exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: new Date(0) // Cookie expirat = sters
  });

  res.status(200).json({ message: 'Logged out successfully' });
};


//* PROTECT -> check if `user` is logged in -> block routes when `user` is NOT logged in
exports.protected = catchAsync(async (req, res, next) => {
  //* 1. Verificăm dacă tokenul există în cookie  
  console.log('cookies:', req.cookies);
  const token = req.cookies.jwt;

  if (!token) {
    return next(new CustomError("You are not logged in", 401));
  }

  //* 2. Verificăm dacă tokenul este valid
  const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);

  //* 3. Verificăm dacă userul din token mai există în baza de date
  const currentUser = await User.findById(decodedToken.id);
  if (!currentUser) {
    return next(new CustomError("The user doesn't exist", 401));
  }

  //* 4. Atașăm userul la req pentru a fi folosit în următorul controller
  req.user = currentUser;
  next();
});


//* PROFILE -> return user data
exports.profile = (req, res) => {
    res.status(200).json({
    status: 'success',
    user: req.user // `req.user` vine din middleware-ul `protected`
  });
}

//* RESTRICT TO -> restrict access to certain routes based on `user` role (by example -> only admin can delete other users)
exports.restrictIfNotAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return next(new CustomError("You don't have permission to perform this action", 403));
};


//* FORGOT password 
exports.forgotPassword = catchAsync(async (req, res) => {
  //. 1. Găsește utilizatorul după email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new CustomError('There is no user with this email address', 404));
  }

  //. 2. Generează tokenul de resetare
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //. 3. Trimite tokenul pe email
  const resetURL = `${req.protocol}://${req.get('host')}/login/resetPassword/${resetToken}`;
  const message = `Forgot your password?\n\n✅Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n\nYour reset code is: ${resetToken} \n\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min)',
      message,
      html: `<h1>Reset your password</h1>`
    });

    return res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });

  } catch (emailError) {
    //! Șterge tokenul dacă trimiterea emailului a eșuat
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new CustomError('There was an error sending the email. Try again later!', 500));
  }
})


//* RESET password 
exports.resetPassword = catchAsync(async (req, res, next) => {
  //. 1. Get user based on the token (tokenul este acela din 6 cifre din email)
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  //. 2. If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new CustomError('Token is invalid or has expired', 400));
  }

  //note: setam noua parola si confirmPassword (in cazul in care vrem sa facem validari pe confirmPassword)
  user.password = req.body.password
  user.confirmPassword = req.body.confirmPassword
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //. 3. Log the user in, send JWT  
  const token = createToken(user);

  res.status(200).json({
    status: "succes",
    token,
  })
})

function createToken(user) {
  const token = jwt.sign({ id: user._id }, process.env.SECRET_STR, { expiresIn: process.env.LOGIN_EXPIRES });
  return token;
}

