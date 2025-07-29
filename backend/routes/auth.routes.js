//Importaciones:
import express from 'express';
import jwt from 'jsonwebtoken';
import { usuarioModel } from '../models/usuario.model.js';
import enviarCorreo from '../utils/email.service.js';

//Instancia de Enrutador:
const router = express.Router();

// Ruta del Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    // Usamos usuarioModel.create para registrar y validar
    const nuevoUsuario = await usuarioModel.create({ nombre, email, password });
    await enviarCorreo(email, 'Bienvenido a VerdeNexo', `<p>Hola ${nombre}, tu cuenta ha sido creada exitosamente.</p>`);
    res.status(201).json({ mensaje: 'Usuario registrado y correo enviado', usuario: nuevoUsuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar el usuario', error: error.message });
  }
});

// Ruta del Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Usamos usuarioModel.login para validar login
    const usuario = await usuarioModel.login({ email, password });
    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, usuario: { nombre: usuario.nombre, rol: usuario.rol } });
  } catch (error) {
    res.status(401).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
});

export default router;