const express = require('express'); //importamos express que es el framework que usamos para crear servidores en Node.js
const cors = require('cors'); //importamos cors, que es un middleware que permite el intercambio de recursos entre diferentes dominios (para hacer peticiones desde el frontend al backend)
const dotenv = require('dotenv'); //importamos dotenv, que es un paquete que carga variables de entorno desde un archivo .env (donde podemos guardar configuraciones sensibles como puertos o claves API, usuarios, contraseñas, etc.)
const app = express(); //creamos una instancia de express, que es nuestra aplicación web

dotenv.config(); //activa la carga de variables de entorno desde el archivo .env
app.use(cors()); // activamos el middleware cors para permitir peticiones desde otros dominios (como el frontend 4444)
app.use(express.json()); //activamos el middleware express.json() para poder recibir datos en formato JSON en las peticiones HTTP(como POST o PUT)

//  post
app.get('/api/productos', (req, res) => {
    res.json([
        { id: 1, name: 'Monstera', price: 41000 },
        { id: 2, name: 'Suculenta', price: 20000 },
        { id: 3, name: 'Sanseviera', price: 30000 },
        { id: 4, name: 'Cactus', price: 15000 },
        { id: 5, name: 'Poto', price: 25000 },
        { id: 6, name: 'Palmera', price: 50000 },
        { id: 7, name: 'Orquídea', price: 60000 },
        { id: 8, name: 'Bonsai', price: 70000 },
        { id: 9, name: 'Ficus', price: 80000 },
        { id: 10, name: 'Ciclamen', price: 90000 }
    ]);
}); // definimos una ruta POST que recibe datos de productos y responde con un JSON de ejemplo

const PORT = process.env.PORT || 3333;// definimos el puerto en el que escuchará nuestro servidor, ya sea el que esté en las variables de entorno o el 3333 por defecto
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});// iniciamos el servidor y mostramos un mensaje en la consola indicando que está corriendo