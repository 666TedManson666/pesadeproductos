# 🐓 PesaDeProductos

Sistema de pesaje de productos para camiones de carga. Captura el peso desde una báscula industrial conectada por puerto serial y lo guarda en una base de datos PostgreSQL.

**Stack:** Electron · React · TypeScript · PostgreSQL · serialport

---

## 📋 Requisitos Previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org/download/windows/) |
| Git | cualquiera | [git-scm.com](https://git-scm.com) |

---

## ⚙️ Instalación Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/666TedManson666/pesadeproductos.git
cd pesadeproductos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la base de datos

#### 3a. Crear la base de datos en pgAdmin 4
1. Abre **pgAdmin 4**
2. Conecta al servidor PostgreSQL con tu usuario `postgres`
3. Clic derecho en **Databases → Create → Database**
4. Nombre: `pesadeproductos` → **Save**

#### 3b. Crear el archivo `.env`

Copia el archivo de ejemplo y edítalo con tus credenciales:

```bash
copy .env.example .env
```

Abre `.env` y ajusta los valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pesadeproductos
DB_USER=postgres
DB_PASSWORD=tu_contraseña_de_postgres_aqui
```

> ⚠️ **Importante:** El archivo `.env` nunca se sube a GitHub. Cada persona que instale el sistema debe crear su propio `.env`.

### 4. Lanzar la aplicación

```bash
npm run electron:dev
```

Al iniciarse por primera vez, la app crea automáticamente todas las tablas y carga los datos iniciales (agencias, almacenes y productos).

---

## 🔌 Configuración de la Báscula

La báscula debe estar conectada por **puerto serial (USB/RS-232)** y enviar datos con el formato:

```
15.5 KG G
```

### Dentro de la app → Configuración → Puerto Serial:

| Parámetro | Valor |
|---|---|
| Puerto | COM3 (o el que corresponda) |
| Baud Rate | 9600 |
| Data Bits | 8 |
| Stop Bits | 1 |
| Paridad | None |
| Regex | `([0-9]+\.?[0-9]*)\s*KG\s*G` |

> El sistema espera **1 segundo de estabilidad** antes de habilitar el botón de captura. Si la báscula tiene un formato diferente, cambia el campo **Regex** en Configuración.

---

## 🏗️ Estructura del Proyecto

```
pesadeproductos/
├── electron/
│   ├── database/        # Esquema SQL, migraciones y conexión a PG
│   ├── ipc/             # Handlers de comunicación Electron ↔ React
│   ├── repositories/    # Consultas SQL (productos, pesajes, sesiones...)
│   └── serial/          # Lector de puerto serial + parser de peso
├── src/
│   ├── api/             # API de Electron expuesta al frontend
│   ├── components/      # Componentes React reutilizables
│   ├── pages/           # Vistas: Dashboard, Historial, Configuración
│   ├── store/           # Estado global (Zustand)
│   └── types/           # Tipos TypeScript compartidos
└── .env.example         # Plantilla de variables de entorno
```

---

## 🗄️ Base de Datos

Las tablas se crean automáticamente al lanzar la app. Estructura principal:

| Tabla | Descripción |
|---|---|
| `weighings` | Registros de peso capturados |
| `products` | Catálogo de productos |
| `warehouses` | Almacenes y rutas |
| `agencies` | Agencias |
| `sessions` | Sesiones de pesaje |
| `settings` | Configuración del puerto serial |

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run electron:dev` | Inicia en modo desarrollo (Vite + Electron) |
| `npm run electron:build` | Genera el instalador `.exe` |
| `npm run dev` | Solo el frontend (sin Electron) |

---

## 🔧 Solución de Problemas

**Error `ECONNREFUSED 127.0.0.1:5432`**
→ PostgreSQL no está corriendo. Abre el Administrador de Servicios de Windows y arranca el servicio `postgresql-x64-XX`.

**La báscula no conecta**
→ Verifica el número de COM en *Administrador de dispositivos → Puertos COM y LPT*. Actualiza el puerto en la app (Configuración → Puerto Serial).

**La báscula conecta pero no extrae el número**
→ Usa la función **"Probar conexión"** en Configuración para ver el string crudo que envía la báscula y ajusta el campo Regex.
