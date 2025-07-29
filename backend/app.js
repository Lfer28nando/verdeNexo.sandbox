//Importaciones:
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import { verificarToken } from './middlewares/auth.js';

//Variables de entorno:
dotenv.config();

//Instancia de Express:
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
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
app.listen(process.env.PORT, () => {
    console.log(`Backend corriendo en http://localhost:${process.env.PORT}`);
});  
