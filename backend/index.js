const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

mongoose.connect(`mongodb+srv://${process.env.USER_BD}:${process.env.PASS_BD}@cluster0.tosktcp.mongodb.net/${process.env.BASEDATOS}?retryWrites=true&w=majority`)
  .then(() => {
    console.log('MongoDB Conectado');

    app.get('/', (req, res) => {
      res.render('paginas/inicio');
    });

  })
  .catch(err => {
    console.error('Error de conexión MongoDB:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)});
    