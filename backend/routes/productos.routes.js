//Importaciones:
import multer from 'multer';
import express from 'express';
import Producto from '../models/producto.model.js';
import { verificarToken, soloAdmin } from '../middlewares/auth.js';

//Instancia de Entrutador:
const router = express.Router();

// Configuración de multer:
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

//Ruta publica: Productos
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
});

//Ruta publica: producto por ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el producto', error });
  }
});

// Ruta Privada: Crear producto: requiere token + rol admin
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const nombre = req.body?.nombre;
    const precio = req.body?.precio;
    const imagen = req.file ? req.file.filename : null;

    const nuevoProducto = new Producto({ nombre, precio, imagen });
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar el producto', error });
  }
});

// Ruta Privada: Editar producto: requiere token + rol admin
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, precio, imagen } = req.body;
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { nombre, precio, imagen },
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el producto', error });
  }
});

// Ruta Privada: Eliminar producto: requiere token + rol admin
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);

    if (!productoEliminado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el producto', error });
  }
});

export default router;
