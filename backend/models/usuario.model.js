//Importaciones:
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

//Esquema de Usuario:
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String, required: false },
  documento: { type: String, required: false, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'vendedor', 'admin'], default: 'cliente' },
  emailVerificado: { type: Boolean, default: false },
  fechaUltimaActividad: { type: Date, default: Date.now },
  sesionesActivas: [{
    tokenId: String,
    dispositivo: String,
    ip: String,
    fechaCreacion: { type: Date, default: Date.now },
    fechaExpiracion: Date
  }],
  consentimientoDatos: {
    aceptado: { type: Boolean, default: false },
    fecha: Date,
    version: String,
    ip: String
  },
  // Campos para restablecimiento de contraseña
  tokenRestablecimiento: String,
  expiracionToken: Date,
  // Campos para 2FA
  twoFactorSecret: String,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorBackupCodes: [String]
}, {
  timestamps: true // Esto agrega createdAt y updatedAt automáticamente
});

//Modelo:
const Usuario = mongoose.model('Usuario', usuarioSchema);

//usuarioModel con validaciones:
export class usuarioModel {
  //registrar
  static async create({ nombre, email, telefono, documento, password, rol = 'cliente', consentimientoDatos = null, ip = null }) {
    validaciones.nombre(nombre);
    validaciones.email(email);
    if (telefono) validaciones.telefono(telefono); // Solo validar si se proporciona
    if (documento) validaciones.documento(documento); // Solo validar si se proporciona
    validaciones.password(password);

    //Hash contraseña con bcrypt:
    const hashedPassword = await bcrypt.hash(password, 10);

    //Verificar si ya existe un usuario con ese nombre o email
    const condicionesExistencia = [{ nombre }, { email }];
    if (documento) condicionesExistencia.push({ documento }); // Solo verificar documento si se proporciona

    const existe = await Usuario.findOne({ 
      $or: condicionesExistencia
    });
    if (existe) {
      if (existe.email === email) throw new Error('El correo ya está registrado');
      if (existe.nombre === nombre) throw new Error('El nombre de usuario ya está registrado');
      if (documento && existe.documento === documento) throw new Error('El documento ya está registrado');
    }

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      telefono: telefono || undefined,
      documento: documento || undefined,
      password: hashedPassword,
      rol,
      consentimientoDatos: consentimientoDatos ? {
        aceptado: true,
        fecha: new Date(),
        version: consentimientoDatos.version || '1.0',
        ip: ip
      } : undefined
    });

    return await nuevoUsuario.save();
  }

  //obtener por email
  static async getByEmail(email) {
    validaciones.email(email);
    return await Usuario.findOne({ email });
  }

  //entrar
  static async login({ email, password }) {
    validaciones.email(email);
    validaciones.password(password);

    const usuario = await Usuario.findOne({ email });
    if (!usuario) throw new Error('emaill no encontrado.');

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) throw new Error('Contraseña incorrectos.');

    return usuario;
  }

  //obtener todos los usuarios
  static async getAll() {
    return await Usuario.find({}).select('-password'); // Excluir contraseñas por seguridad
  }

  //obtener por ID
  static async getById(id) {
    return await Usuario.findById(id).select('-password');
  }

  // RF-USU-02: Ver perfil con datos básicos y actividad reciente
  static async getPerfil(id) {
    const usuario = await Usuario.findById(id).select('-password -twoFactorSecret -twoFactorBackupCodes');
    if (!usuario) throw new Error('Usuario no encontrado');
    
    // Actualizar fecha de última actividad
    usuario.fechaUltimaActividad = new Date();
    await usuario.save();
    
    return usuario;
  }

  // RF-USU-03: Editar perfil de usuario
  static async editarPerfil(id, datosActualizados) {
    const { nombre, telefono, email } = datosActualizados;
    
    // Validar nuevos datos si se proporcionan
    if (nombre) validaciones.nombre(nombre);
    if (telefono) validaciones.telefono(telefono);
    if (email) validaciones.email(email);

    // Verificar unicidad si se cambia email o nombre
    if (email || nombre) {
      const existe = await Usuario.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: [
            ...(email ? [{ email }] : []),
            ...(nombre ? [{ nombre }] : [])
          ] }
        ]
      });
      if (existe) throw new Error('El email o nombre ya están en uso por otro usuario');
    }

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { 
        ...datosActualizados,
        fechaUltimaActividad: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }

  // RF-USU-04: Eliminar cuenta
  static async eliminarCuenta(id) {
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    return { mensaje: 'Cuenta eliminada exitosamente' };
  }

  // RF-USU-06: Agregar sesión activa
  static async agregarSesionActiva(userId, tokenId, dispositivo, ip) {
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 1); // 1 hora de expiración

    await Usuario.findByIdAndUpdate(userId, {
      $push: {
        sesionesActivas: {
          tokenId,
          dispositivo,
          ip,
          fechaCreacion: new Date(),
          fechaExpiracion: expiracion
        }
      },
      fechaUltimaActividad: new Date()
    });
  }

  // RF-USU-06: Revocar sesión específica
  static async revocarSesion(userId, tokenId) {
    await Usuario.findByIdAndUpdate(userId, {
      $pull: { sesionesActivas: { tokenId } }
    });
  }

  // RF-USU-06: Revocar todas las sesiones
  static async revocarTodasSesiones(userId) {
    await Usuario.findByIdAndUpdate(userId, {
      $set: { sesionesActivas: [] }
    });
  }

  // RF-USU-07: Generar token de restablecimiento
  static async generarTokenRestablecimiento(email) {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) throw new Error('Usuario no encontrado');

    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setMinutes(expiracion.getMinutes() + 15); // 15 minutos

    usuario.tokenRestablecimiento = token;
    usuario.expiracionToken = expiracion;
    await usuario.save();

    return { token, usuario };
  }

  // RF-USU-07: Restablecer contraseña con token
  static async restablecerPassword(token, nuevaPassword) {
    validaciones.password(nuevaPassword);

    const usuario = await Usuario.findOne({
      tokenRestablecimiento: token,
      expiracionToken: { $gt: new Date() }
    });

    if (!usuario) throw new Error('Token inválido o expirado');

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    usuario.password = hashedPassword;
    usuario.tokenRestablecimiento = undefined;
    usuario.expiracionToken = undefined;
    await usuario.save();

    return usuario;
  }

  // RF-USU-08: Cambiar contraseña autenticado
  static async cambiarPassword(userId, passwordActual, nuevaPassword) {
    validaciones.password(nuevaPassword);

    const usuario = await Usuario.findById(userId);
    if (!usuario) throw new Error('Usuario no encontrado');

    const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValida) throw new Error('Contraseña actual incorrecta');

    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    usuario.password = hashedPassword;
    usuario.fechaUltimaActividad = new Date();
    await usuario.save();

    return { mensaje: 'Contraseña actualizada exitosamente' };
  }

  // RF-USU-10: Obtener sesiones activas
  static async getSesionesActivas(userId) {
    const usuario = await Usuario.findById(userId).select('sesionesActivas');
    if (!usuario) throw new Error('Usuario no encontrado');

    // Filtrar sesiones expiradas
    const sesionesValidas = usuario.sesionesActivas.filter(
      sesion => sesion.fechaExpiracion > new Date()
    );

    return sesionesValidas;
  }

  // RF-USU-11: Marcar email como verificado
  static async verificarEmail(userId) {
    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      { emailVerificado: true },
      { new: true }
    ).select('-password');

    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }

  // RF-USU-13: Actualizar consentimiento
  static async actualizarConsentimiento(userId, version, ip) {
    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      {
        consentimientoDatos: {
          aceptado: true,
          fecha: new Date(),
          version,
          ip
        }
      },
      { new: true }
    ).select('-password');

    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }
}

