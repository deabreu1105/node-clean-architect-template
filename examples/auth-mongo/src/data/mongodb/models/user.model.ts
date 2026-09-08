import mongoose, { Schema } from "mongoose";


// Esquema de Mongoose: define la estructura del documento en MongoDB.
// Nota: este NO es la UserEntity del domain. Es el modelo de persistencia.
// La conversión entre modelo ↔ entidad la realiza UserMapper en infrastructure.
const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email must be unique"],
  },
  img: {
    type: String,
    default: ''
  },
  // enum restringe los valores posibles a nivel de base de datos como segunda línea de defensa.
  roles: {
    type: [String],
    default: ['USER_ROLE'],
    enum: ['USER_ROLE', 'ADMIN_ROLE'],
  },

}, { timestamps: true }); // timestamps agrega createdAt y updatedAt automáticamente


export const UserModel = mongoose.model('User', userSchema);