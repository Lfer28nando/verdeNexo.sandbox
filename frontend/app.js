const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('paginas/inicio');
});

// Rutas de admin sin validación del servidor (se maneja en el cliente)
app.get('/admin', (req, res) => {
    res.render('paginas/homeAdmin');
});

app.get('/admin/productos', (req, res) => {
    res.render('paginas/gestion-productos');
});

const PORT = 4444;
app.listen(PORT, () => {
    console.log(`Frontend corriendo en http://localhost:${PORT}`);
});