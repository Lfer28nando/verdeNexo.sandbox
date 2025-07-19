const express = require('express'); //importamos express que es el framework que usamos para crear servidores en Node.js

const path = require('path'); //importamos path, que es un módulo de Node.js para manejar rutas de archivos

const app = express(); //creamos una instancia de express, que es nuestra aplicación web

app.set('view engine', 'ejs'); // configuramos EJS como el motor de plantillas para renderizar vistas
app.set('views', path.join(__dirname, 'views')); // configuramos la carpeta donde están las vistas EJS
app.use(express.static(path.join(__dirname, 'public'))); // configuramos la carpeta pública para servir archivos estáticos como CSS, JS e imágenes

app.get('/', (req, res) => {
    res.render('paginas/inicio'); // renderizamos la vista de inicio
});

const PORT = 4444; // definimos el puerto en el que escuchará nuestro servidor, que es el 4444 para el frontend
app.listen(PORT, () => {
    console.log(`Frontend corriendo en http://localhost:${PORT}`); // iniciamos el servidor y mostramos un mensaje en la consola indicando que está corriendo
});