//validaciones:
class validaciones {
    static nombre (nombre) { 
        // Validación: nombre
        if (typeof nombre !== 'string') throw new Error('Nombre debe ser un string.');
        if (nombre.length < 3 || nombre.length > 25) throw new Error('Nombre debe contener entre 3 y 25 caracteres.');
        if (!/^[a-zA-Z0-9_]+$/.test(nombre)) throw new Error('El nombre solo puede contener letras, números y guiones bajos (_).'); 
    }
    static email (email) {
        // Validación: email
        if (typeof email !== 'string') throw new Error('Email debe ser un string.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email no tiene un formato válido.');
    }
    
    static password (password){
        // Validación: contraseña
        if (typeof password !== 'string') throw new Error('Contraseña debe ser un string.');
        if (password.length < 6) throw new Error('Contraseña debe contener al menos 6 caracteres.');
        if (!/\d/.test(password)) throw new Error('Contraseña debe contener al menos un número.');
    }
    
    static telefono(telefono) {
        // Validación: teléfono (mejorada para ser más flexible)
        if (typeof telefono !== 'string') throw new Error('Teléfono debe ser un string.');
        const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
        if (telefonoLimpio.length < 7 || telefonoLimpio.length > 15) {
          throw new Error('Teléfono debe tener entre 7 y 15 dígitos.');
        }
        if (!/^\+?[0-9]+$/.test(telefonoLimpio)) {
          throw new Error('Teléfono solo puede contener números y el símbolo +.');
        }
    }
    
    static documento(documento) {
        // Validación: documento (mejorada)
        if (typeof documento !== 'string') throw new Error('Documento debe ser un string.');
        if (documento.length < 6 || documento.length > 20) {
          throw new Error('Documento debe contener entre 6 y 20 caracteres.');
        }
        if (!/^[a-zA-Z0-9]+$/.test(documento)) {
          throw new Error('Documento solo puede contener letras y números.');
        }
    }
}

