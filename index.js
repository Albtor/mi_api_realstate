const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require("jsonwebtoken");
app.use(express.json()); // Middleware para JSON
app.use(express.static(__dirname)); // Servir archivos estáticos desde el directorio raíz (para index.html y favicon.ico)
const Ajv = require("ajv");
const propertySchema = require("./schemas/jsonSchema");
// console.log(propertySchema);
const ajv = new Ajv({ 
    allErrors: true, 
    strict: true,
    removeAdditional: false });
const validate = ajv.compile(propertySchema);
// import properties_data from "data/testdata.json" assert { type: "json" };
// import { postProperties } from "./functions.js";

// let properties = properties_data;

let properties = [
  {
    "id": 1,
    "title": "Bright penthouse with park views",
    "type": "Apartment",
    "price": 250000,
    "currency": "EUR",
    "property": {
      "bedrooms": 3,
      "bathrooms": 2,
      "surface_m2": 95,
      "terrace": true,
      "elevator": true,
      "garage": false,
      "storage_room": true,
      "floor": 2,
      "orientation": ["east", "south"]
    },
    "building": {
      "year": 1987,
      "neighbors": 10,
      "floors": 2,
      "extras": {
        "pool": "shared",
        "gym": true,
        "jacuzzi": false,
        "sports_courts": true
      }
    },
    "location": {
      "street": "15 Mayor Street",
      "city": "Madrid",
      "postal_code": "28001",
      "province": "Madrid",
      "country": "ES",
      "visibility": true
    },
    "status": "Available",
    "legalStatus": "occupied"
  }
];

const SECRET = process.env.JWT_SECRET;

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const adminUser = process.env.ADMIN_USER;
    const adminPass = process.env.ADMIN_PASS;
        console.log("ENV CHECK:", {
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASS: process.env.ADMIN_PASS ? "SET" : "MISSING",
    SECRET: process.env.SECRET ? "SET" : "MISSING"
    });

    if (!adminUser || !adminPass) {
    return res.status(500).json({
      error: "Server misconfigured (missing env vars)"
    });
  }

     if (
    username?.trim() === adminUser.trim() &&
    password?.trim() === adminPass.trim()
    ) {
        const token = jwt.sign({ username }, SECRET, { expiresIn: "1h" });
        return res.json({ token });
    }

    res.status(401).json({ message: "Invalid Crendentials" });
});

// RUTAS
// app.get('/', (req, res) => res.send('¡API REAL STATE LIVE 🏠!'));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Real Estate API</title>
        <link rel="icon" href="/img/favicon.ico">
      </head>

      <body style="font-family: sans-serif">
        <h2>¡API REAL STATE LIVE 🏠!</h2>
      </body>
    </html>
  `);
});

app.get('/properties', (req, res) => res.json(properties));

app.post('/properties', authMiddleware, validateProperty, (req, res) => {
    // Generate new ID based on the last property in the array
    const newId = properties.length > 0 ? properties[properties.length - 1].id + 1 : 1;
    const Property = {
        id: newId,
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    properties.push(Property);
    res.status(201).json(Property);
});

// 3. Update a property (PUT)
app.put('/properties/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const index = properties.findIndex(p => p.id === id);

    if (index !== -1) {
        properties[index] = {
            ...properties[index],
            ...req.body,
            id,
            updatedAt: new Date()
        };
        res.json(properties[index]);
    } else {
        res.status(404).json({ message: "Property not found" });
    }
});

// 4. Delete a property (DELETE)
app.delete('/properties/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = properties.length;
    properties = properties.filter(p => p.id !== id);

    if (properties.length < initialLength) {
        res.json({ message: `Property with ID ${id} succesfully deleted` });
    } else {
        res.status(404).json({ message: "No property found with that ID" });
    }
});


function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "Token required" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid Token" });
    }
}

//Validate Property against Json Schema
function validateProperty(req, res, next) {
  const valid = validate(req.body);
//   console.log("VALID:", valid);
//   console.log(validate.errors);

  if (!valid) {
    console.log("❌ VALIDATION ERROR:");
    console.log(JSON.stringify(validate.errors, null, 2));

    return res.status(400).json({
      error: "Invalid JSON",
      detalles: validate.errors
    });
  }

  next(); 
}

// PORT: Port by hosting or 3000 by default
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in http://localhost:${PORT}`);
});