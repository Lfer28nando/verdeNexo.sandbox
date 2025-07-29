// Importaciones
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { userModel } from './user-model.js';
import { PORT } from './config.js';

// Configurar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();

// Middleware para recibir JSON
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(' MongoDB Conectado'))
  .catch(err => console.error(' Error de conexión MongoDB:', err.message));

// Rutas
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente ');
});

app.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const nuevoUsuario = await userModel.create({ nombre, email, password });

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await userModel.login({email, password});

    res.status(201).json({
      mensaje: 'Bienvenido',
    });
  } catch (error) {
    res.status(400).json({error: error.message });
  }
  
});


// Rutas pendientes de implementar

app.post('/logout', (req, res) => {
  res.status(501).json({ mensaje: 'Endpoint /logout aún no implementado.' });
});

app.post('/protected', (req, res) => {
  res.status(501).json({ mensaje: 'Endpoint /protected aún no implementado.' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
