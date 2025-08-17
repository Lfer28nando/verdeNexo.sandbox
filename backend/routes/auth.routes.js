//Importaciones:
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { usuarioModel } from '../models/usuario.model.js';
import enviarCorreo from '../utils/email.service.js';
import { soloAdmin } from '../middlewares/auth.js';
import { verificarToken } from '../middlewares/auth.js';
import multer from 'multer';
import { validarApiKey } from '../middlewares/apiKey.js';
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


// Ruta de prueba para el middleware validarApiKey
router.get('/prueba-apikey', validarApiKey, (req, res) => {
  res.status(200).json({
    mensaje: 'API Key verificada correctamente',
    apiKey: req.apiKey || req.headers['x-api-key'] || null
  });
});



// RF-USU-01: Ruta del Registro completo
router.post('/registro', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, email, telefono, documento, password, consentimientoDatos } = req.body;
    const imagen = req.file ? req.file.filename : null;
    const ip = req.ip || req.connection.remoteAddress;

    // Crear objeto de datos solo con campos que tienen valor
    const datosUsuario = { 
      nombre, 
      email, 
      password,
      ip
    };

    // Agregar campos opcionales solo si tienen valor
    if (telefono && telefono.trim()) datosUsuario.telefono = telefono.trim();
    if (documento && documento.trim()) datosUsuario.documento = documento.trim();
    if (imagen) datosUsuario.imagen = imagen;
    if (consentimientoDatos) {
      try {
        datosUsuario.consentimientoDatos = typeof consentimientoDatos === 'string' 
          ? JSON.parse(consentimientoDatos) 
          : consentimientoDatos;
      } catch (e) {
        // Si no se puede parsear, ignorar el consentimiento
      }
    }

    // Usamos usuarioModel.create para registrar y validar
    const nuevoUsuario = await usuarioModel.create(datosUsuario);
    
    // Intentar enviar correo pero no fallar si hay error
    try {<
      await enviarCorreo(email, 'Bienvenido a VerdeNexo', `<p>Hola ${nombre}, tu cuenta ha sido creada exitosamente.</p>`);
    } catch (emailError) {
      console.warn('Error al enviar correo de bienvenida:', emailError.message);
    }
    
    res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente', 
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        telefono: nuevoUsuario.telefono,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(400).json({ mensaje: error.message || 'Error al registrar el usuario' });
  }
});

// RF-USU-05: Ruta del Login con gestión de sesiones
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const dispositivo = req.headers['user-agent'] || 'Desconocido';
    const ip = req.ip || req.connection.remoteAddress;
    
    // Usamos usuarioModel.login para validar login
    const usuario = await usuarioModel.login({ email, password });
    const tokenId = crypto.randomUUID();
    const token = jwt.sign({ 
      id: usuario._id, 
      rol: usuario.rol, 
      tokenId 
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // RF-USU-06: Registrar sesión activa
    await usuarioModel.agregarSesionActiva(usuario._id, tokenId, dispositivo, ip);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 // 1 hora
    });

    res.status(200).json({ 
      mensaje: 'Login exitoso', 
      usuario: { 
        id: usuario._id, 
        nombre: usuario.nombre, 
        email: usuario.email, 
        rol: usuario.rol,
        emailVerificado: usuario.emailVerificado
      } 
    });

  } catch (error) {
    res.status(401).json({ mensaje: 'Error al iniciar sesión', error: error.message });
  }
});

//RF-USU-06: ruta de cierre de sesión con revocación de token
router.post('/logout', async (req, res) => {
  try {
    // Intentar obtener el token de las cookies
    const token = req.cookies.token;
    
    if (token) {
      try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Revocar la sesión si el token es válido
        if (decoded.tokenId) {
          await usuarioModel.revocarSesion(decoded.id, decoded.tokenId);
        }
      } catch (tokenError) {
        // Token inválido o expirado, pero aún así limpiar la cookie
        console.log('Token inválido durante logout:', tokenError.message);
      }
    }
    
    // Siempre limpiar la cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
    
  } catch (error) {
    console.error('Error en logout:', error);
    
    // Aún así, limpiar la cookie y responder exitosamente
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({ mensaje: 'Sesión cerrada' });
  }
});

