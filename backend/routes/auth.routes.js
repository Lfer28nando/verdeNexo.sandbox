//Importaciones:
import express from 'express';
import jwt from 'jsonwebtoken';
import { usuarioModel } from '../models/usuario.model.js';
import enviarCorreo from '../utils/email.service.js';
import { soloAdmin } from '../middlewares/auth.js';
import { verificarToken } from '../middlewares/auth.js';
import multer from 'multer';
//Instancia de Enrutador:
const router = express.Router();

//Configuración de multer (si se necesita para subir imágenes de perfil, por ejemplo)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Ruta del Registro con multer para subir imagen de usuario
router.post('/registro', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const imagen = req.file ? req.file.filename : null;

    // Usamos usuarioModel.create para registrar y validar
    const nuevoUsuario = await usuarioModel.create({ nombre, email, password, imagen });
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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Asegura la cookie en producción
      maxAge: 3600000 // 1 hora
    });

    res.status(200).json({ mensaje: 'Login exitoso', usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } });

  } catch (error) {
    res.status(401).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
});

//ruta de cierre de sesión
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ mensaje: 'Sesión cerrada' });
});


//Ruta Privada: admin
router.get('/admin', verificarToken, soloAdmin, async (req, res) => {
try { 
  res.status(200).json({ mensaje: 'Bienvenido al área de administración', usuario: req.usuario });
} catch (error) {
  res.status(500).json({ mensaje: 'area restringida'});
}
});

//Ruta para obtener usuarios registrados (solo admin)
router.get('/usuarios', verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuarios = await usuarioModel.getAll();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
});

export default router;