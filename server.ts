import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Database connection pool (initially null)
  let pool: mysql.Pool | null = null;

  // Helper to get connection or throw
  const getPool = () => {
    if (!pool) throw new Error("Database not connected. Please configure MySQL in settings.");
    return pool;
  };

  // API to configure/test database connection
  app.post("/api/config/db", async (req, res) => {
    const { host, user, password, database, port } = req.body;
    try {
      const newPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port: port || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      const connection = await newPool.getConnection();
      connection.release();

      // If successful, update the global pool
      if (pool) await pool.end();
      pool = newPool;

      // Ensure table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS plants (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          datePlanted DATETIME NOT NULL,
          isOutdoor BOOLEAN DEFAULT FALSE,
          health VARCHAR(50),
          size VARCHAR(50),
          notes TEXT,
          images JSON,
          history JSON,
          aiInsights JSON,
          position JSON
        )
      `);

      res.json({ success: true, message: "Connected to MySQL successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/health/db", async (req, res) => {
    try {
      if (!pool) {
        return res.json({ status: "disconnected", message: "Database not configured" });
      }
      const connection = await pool.getConnection();
      connection.release();
      res.json({ status: "connected", message: "Database connection healthy" });
    } catch (error: any) {
      res.json({ status: "error", message: error.message });
    }
  });

  // API Routes for Plants
  app.get("/api/plants", async (req, res) => {
    try {
      const [rows] = await getPool().query("SELECT * FROM plants");
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/plants", async (req, res) => {
    const plant = req.body;
    try {
      await getPool().query(
        "INSERT INTO plants (id, name, type, datePlanted, isOutdoor, health, size, notes, images, history, aiInsights, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          plant.id,
          plant.name,
          plant.type,
          plant.datePlanted,
          plant.isOutdoor,
          plant.health,
          plant.size,
          plant.notes,
          JSON.stringify(plant.images || []),
          JSON.stringify(plant.history || []),
          JSON.stringify(plant.aiInsights || []),
          JSON.stringify(plant.position || { x: 50, y: 50 })
        ]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/plants/:id", async (req, res) => {
    const { id } = req.params;
    const plant = req.body;
    try {
      await getPool().query(
        "UPDATE plants SET name=?, type=?, datePlanted=?, isOutdoor=?, health=?, size=?, notes=?, images=?, history=?, aiInsights=?, position=? WHERE id=?",
        [
          plant.name,
          plant.type,
          plant.datePlanted,
          plant.isOutdoor,
          plant.health,
          plant.size,
          plant.notes,
          JSON.stringify(plant.images || []),
          JSON.stringify(plant.history || []),
          JSON.stringify(plant.aiInsights || []),
          JSON.stringify(plant.position || { x: 50, y: 50 }),
          id
        ]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/plants/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await getPool().query("DELETE FROM plants WHERE id=?", [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
