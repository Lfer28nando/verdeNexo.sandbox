//Importaciones:
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

//Esquema de Usuario:
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'vendedor', 'admin'], default: 'cliente' },
});

//Modelo:
const Usuario = mongoose.model('Usuario', usuarioSchema);

//usuarioModel con validaciones:
export class usuarioModel {
  //registrar
  static async create({ nombre, email, password }) {
    validaciones.nombre(nombre);
    validaciones.email(email);
    validaciones.password(password);

    //Hash contraseña con bcrypt:
    const hashedPassword = await bcrypt.hash(password, 10);

    //Verificar si ya existe un usuario con ese nombre || email:
    const existe = await Usuario.findOne({ $or: [{ nombre }, {email }]});
    if (existe) throw new Error('El nombre de usuario o correo ya están registrados,');

    // Crear el nuevo usuario
    const nuevoUsuario = new Usuario({
     nombre,
     email,
     password : hashedPassword 
    });

     return await nuevoUsuario.save();
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
}

