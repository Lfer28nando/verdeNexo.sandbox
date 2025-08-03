// Script para crear un usuario administrador de demo
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { usuarioModel } from './models/usuario.model.js';

dotenv.config();

async function crearAdminDemo() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB');

        // Verificar si ya existe el usuario demo
        try {
            const usuarioExistente = await usuarioModel.getByEmail('admin@demo.com');
            if (usuarioExistente) {
                console.log('Usuario admin de demo ya existe');
                return;
            }
        } catch (error) {
            console.log('Usuario admin de demo no existe, creándolo...');
        }

        // Crear usuario administrador de demo
        const adminDemo = await usuarioModel.create({
            nombre: 'AdminDemo',
            email: 'admin@demo.com',
            password: 'admin123',
            rol: 'admin'
        });

        console.log('Usuario admin de demo creado exitosamente:', {
            nombre: adminDemo.nombre,
            email: adminDemo.email,
            rol: adminDemo.rol
        });

    } catch (error) {
        console.error('Error al crear usuario admin de demo:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada');
        process.exit(0);
    }
}

crearAdminDemo();
