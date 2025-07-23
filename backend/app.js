require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const { verificarToken } = require('./middlewares/auth');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/uploads', express.static('uploads'));

// Conexión Mongo
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Conectado'))
    .catch(err => console.error('Error de conexión MongoDB:', err.message));

// Arranque del server
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Backend corriendo en http://localhost:${PORT}`);
});
