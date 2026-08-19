<div align="center">
  <h1>🌿 ForestHome</h1>
  <p>Aplicación Web Educativa e Interactiva de Botánica y Gestión de Huerto Urbano</p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/Ver_Sitio_Web-En_Despliegue-yellow?style=for-the-badge&logo=vercel" alt="Sitio Web"></a>
    <img src="https://img.shields.io/badge/Status-Completado-blue?style=for-the-badge" alt="Status">
  </p>
</div>

---

### 📋 Descripción del Proyecto

**ForestHome** es una plataforma web integral diseñada para amantes de las plantas y la jardinería urbana. El proyecto combina un catálogo botánico educativo con un sistema de gestión personalizada que permite a los usuarios monitorear su propio huerto, recibir alertas de cuidado, diagnosticar el estado de sus plantas y participar en una comunidad compartiendo comentarios e imágenes.

---

### 📸 Vistas del Proyecto

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Vista+Principal+Catálogo" alt="Catálogo ForestHome" width="80%">
  <p><i>Catálogo botánico interactivo y panel de gestión del huerto.</i></p>
</div>

---

### 🛠️ Tecnologías Utilizadas

- **Frontend & Lógica:** React con TypeScript para un desarrollo robusto, modular y libre de errores en tiempo de ejecución.
- **Enrutamiento:** React Router para una navegación fluida entre el catálogo, la vista de detalle y el huerto privado.
- **Estilos & UI:** Tailwind CSS junto a Lucide React para una interfaz moderna, limpia y totalmente responsiva.
- **Diseño UI/UX:** Figma para el maquetado del sistema de diseño, paleta de colores y prototipado previo de componentes.
- **Backend como Servicio (BaaS):** Supabase (PostgreSQL, Auth y Storage) para la gestión de datos, autenticación de usuarios y alojamiento de imágenes en la nube.

---

### 🚀 Características Principales

- **Catálogo Botánico Dinámico:** Navegación por categorías (medicinales, huerto, ambientales) con especificaciones técnicas detalladas.
- **Mi Huerto Personal:** Panel dinámico para agregar plantas, llevar seguimiento y gestionar el estado del cultivo en tiempo real.
- **Sistema de Alertas:** Recordatorios interactivos para acciones clave como riego, abonado, poda y siembra.
- **Pestañas de Guía Especializada:** Secciones con tips de siembra, diagnóstico de hidratación, repelentes naturales y decoración.
- **Galería Interactiva y Comunidad:** Módulo para subir imágenes a Supabase Storage, calificar y comentar en cada ficha de planta.
- **Autenticación & Protecciones:** Sistema de registro/login seguro con persistencia de sesión y rutas privadas.

---

### 🗄️ Arquitectura de Base de Datos (Supabase / PostgreSQL)

El backend utiliza Supabase con relaciones optimizadas para gestionar la información técnica de las plantas y la interacción del usuario:

- **`Plants`:** Tabla principal con campos enriquecidos para cuidados (`how_to_plant`, `health_tips`, `natural_repellents`, `decor_tips`).
- **`User_Garden`:** Relación entre usuarios y plantas para el seguimiento personalizado del huerto.
- **`Comments` & `Gallery`:** Almacenamiento dinámico de comentarios e imágenes subidas por la comunidad.

---

### 🔧 Instalación Local

Si deseas clonar este proyecto y ejecutarlo en tu entorno local, sigue estos pasos:

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/shllys/ForestHome.git](https://github.com/shllys/ForestHome.git)
