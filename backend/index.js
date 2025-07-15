const express = require('express'); //importamos express que es el framework que usamos para crear servidores en Node.js
const mongoose = require('mongoose'); //importamos mongoose, que es un ODM (Object Data Modeling) para MongoDB y Node.js
const path = require('path'); //importamos path, que es un módulo nativo de Node.js que nos permite trabajar con rutas de archivos y directorios
const dotenv = require('dotenv'); //importamos dotenv, que es un paquete que carga variables de entorno desde un archivo .env (donde podemos guardar configuraciones sensibles como puertos o claves API, usuarios, contraseñas, etc.)

dotenv.config(); //activa la carga de variables de entorno desde el archivo .env

const app = express(); //creamos una instancia de express, que es nuestra aplicación web
const PORT = process.env.PORT || 3333; // definimos el puerto en el que escuchará nuestro servidor, ya sea el que esté en las variables de entorno o el 3333 por defecto

app.set('view engine', 'ejs'); // configuramos el motor de plantillas EJS para renderizar vistas
app.set('views', path.join(__dirname, 'views')); // configuramos la carpeta donde se encuentran las vistas

app.use(express.static(path.join(__dirname, 'public'))); // configuramos la carpeta pública para servir archivos estáticos
app.use(express.urlencoded({ extended: true })); // configuramos express para que pueda parsear datos de formularios URL-encoded

mongoose.connect(`mongodb+srv://${process.env.USER_BD}:${process.env.PASS_BD}@bd.yf87cce.mongodb.net/${process.env.BASEDATOS}?retryWrites=true&w=majority`)
  .then(() => {
    console.log('MongoDB Conectado'); // mostramos un mensaje en la consola indicando que la conexión a MongoDB fue exitosa

    app.get('/', (req, res) => {
      res.render('paginas/inicio'); // definimos una ruta GET que renderiza la vista de inicio
    }); 
  })
  .catch(err => {
    console.error('Error de conexión MongoDB:', err.message);
  }); // manejamos errores de conexión a MongoDB en caso de que ocurran

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)}); // iniciamos el servidor y mostramos un mensaje en la consola indicando que está corriendo
    