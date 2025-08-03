//Importaciones:
import express from 'express';
import { UsuariosController } from '../controllers/usuarios.controller.js';
import { verificarToken, soloAdmin } from '../middlewares/auth.js';

//Instancia de Enrutador:
const router = express.Router();

// Rutas para usuarios (solo admin puede ver todos los usuarios)
router.get('/', verificarToken, soloAdmin, UsuariosController.obtenerUsuarios);

// Ruta para eliminar un usuario (solo admin)
router.delete('/:id', verificarToken, soloAdmin, UsuariosController.eliminarUsuario);

// Ruta para obtener usuario por ID (solo admin)
router.get('/:id', verificarToken, soloAdmin, UsuariosController.obtenerUsuarioPorId);

// Ruta para obtener perfil del usuario actual
router.get('/perfil/me', verificarToken, UsuariosController.obtenerPerfil);

export default router;
