const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // importamos jsonwebtoken para manejar la autenticación.
const Usuario = require('../models/usuario.model'); // importamos el modelo Usuario
const enviarCorreo = require('../utils/email.service'); // importamos la función para enviar correos
//registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body; // obtenemos los datos del cuerpo de la solicitud
    const nuevoUsuario = new Usuario({ nombre, email, password, rol }); // creamos una nueva instancia del modelo Usuario
    await nuevoUsuario.save(); // guardamos el usuario en la base de datos
    await enviarCorreo(email, 'Bienvenido a VerdeNexo', `<p>Hola ${nombre}, tu cuenta ha sido creada exitosamente.</p>`); // enviamos un correo de bienvenida al usuario
    res.status(201).json({ mensaje: 'Usuario registrado y correo enviado' }); // respondemos con un mensaje de éxito
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar el usuario', error: error.message }); // manejamos errores
  }
});
// Este archivo maneja las rutas de autenticación, incluyendo el registro y el inicio de sesión de usuarios.

// Enviar correo de bienvenida


//login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body; // obtenemos los datos del cuerpo de la solicitud
        const usuario = await Usuario.findOne({ email }); // buscamos el usuario por email
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' }); // si no se encuentra el usuario, respondemos con un error 404

        const esValido = await usuario.compararpassword(password); // comparamos la password ingresada con la almacenada
        if (!esValido) return res.status(401).json({ mensaje: 'password incorrecta' }); // si la password no es válida, respondemos con un error 401

        const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' }); // generamos un token JWT con el ID y rol del usuario, y lo firmamos con una clave secreta
        res.status(200).json({ token, usuario: { nombre: usuario.nombre, rol: usuario.rol }}); // respondemos con el token generado
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al iniciar sesión', error }); // manejamos errores
    }
});

module.exports = router; // exportamos el enrutador para que pueda ser utilizado en otros archivos