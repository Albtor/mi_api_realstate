const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require("jsonwebtoken");
app.use(express.json()); // Middleware para JSON
const Ajv = require("ajv");
const propiedadSchema = require("./schemas/jsonSchema");
const ajv = new Ajv({ allErrors: true, strict: true });
const validate = ajv.compile(propiedadSchema);
import properties from "data/testdata.json" assert { type: "json" };
import { postProperties } from "./functions.js";

// Datos en memoria (simulando DB)
let propiedades = [
    {
  "id": 1,
  "titulo": "Ático luminoso con vistas al parque",
  "tipo": "Piso",
  "precio": 250000,
  "moneda": "EUR",
  "vivienda": {
    "habitaciones": 3,
    "banos": 2,
    "superficie_m2": 95,
    "terraza": true,
    "ascensor": true,
    "garaje": false,
    "trastero": true,
    "planta": 2,
    "orientacion": ["este", "sur"],
  },
  "edificio":{
    "año": 1987,
    "numVecinos": 10,
    "numeroPlantas": 2,
    "extras": {
        "piscina": "comunitaria",
        "gimnasio": true,
        "jacuzzi": false,
        "pistasDeportivas": true
    },
  },
  "ubicacion": {
    "calle": "Calle Mayor 15",
    "ciudad": "Madrid",
    "codigo_postal": "28001",
    "provincia": "Madrid",
    "pais": "ES",
    "visibility": true
  },
  "estado": "Disponible",
  "legalStatus": "ocupada"
}
];

const SECRET = process.env.JWT_SECRET;

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (
        username.trim() === process.env.ADMIN_USER.trim() &&
        password.trim() === process.env.ADMIN_PASS.trim()
    ) {
        const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
        return res.json({ token });
    }

    res.status(401).json({ mensaje: "Credenciales incorrectas" });
});

// RUTAS
app.get('/', (req, res) => res.send('¡API REAL STATE LIVE 🏠!'));

app.get('/propiedades', (req, res) => res.json(propiedades));

app.post('/propiedades', authMiddleware, validatePropiedad, (req, res) => {
    // Generamos un ID basado en el último elemento o 1 si está vacío
    const nuevoId = propiedades.length > 0 ? propiedades[propiedades.length - 1].id + 1 : 1;
    const nuevaPropiedad = {
        id: nuevoId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    propiedades.push(nuevaPropiedad);
    res.status(201).json(nuevaPropiedad);
});

// 3. Actualizar una propiedad (PUT)
app.put('/propiedades/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const index = propiedades.findIndex(p => p.id === id);

    if (index !== -1) {
        propiedades[index] = {
            ...propiedades[index],
            ...req.body,
            id,
            updatedAt: new Date()
        };
        res.json(propiedades[index]);
    } else {
        res.status(404).json({ mensaje: "Propiedad no encontrada" });
    }
});

// 4. Eliminar una propiedad (DELETE)
app.delete('/propiedades/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const inicialLength = propiedades.length;
    propiedades = propiedades.filter(p => p.id !== id);

    if (propiedades.length < inicialLength) {
        res.json({ mensaje: `Propiedad con ID ${id} eliminada correctamente` });
    } else {
        res.status(404).json({ mensaje: "No se encontró la propiedad para eliminar" });
    }
});

function validatePropiedad(req, res, next) {
  const valid = validate(req.body);

  if (!valid) {
    console.log("❌ ERROR VALIDACIÓN:");
    console.log(JSON.stringify(validate.errors, null, 2));

    return res.status(400).json({
      error: "JSON inválido",
      detalles: validate.errors
    });
  }

  next(); 
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ mensaje: "Token requerido" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ mensaje: "Token inválido" });
    }
}

// PUERTO: Usa el puerto que asigne el hosting o el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});