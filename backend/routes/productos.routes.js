const multer = require('multer'); // importamos multer para manejar la subida de archivos
const path = require('path'); // importamos path para manejar rutas de archivos
const express = require('express'); // importamos express
const router = express.Router(); // creamos un enrutador de express
const Producto = require('../models/producto.model'); // importamos el modelo Producto

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // carpeta donde se guardarán las imágenes
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname; // generamos un nombre único para el archivo
        cb(null, uniqueName); // usamos el nombre único como nombre del archivo
    }
});
const upload = multer({ storage: storage }); // creamos una instancia de multer con la configuración


router.post('/', upload.single('imagen'), async (req, res) => {
  try {
    const nombre = req.body?.nombre;
    const precio = req.body?.precio;
    // Si se sube una imagen, multer la guardará y le asignará un nombre
    const imagen = req.file ? req.file.filename : null;

    const nuevoProducto = new Producto({ nombre, precio, imagen });
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar el producto', error });
  }
});


// Ruta para obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find(); // buscamos todos los productos en la base de datos
        res.status(200).json(productos); // respondemos con los productos encontrados y un estado 200 (OK)
    }
    catch (error) {
        console.error('Error al obtener los productos:', error); // mostramos un error en la consola si ocurre
        res.status(500).json({ message: 'Error al obtener los productos' }); // respondemos con un estado 500 (error interno del servidor)
    }
});

// Ruta para obtener un producto por ID
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

// ruta para editar un producto por ID
router.put('/:id', async (req, res) => {
  try {
    const { nombre, precio, imagen } = req.body;
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { nombre, precio, imagen },
      { new: true } // para que devuelva el producto actualizado
    );

    if (!productoActualizado) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el producto', error });
  }
});

//ruta para eliminar un producto por ID
router.delete('/:id', async (req, res) => {
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

module.exports = router; // exportamos el enrutador para que pueda ser utilizado en otros archivos