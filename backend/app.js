require('dotenv').config(); //importamos dotenv para cargar las variables de entorno desde el archivo .env
const mongoose = require('mongoose'); //importamos mongoose, que es un ODM (Object Data Modeling) para MongoDB y Node.js
const express = require('express'); //importamos express que es el framework que usamos para crear servidores en Node.js
const cors = require('cors'); //importamos cors, que es un middleware que permite el intercambio de recursos entre diferentes dominios (para hacer peticiones desde el frontend al backend)
const dotenv = require('dotenv'); //importamos dotenv, que es un paquete que carga variables de entorno desde un archivo .env (donde podemos guardar configuraciones sensibles como puertos o claves API, usuarios, contraseñas, etc.)
const app = express(); //creamos una instancia de express, que es nuestra aplicación web

dotenv.config(); //activa la carga de variables de entorno desde el archivo .env
app.use(cors()); // activamos el middleware cors para permitir peticiones desde otros dominios (como el frontend 4444)
app.use(express.json()); //activamos el middleware express.json() para poder recibir datos en formato JSON en las peticiones HTTP(como POST o PUT)

mongoose.connect(process.env.MONGO_URI) // conectamos a la base de datos MongoDB usando la URI del archivo .env
    .then(() => {
        console.log('MongoDB Conectado'); // mostramos un mensaje en la consola indicando que la conexión a MongoDB fue exitosa
    })
    .catch(err => {
        console.error('Error de conexión MongoDB:', err.message); // manejamos errores de conexión a MongoDB en caso de que ocurran
    });

const productosRoutes = require('./routes/productos.routes'); // importamos las rutas de productos
console.log('Rutas de productos cargadas'); // mostramos un mensaje en la consola indicando que las rutas de productos fueron cargadas
app.use('/api/productos', productosRoutes); // usamos las rutas de productos en la aplicación

const PORT = process.env.PORT || 3333;// definimos el puerto en el que escuchará nuestro servidor, ya sea el que esté en las variables de entorno o el 3333 por defecto
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});// iniciamos el servidor y mostramos un mensaje en la consola indicando que está corriendo