// RF-USU-02: Ver perfil del usuario
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const perfil = await usuarioModel.getPerfil(req.usuario.id);
    res.status(200).json({ perfil });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener perfil', error: error.message });
  }
});

// RF-USU-03: Editar perfil del usuario
router.put('/perfil', verificarToken, async (req, res) => {
  try {
    const perfilActualizado = await usuarioModel.editarPerfil(req.usuario.id, req.body);
    res.status(200).json({ 
      mensaje: 'Perfil actualizado exitosamente', 
      usuario: perfilActualizado 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar perfil', error: error.message });
  }
});

// RF-USU-04: Eliminar cuenta
router.delete('/cuenta', verificarToken, async (req, res) => {
  try {
    const resultado = await usuarioModel.eliminarCuenta(req.usuario.id);
    res.clearCookie('token');
    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar cuenta', error: error.message });
  }
});

// RF-USU-07: Solicitar restablecimiento de contraseña
router.post('/restablecer-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { token, usuario } = await usuarioModel.generarTokenRestablecimiento(email);
    
    const enlaceRestablecimiento = `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;
    await enviarCorreo(
      email, 
      'Restablecimiento de contraseña - VerdeNexo',
      `<p>Hola ${usuario.nombre},</p>
       <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
       <a href="${enlaceRestablecimiento}">Restablecer contraseña</a>
       <p>Este enlace expira en 15 minutos.</p>
       <p>Si no solicitaste este cambio, ignora este mensaje.</p>`
    );
    
    res.status(200).json({ mensaje: 'Correo de restablecimiento enviado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar solicitud', error: error.message });
  }
});

// RF-USU-07: Confirmar restablecimiento de contraseña
router.post('/confirmar-restablecer-password', async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;
    await usuarioModel.restablecerPassword(token, nuevaPassword);
    res.status(200).json({ mensaje: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al restablecer contraseña', error: error.message });
  }
});

// RF-USU-08: Cambiar contraseña (autenticado)
router.post('/cambiar-password', verificarToken, async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body;
    const resultado = await usuarioModel.cambiarPassword(req.usuario.id, passwordActual, nuevaPassword);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al cambiar contraseña', error: error.message });
  }
});

// RF-USU-10: Ver sesiones activas
router.get('/sesiones', verificarToken, async (req, res) => {
  try {
    const sesiones = await usuarioModel.getSesionesActivas(req.usuario.id);
    res.status(200).json({ sesiones });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener sesiones', error: error.message });
  }
});

// RF-USU-10: Revocar sesión específica
router.delete('/sesiones/:tokenId', verificarToken, async (req, res) => {
  try {
    const { tokenId } = req.params;
    await usuarioModel.revocarSesion(req.usuario.id, tokenId);
    res.status(200).json({ mensaje: 'Sesión revocada exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al revocar sesión', error: error.message });
  }
});

// RF-USU-10: Revocar todas las sesiones
router.delete('/sesiones', verificarToken, async (req, res) => {
  try {
    await usuarioModel.revocarTodasSesiones(req.usuario.id);
    res.clearCookie('token');
    res.status(200).json({ mensaje: 'Todas las sesiones han sido revocadas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al revocar sesiones', error: error.message });
  }
});

// RF-USU-11: Verificar email
router.post('/verificar-email', verificarToken, async (req, res) => {
  try {
    const usuario = await usuarioModel.verificarEmail(req.usuario.id);
    res.status(200).json({ 
      mensaje: 'Email verificado exitosamente', 
      usuario 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar email', error: error.message });
  }
});

// RF-USU-13: Actualizar consentimiento de datos
router.post('/consentimiento', verificarToken, async (req, res) => {
  try {
    const { version } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const usuario = await usuarioModel.actualizarConsentimiento(req.usuario.id, version, ip);
    res.status(200).json({ 
      mensaje: 'Consentimiento actualizado exitosamente', 
      usuario 
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar consentimiento', error: error.message });
  }
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