const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // importamos bcrypt para el hash de passwords.

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'vendedor', 'admin'], default: 'cliente' },
});

// encriptamos la password antes de guardar el usuario
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // corregido: password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt); // corregido: password
  next();
});

// comparar passwords
usuarioSchema.methods.compararpassword = function(passwordIngresada) {
  return bcrypt.compare(passwordIngresada, this.password); // corregido: password
};

module.exports = mongoose.model('Usuario', usuarioSchema);
