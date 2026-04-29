const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require("jsonwebtoken");

// Middleware para JSON
app.use(express.json());

// Datos en memoria (simulando DB)
let propiedades = [
    {
  "id": 1,
  "titulo": "Ático luminoso con vistas al parque",
  "tipo": "Piso",
  "precio": 250000,
  "moneda": "EUR",
  "detalles": {
    "habitaciones": 3,
    "banos": 2,
    "superficie_m2": 95,
    "terraza": true,
    "ascensor": true
  },
  "ubicacion": {
    "calle": "Calle Mayor 15",
    "ciudad": "Madrid",
    "codigo_postal": "28001"
  },
  "estado": "Disponible"
}
];

const SECRET = process.env.JWT_SECRET;

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (
        username === process.env.ADMIN_USER &&
        password === process.env.ADMIN_PASS
    ) {
        const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
        return res.json({ token });
    }

    res.status(401).json({ mensaje: "Credenciales incorrectas" });
});

// app.post("/login", (req, res) => {
//     const { username, password } = req.body;

//     // Ejemplo simple
//     if (username === "" && password === "") {
//         const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
//         return res.json({ token });
//     }

//     res.status(401).json({ mensaje: "Credenciales incorrectas" });
// });

// RUTAS
app.get('/', (req, res) => res.send('¡API REAL STATE LIVE 🏠!'));

app.get('/propiedades', (req, res) => res.json(propiedades));

app.post('/propiedades', (req, res) => {
    // Generamos un ID basado en el último elemento o 1 si está vacío
    const nuevoId = propiedades.length > 0 ? propiedades[propiedades.length - 1].id + 1 : 1;
    const nuevaPropiedad = { id: nuevoId, ...req.body };
    propiedades.push(nuevaPropiedad);
    res.status(201).json(nuevaPropiedad);
});

// 3. Actualizar una propiedad (PUT)
app.put('/propiedades/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = propiedades.findIndex(p => p.id === id);

    if (index !== -1) {
        // Combinamos la propiedad existente con los nuevos datos del body
        // Nota: Si envías un objeto "detalles" parcial, este reemplazará al anterior
        propiedades[index] = { ...propiedades[index], ...req.body, id }; 
        res.json(propiedades[index]);
    } else {
        res.status(404).json({ mensaje: "Propiedad no encontrada" });
    }
});

// 4. Eliminar una propiedad (DELETE)
app.delete('/propiedades/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const inicialLength = propiedades.length;
    propiedades = propiedades.filter(p => p.id !== id);

    if (propiedades.length < inicialLength) {
        res.json({ mensaje: `Propiedad con ID ${id} eliminada correctamente` });
    } else {
        res.status(404).json({ mensaje: "No se encontró la propiedad para eliminar" });
    }
});

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