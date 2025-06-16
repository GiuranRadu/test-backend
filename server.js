const dotenv = require('dotenv'); //!astea trebuie sa fie inaintea constantei `app`
dotenv.config({ path: './config.env' }); //! ruta catre fisierul de configurare

//-> SAFETY NET error handlers -> must be on the top level of the page, before `app`
process.on('uncaughtException', (err) => {
  console.log(`\x1b[31m ${err.stack} \x1b[0m`);
  console.log('❌ Uncaught exception occured! Please resolve... ❌');
});

const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server has started on port: ${port}... ✅ `);
});


const mongoose = require('mongoose');


mongoose.connect(process.env.CONN_STR)
  .then(() => {
    console.log('🚗🚙 myCarPicks 🚗🚙 -> DB connection established... ✅');
  })
  .catch(err => {
    console.error('❌ Database connection failed!', err.message);
  });
