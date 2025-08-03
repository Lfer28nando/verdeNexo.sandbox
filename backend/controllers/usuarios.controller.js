//Importaciones:
import { usuarioModel } from '../models/usuario.model.js';

//Controlador de Usuarios:
export class UsuariosController {
  // Obtener todos los usuarios
  static async obtenerUsuarios(req, res) {
    try {
      const usuarios = await usuarioModel.getAll();
      res.status(200).json({
        success: true,
        data: usuarios,
        message: 'Usuarios obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener usuarios',
        error: error.message
      });
    }
  }

  // Eliminar un usuario (solo admin)
  static async eliminarUsuario(req, res) {
      try {
          const { id } = req.params;

          // Verifica si el usuario autenticado es admin
          if (!req.usuario || req.usuario.rol !== 'admin') {
              return res.status(403).json({
                  success: false,
                  message: 'No autorizado. Solo el administrador puede eliminar usuarios.'
              });
          }

          // Busca el usuario por ID
          const usuario = await usuarioModel.getById(id);
          if (!usuario) {
              return res.status(404).json({
                  success: false,
                  message: 'Usuario no encontrado'
              });
          }

          // Elimina el usuario
          await usuarioModel.deleteById(id);

          res.status(200).json({
              success: true,
              message: 'Usuario eliminado exitosamente'
          });
      } catch (error) {
          console.error('Error al eliminar usuario:', error);
          res.status(500).json({
              success: false,
              message: 'Error interno del servidor al eliminar usuario',
              error: error.message
          });
      }
  }

  // Obtener usuario por ID
  static async obtenerUsuarioPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await usuarioModel.getById(id);
      res.status(200).json({
        success: true,
        data: usuario,
        message: 'Usuario obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      const statusCode = error.message.includes('no válido') || error.message.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtener información del usuario actual
  static async obtenerPerfil(req, res) {
    try {
      const usuario = await usuarioModel.getById(req.usuario.id);
      
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }

      res.status(200).json(usuario);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ 
        mensaje: 'Error interno del servidor al obtener perfil',
        error: error.message 
      });
    }
  }
  // Cambiar el rol de un usuario a 'vendedor' (solo admin)
  static async cambiarRolAVendedor(req, res) {
    try {
        const { id } = req.params;

        // Verifica si el usuario autenticado es admin
        if (!req.usuario || req.usuario.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No autorizado. Solo el administrador puede cambiar roles.'
            });
        }

        // Busca el usuario por ID
        const usuario = await usuarioModel.getById(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Cambia el rol a 'vendedor'
        const usuarioActualizado = await usuarioModel.updateById(id, { rol: 'vendedor' });

        res.status(200).json({
            success: true,
            data: usuarioActualizado,
            message: 'Rol de usuario actualizado a vendedor exitosamente'
        });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al cambiar rol',
            error: error.message
        });
    }
  }
}

