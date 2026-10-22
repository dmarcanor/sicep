/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.8-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: sicep
-- ------------------------------------------------------
-- Server version	11.8.8-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `bitacoras`
--

DROP TABLE IF EXISTS `bitacoras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacoras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `expediente_id` bigint(20) unsigned NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `fecha` date NOT NULL,
  `nota` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bitacoras_usuario_id_foreign` (`usuario_id`),
  KEY `bitacoras_expediente_id_fecha_index` (`expediente_id`,`fecha`),
  CONSTRAINT `bitacoras_expediente_id_foreign` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`),
  CONSTRAINT `bitacoras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacoras`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `bitacoras` WRITE;
/*!40000 ALTER TABLE `bitacoras` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacoras` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `casos`
--

DROP TABLE IF EXISTS `casos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `casos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) NOT NULL,
  `expediente_id` bigint(20) unsigned NOT NULL,
  `asignado_a` bigint(20) unsigned NOT NULL,
  `asignado_por` bigint(20) unsigned NOT NULL,
  `tipo_asignacion` enum('Rotativa','Manual') NOT NULL DEFAULT 'Rotativa',
  `motivo` text DEFAULT NULL,
  `estatus` enum('Pendiente','En proceso','Resuelto','Cerrado') NOT NULL DEFAULT 'Pendiente',
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `casos_codigo_unique` (`codigo`),
  KEY `casos_expediente_id_foreign` (`expediente_id`),
  KEY `casos_asignado_a_foreign` (`asignado_a`),
  KEY `casos_asignado_por_foreign` (`asignado_por`),
  CONSTRAINT `casos_asignado_a_foreign` FOREIGN KEY (`asignado_a`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `casos_asignado_por_foreign` FOREIGN KEY (`asignado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `casos_expediente_id_foreign` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `casos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `casos` WRITE;
/*!40000 ALTER TABLE `casos` DISABLE KEYS */;
/*!40000 ALTER TABLE `casos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `configuraciones`
--

DROP TABLE IF EXISTS `configuraciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuraciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `clave` varchar(255) NOT NULL,
  `valor` text DEFAULT NULL,
  `tipo` varchar(255) NOT NULL DEFAULT 'texto',
  `categoria` varchar(255) NOT NULL DEFAULT 'general',
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `configuraciones_clave_unique` (`clave`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuraciones`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `configuraciones` WRITE;
/*!40000 ALTER TABLE `configuraciones` DISABLE KEYS */;
INSERT INTO `configuraciones` VALUES
(1,'permisos_supervisor','[\"principal\",\"urd\",\"nna\",\"representantes\",\"expedientes\",\"solicitudArchivos\",\"asignacionCasos\",\"reportes\",\"historial\"]','json','permisos','Módulos visibles para el rol supervisor'),
(2,'permisos_consejero','[\"principal\",\"urd\",\"nna\",\"representantes\",\"expedientes\",\"solicitudArchivos\"]','json','permisos','Módulos visibles para el rol consejero'),
(3,'nombre_institucion','Consejo de Protección de Niños, Niñas y Adolescentes','texto','general','Nombre oficial de la institución'),
(4,'nombre_corto','CPNNA','texto','general','Nombre corto o acrónimo'),
(5,'municipio','Benítez','texto','general','Municipio donde opera'),
(6,'estado','Sucre','texto','general','Estado donde opera'),
(7,'membrete_titulo','REPÚBLICA BOLIVARIANA DE VENEZUELA','texto','membrete','Título del membrete'),
(8,'membrete_subtitulo','CONSEJO DE PROTECCIÓN DE NIÑOS, NIÑAS Y ADOLESCENTES','texto','membrete','Subtítulo del membrete'),
(9,'membrete_tercero','MUNICIPIO BENÍTEZ - ESTADO SUCRE','texto','membrete','Tercera línea del membrete'),
(10,'direccion_institucion','El Pilar, Municipio Benítez, Estado Sucre','texto','contacto','Dirección física de la institución'),
(11,'telefono_institucion','(0244) 000-0000','texto','contacto','Teléfono de contacto'),
(12,'email_institucion','contacto@cpnna.gob.ve','texto','contacto','Correo electrónico institucional'),
(13,'dias_alerta_amarillo','21','numero','sistema','Días para marcar el expediente en amarillo (por vencer)'),
(14,'dias_alerta_rojo','25','numero','sistema','Días para marcar el expediente en rojo (lapso vencido)');
/*!40000 ALTER TABLE `configuraciones` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `documentos`
--

DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documentos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `expediente_id` bigint(20) unsigned DEFAULT NULL,
  `creado_por` bigint(20) unsigned NOT NULL,
  `plantilla` varchar(255) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `datos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`datos`)),
  `estado` enum('Borrador','Emitido') NOT NULL DEFAULT 'Borrador',
  `emitido_en` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `documentos_creado_por_foreign` (`creado_por`),
  KEY `documentos_expediente_id_estado_index` (`expediente_id`,`estado`),
  CONSTRAINT `documentos_creado_por_foreign` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `documentos_expediente_id_foreign` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `expedientes`
--

DROP TABLE IF EXISTS `expedientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expedientes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nna_id` bigint(20) unsigned NOT NULL,
  `representante_id` bigint(20) unsigned NOT NULL,
  `codigo` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `hora_registro` time DEFAULT NULL,
  `sector` varchar(255) NOT NULL,
  `estatus` enum('Registrado','En revisión','Aprobado','Observado','Cerrado') NOT NULL DEFAULT 'Registrado',
  `estatus_fisico` enum('Pendiente','En Despacho','En Archivo Central') NOT NULL DEFAULT 'Pendiente',
  `cerrado_en` timestamp NULL DEFAULT NULL,
  `prioridad` enum('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
  `tipificacion` enum('Maltrato Físico','Abuso Sexual','Negligencia','Acoso Escolar','Trabajo Infantil','Violencia Psicológica','Abandono','Explotación','Otro') DEFAULT NULL,
  `causa` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `resumen_pdf_ruta` varchar(255) DEFAULT NULL,
  `resumen_pdf_nombre` varchar(255) DEFAULT NULL,
  `registrado_por` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expedientes_codigo_unique` (`codigo`),
  KEY `expedientes_registrado_por_foreign` (`registrado_por`),
  KEY `expedientes_nna_id_foreign` (`nna_id`),
  KEY `expedientes_representante_id_foreign` (`representante_id`),
  CONSTRAINT `expedientes_nna_id_foreign` FOREIGN KEY (`nna_id`) REFERENCES `nna` (`id`),
  CONSTRAINT `expedientes_registrado_por_foreign` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `expedientes_representante_id_foreign` FOREIGN KEY (`representante_id`) REFERENCES `representantes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expedientes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `expedientes` WRITE;
/*!40000 ALTER TABLE `expedientes` DISABLE KEYS */;
INSERT INTO `expedientes` VALUES
(1,1,1,'SICEP-URD-000128','2026-06-06',NULL,'Centro','Registrado','Pendiente',NULL,'Alta',NULL,NULL,NULL,NULL,NULL,1),
(2,2,2,'SICEP-URD-000127','2026-06-05',NULL,'Barrio Bolívar','En revisión','Pendiente',NULL,'Media',NULL,NULL,NULL,NULL,NULL,1),
(3,3,3,'SICEP-URD-000126','2026-06-05',NULL,'Guariquén','Aprobado','Pendiente',NULL,'Baja',NULL,NULL,NULL,NULL,NULL,1),
(4,4,4,'SICEP-URD-000125','2026-06-04',NULL,'El Muerto','Observado','Pendiente',NULL,'Alta',NULL,NULL,NULL,NULL,NULL,1),
(5,5,5,'SICEP-URD-000124','2026-06-04',NULL,'Centro','Registrado','Pendiente',NULL,'Media',NULL,NULL,NULL,NULL,NULL,1),
(6,6,6,'SICEP-URD-000129','2026-08-08',NULL,'El Pilar','Registrado','Pendiente',NULL,'Alta','Maltrato Físico','Denuncia de vecinos por castigos físicos reiterados.',NULL,NULL,NULL,1),
(7,7,7,'SICEP-URD-000130','2026-08-06',NULL,'Guariquén','Registrado','Pendiente',NULL,'Media','Negligencia','Inasistencia escolar prolongada sin justificación.',NULL,NULL,NULL,1),
(8,8,8,'SICEP-URD-000131','2026-08-03',NULL,'Aragua de Barcelona','En revisión','Pendiente',NULL,'Alta','Trabajo Infantil','Adolescente laborando en jornada nocturna.',NULL,NULL,NULL,1),
(9,9,9,'SICEP-URD-000132','2026-07-28',NULL,'El Pilar','En revisión','Pendiente',NULL,'Media','Violencia Psicológica','Remisión del plantel por cambios conductuales.',NULL,NULL,NULL,1),
(10,10,10,'SICEP-URD-000133','2026-07-21',NULL,'Barrio Bolívar','Observado','Pendiente',NULL,'Media','Acoso Escolar','Hostigamiento reiterado por compañeros de aula.',NULL,NULL,NULL,1),
(11,11,11,'SICEP-URD-000134','2026-07-20',NULL,'El Muerto','En revisión','Pendiente',NULL,'Baja','Negligencia','Falta de control médico y de vacunación.',NULL,NULL,NULL,1),
(12,12,12,'SICEP-URD-000135','2026-07-10',NULL,'Centro','Aprobado','Pendiente',NULL,'Alta','Abandono','Permanencia del niño con terceros sin autorización.',NULL,NULL,NULL,1),
(13,13,13,'SICEP-URD-000136','2026-07-02',NULL,'Guariquén','Observado','Pendiente',NULL,'Alta','Otro','Solicitud de medida de protección por riesgo del entorno.',NULL,NULL,NULL,1),
(14,14,14,'SICEP-URD-000137','2026-06-24',NULL,'El Pilar','Cerrado','Pendiente',NULL,'Baja','Negligencia','Caso conciliado entre las partes.',NULL,NULL,NULL,1),
(15,15,15,'SICEP-URD-000138','2026-06-18',NULL,'Barrio Bolívar','Aprobado','Pendiente',NULL,'Media','Violencia Psicológica','Exposición a conflictos familiares reiterados.',NULL,NULL,NULL,1),
(16,5,12,'SICEP-URD-000139','2026-10-05','10:58:00','El centro','Registrado','Pendiente',NULL,'Media','Negligencia',NULL,NULL,NULL,NULL,1),
(17,4,13,'SICEP-URD-000140','2026-09-27','13:43:00','El muco','Registrado','Pendiente',NULL,'Media','Explotación',NULL,NULL,NULL,NULL,1),
(18,14,10,'SICEP-URD-000141','2026-09-26','11:58:00','Guayacan','Registrado','Pendiente',NULL,'Media','Abuso Sexual',NULL,NULL,NULL,NULL,1),
(19,15,12,'SICEP-URD-000142','2026-09-22','13:03:00','Canchunchu','Registrado','Pendiente',NULL,'Media','Abandono',NULL,NULL,NULL,NULL,1),
(20,6,17,'SICEP-URD-000143','2026-10-20','14:34:41','centro multiple','En revisión','Pendiente',NULL,'Media','Maltrato Físico','golpes constantes',NULL,NULL,NULL,1);
/*!40000 ALTER TABLE `expedientes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `accion` varchar(255) NOT NULL,
  `modulo` varchar(255) NOT NULL,
  `registro_tipo` varchar(255) DEFAULT NULL,
  `registro_id` bigint(20) unsigned DEFAULT NULL,
  `detalles` text DEFAULT NULL,
  `estado` enum('Exitoso','Error','Pendiente') NOT NULL DEFAULT 'Exitoso',
  `ip_address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `historial_usuario_id_foreign` (`usuario_id`),
  KEY `historial_registro_tipo_registro_id_index` (`registro_tipo`,`registro_id`),
  CONSTRAINT `historial_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
INSERT INTO `historial` VALUES
(1,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(2,1,'Carga de resumen PDF','expedientes','Expediente',15,'Resumen \'abril.pdf\' cargado en el expediente SICEP-URD-000138','Exitoso','159.65.235.69'),
(3,1,'Retiro de resumen PDF','expedientes','Expediente',15,'Resumen \'abril.pdf\' retirado del expediente SICEP-URD-000138','Exitoso','159.65.235.69'),
(4,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(5,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(6,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.61'),
(7,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','38.190.125.23'),
(8,1,'Verificación de PIN fallida','auth',NULL,NULL,NULL,'Error','38.190.125.23'),
(9,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(10,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','159.65.235.69'),
(11,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(12,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(13,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(14,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(15,1,'Verificación de PIN fallida','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(16,1,'Verificación de PIN fallida','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(17,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','38.190.125.23'),
(18,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(19,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','159.65.235.69'),
(20,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','38.190.125.23'),
(21,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.57'),
(22,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.59'),
(23,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','146.70.202.35'),
(24,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.51'),
(25,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','186.165.54.137'),
(26,1,'Registro de NNA','nna','Nna',16,'NNA teki lope registrado','Exitoso','186.165.54.137'),
(27,1,'Registro de representante','representantes','Representante',16,'Representante marines campos registrado','Exitoso','186.165.54.137'),
(28,1,'Registro de NNA','nna','Nna',17,'NNA teki lopez registrado','Exitoso','186.165.54.137'),
(29,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','186.167.179.149'),
(30,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.49'),
(31,1,'Actualización de usuario','usuarios','User',3,'Usuario \'consejero\' actualizado','Exitoso','190.97.245.46'),
(32,1,'Actualización de usuario','usuarios','User',2,'Usuario \'supervisor\' actualizado','Exitoso','190.97.245.46'),
(33,1,'Actualización de usuario','usuarios','User',1,'Usuario \'admin\' actualizado','Exitoso','190.97.245.46'),
(34,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(35,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(36,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(37,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(38,3,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(39,3,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(40,3,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(41,2,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(42,2,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(43,2,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(44,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(45,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','190.97.245.46'),
(46,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(47,1,'Creación de expediente','expedientes','Expediente',16,'Expediente SICEP-URD-000139 creado','Exitoso','190.97.245.46'),
(48,1,'Creación de expediente','expedientes','Expediente',17,'Expediente SICEP-URD-000140 creado','Exitoso','190.97.245.46'),
(49,1,'Creación de expediente','expedientes','Expediente',18,'Expediente SICEP-URD-000141 creado','Exitoso','190.97.245.46'),
(50,1,'Creación de expediente','expedientes','Expediente',19,'Expediente SICEP-URD-000142 creado','Exitoso','190.97.245.46'),
(51,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(52,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(53,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(54,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(55,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(56,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(57,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(58,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','149.22.80.112'),
(59,1,'Registro de NNA','nna','Nna',18,'NNA celiacr cruz registrado','Exitoso','38.190.125.23'),
(60,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(61,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','190.97.245.46'),
(62,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','138.199.50.129'),
(63,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','38.190.125.23'),
(64,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','190.89.29.65'),
(65,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.99.22'),
(66,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.99.22'),
(67,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.99.22'),
(68,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.99.22'),
(69,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.64.126'),
(70,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.64.126'),
(71,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.64.126'),
(72,1,'Intento de inicio de sesión fallido','auth',NULL,NULL,NULL,'Error','186.165.64.126'),
(73,1,'Inicio de sesión','auth',NULL,NULL,NULL,'Exitoso','186.165.64.126'),
(74,1,'Registro de representante','representantes','Representante',17,'Representante juan prrez registrado','Exitoso','186.165.64.126'),
(75,1,'Creación de expediente','expedientes','Expediente',20,'Expediente SICEP-URD-000143 creado','Exitoso','186.165.64.126'),
(76,1,'Actualización de expediente','expedientes','Expediente',20,'Expediente SICEP-URD-000143 actualizado: estatus Registrado → En revisión','Exitoso','186.165.64.126'),
(77,1,'Cierre de sesión','auth',NULL,NULL,NULL,'Exitoso','186.165.64.126');
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `historial_cambios`
--

DROP TABLE IF EXISTS `historial_cambios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_cambios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `historial_id` bigint(20) unsigned NOT NULL,
  `campo` varchar(255) NOT NULL,
  `valor_anterior` text DEFAULT NULL,
  `valor_nuevo` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `historial_cambios_historial_id_foreign` (`historial_id`),
  CONSTRAINT `historial_cambios_historial_id_foreign` FOREIGN KEY (`historial_id`) REFERENCES `historial` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_cambios`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `historial_cambios` WRITE;
/*!40000 ALTER TABLE `historial_cambios` DISABLE KEYS */;
INSERT INTO `historial_cambios` VALUES
(1,31,'phone','0000000002','04121234567'),
(2,31,'password',NULL,'cambiada'),
(3,32,'phone','0000000001','04241234567'),
(4,32,'password',NULL,'cambiada'),
(5,33,'phone','0000000000','04161234567'),
(6,33,'password',NULL,'cambiada'),
(7,47,'nna_id',NULL,'5'),
(8,47,'representante_id',NULL,'12'),
(9,47,'sector',NULL,'El centro'),
(10,47,'fecha',NULL,'2026-10-05'),
(11,47,'hora_registro',NULL,'10:58'),
(12,47,'prioridad',NULL,'Media'),
(13,47,'tipificacion',NULL,'Negligencia'),
(14,47,'registrado_por',NULL,'1'),
(15,47,'estatus',NULL,'Registrado'),
(16,47,'codigo',NULL,'SICEP-URD-000139'),
(17,48,'nna_id',NULL,'4'),
(18,48,'representante_id',NULL,'13'),
(19,48,'sector',NULL,'El muco'),
(20,48,'fecha',NULL,'2026-09-27'),
(21,48,'hora_registro',NULL,'13:43'),
(22,48,'prioridad',NULL,'Media'),
(23,48,'tipificacion',NULL,'Explotación'),
(24,48,'registrado_por',NULL,'1'),
(25,48,'estatus',NULL,'Registrado'),
(26,48,'codigo',NULL,'SICEP-URD-000140'),
(27,49,'nna_id',NULL,'14'),
(28,49,'representante_id',NULL,'10'),
(29,49,'sector',NULL,'Guayacan'),
(30,49,'fecha',NULL,'2026-09-26'),
(31,49,'hora_registro',NULL,'11:58'),
(32,49,'prioridad',NULL,'Media'),
(33,49,'tipificacion',NULL,'Abuso Sexual'),
(34,49,'registrado_por',NULL,'1'),
(35,49,'estatus',NULL,'Registrado'),
(36,49,'codigo',NULL,'SICEP-URD-000141'),
(37,50,'nna_id',NULL,'15'),
(38,50,'representante_id',NULL,'12'),
(39,50,'sector',NULL,'Canchunchu'),
(40,50,'fecha',NULL,'2026-09-22'),
(41,50,'hora_registro',NULL,'13:03'),
(42,50,'prioridad',NULL,'Media'),
(43,50,'tipificacion',NULL,'Abandono'),
(44,50,'registrado_por',NULL,'1'),
(45,50,'estatus',NULL,'Registrado'),
(46,50,'codigo',NULL,'SICEP-URD-000142'),
(47,59,'documento_identidad',NULL,'V-13455664'),
(48,59,'nombres',NULL,'celiacr'),
(49,59,'apellidos',NULL,'cruz'),
(50,59,'fecha_nacimiento',NULL,'2026-10-18'),
(51,59,'sexo',NULL,'Masculino'),
(52,59,'lugar_nacimiento',NULL,'carupano'),
(53,74,'cedula',NULL,'V-12345688'),
(54,74,'nombres',NULL,'juan'),
(55,74,'apellidos',NULL,'prrez'),
(56,74,'telefono',NULL,'04141234567'),
(57,74,'direccion',NULL,'test address'),
(58,75,'nna_id',NULL,'6'),
(59,75,'representante_id',NULL,'17'),
(60,75,'sector',NULL,'centro multiple'),
(61,75,'fecha',NULL,'2026-10-20'),
(62,75,'prioridad',NULL,'Media'),
(63,75,'tipificacion',NULL,'Maltrato Físico'),
(64,75,'causa',NULL,'golpes constantes'),
(65,75,'hora_registro',NULL,'14:34:41'),
(66,75,'registrado_por',NULL,'1'),
(67,75,'estatus',NULL,'Registrado'),
(68,75,'codigo',NULL,'SICEP-URD-000143'),
(69,76,'estatus','Registrado','En revisión');
/*!40000 ALTER TABLE `historial_cambios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `nna`
--

DROP TABLE IF EXISTS `nna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nna` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `documento_identidad` varchar(255) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellidos` varchar(255) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `sexo` enum('Masculino','Femenino') NOT NULL,
  `lugar_nacimiento` varchar(255) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nna_documento_identidad_unique` (`documento_identidad`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nna`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `nna` WRITE;
/*!40000 ALTER TABLE `nna` DISABLE KEYS */;
INSERT INTO `nna` VALUES
(1,'V-31234567','María Fernanda','Pérez','2012-03-14','Femenino','Aragua de Barcelona',NULL),
(2,'V-32345678','José Luis','González','2010-07-22','Masculino','Aragua de Barcelona',NULL),
(3,'V-33456789','Valeria','Jiménez','2014-11-02','Femenino','Guariquén',NULL),
(4,'V-34567890','Samuel','Ortega','2009-01-30','Masculino','El Muerto',NULL),
(5,'V-35678901','Daniela','Rojas','2013-05-18','Femenino','Aragua de Barcelona',NULL),
(6,'V-36789012','Andrés Eduardo','Salazar Mata','2011-09-08','Masculino','El Pilar',NULL),
(7,'V-37890123','Génesis Carolina','Bermúdez Lara','2013-02-25','Femenino','Guariquén',NULL),
(8,'V-38901234','Jesús Alberto','Marcano Ruiz','2009-06-17','Masculino','Aragua de Barcelona',NULL),
(9,'V-39012345','Anyelis Victoria','Farías Guzmán','2015-12-03','Femenino','El Pilar',NULL),
(10,'V-40123456','Luis Fernando','Betancourt Silva','2010-04-11','Masculino','Barrio Bolívar',NULL),
(11,'V-41234567','Yorgelis Andreína','Cedeño Patiño','2012-08-29','Femenino','El Muerto',NULL),
(12,'V-42345678','Kevin Josué','Quijada Moreno','2016-01-19','Masculino','Centro',NULL),
(13,'V-43456789','Scarlet Nazareth','Idrogo Campos','2014-07-06','Femenino','Guariquén',NULL),
(14,'V-44567890','Ángel Gabriel','Nieves Carvajal','2017-10-22','Masculino','El Pilar',NULL),
(15,'V-45678901','Nathalia Isabel','Zabala Fuentes','2018-03-14','Femenino','Barrio Bolívar',NULL),
(16,'V-123654','teki','lope','2000-09-30','Femenino','atacuaro',NULL),
(17,'V-31686732','teki','lopez','2000-09-20','Femenino','puerto',NULL),
(18,'V-13455664','celiacr','cruz','2026-10-18','Masculino','carupano',NULL);
/*!40000 ALTER TABLE `nna` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `observaciones_expediente`
--

DROP TABLE IF EXISTS `observaciones_expediente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `observaciones_expediente` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `expediente_id` bigint(20) unsigned NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `texto` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `observaciones_expediente_usuario_id_foreign` (`usuario_id`),
  KEY `observaciones_expediente_expediente_id_index` (`expediente_id`),
  CONSTRAINT `observaciones_expediente_expediente_id_foreign` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`),
  CONSTRAINT `observaciones_expediente_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `observaciones_expediente`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `observaciones_expediente` WRITE;
/*!40000 ALTER TABLE `observaciones_expediente` DISABLE KEYS */;
/*!40000 ALTER TABLE `observaciones_expediente` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `plantillas`
--

DROP TABLE IF EXISTS `plantillas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `creado_por` bigint(20) unsigned NOT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `plantillas_creado_por_foreign` (`creado_por`),
  CONSTRAINT `plantillas_creado_por_foreign` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `plantillas` WRITE;
/*!40000 ALTER TABLE `plantillas` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantillas` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `representantes`
--

DROP TABLE IF EXISTS `representantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `representantes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cedula` varchar(255) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellidos` varchar(255) NOT NULL,
  `telefono` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `profesion` varchar(255) DEFAULT NULL,
  `lugar_trabajo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `representantes_cedula_unique` (`cedula`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representantes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `representantes` WRITE;
/*!40000 ALTER TABLE `representantes` DISABLE KEYS */;
INSERT INTO `representantes` VALUES
(1,'V-12345678','Yolanda','Rivas','0414-1234567','Calle Principal, Centro','yolanda.rivas@email.com','Docente','U.E. Benítez'),
(2,'V-87654321','Carlos','González','0424-9876543','Av. Bolívar, Barrio Bolívar','carlos.gonzalez@email.com','Ingeniero','Alcaldía de Aragua de Barcelona'),
(3,'V-11223344','Ana','Jiménez','0412-5556677','Calle 5, Guariquén','ana.jimenez@email.com','Enfermera','Hospital Central'),
(4,'V-55667788','Marta','Ortega','0416-1122334','Sector El Muerto','marta.ortega@email.com','Ama de casa',NULL),
(5,'V-99887766','Luis','Rojas','0426-9988776','Calle 10, Centro','luis.rojas@email.com','Comerciante','Autoempleado'),
(6,'V-13456789','Rosa Amelia','Salazar','0414-2233445','Calle Sucre, El Pilar','rosa.salazar@email.com','Costurera','Taller propio'),
(7,'V-14567890','Pedro Ramón','Bermúdez','0424-3344556','Sector Guariquén, vía principal','pedro.bermudez@email.com','Agricultor','Finca La Esperanza'),
(8,'V-15678901','Carmen Josefina','Marcano','0412-4455667','Av. Miranda, Aragua de Barcelona','carmen.marcano@email.com','Maestra','E.B. Simón Rodríguez'),
(9,'V-16789012','José Gregorio','Farías','0426-5566778','Calle Bolívar, El Pilar','jose.farias@email.com','Albañil','Autoempleado'),
(10,'V-17890123','Maritza Coromoto','Betancourt','0416-6677889','Barrio Bolívar, casa 45','maritza.betancourt@email.com','Ama de casa',NULL),
(11,'V-18901234','Douglas Antonio','Cedeño','0414-7788990','Sector El Muerto','douglas.cedeno@email.com','Pescador','Puerto de El Pilar'),
(12,'V-19012345','Yubisay del Valle','Quijada','0424-8899001','Calle Comercio, Centro','yubisay.quijada@email.com','Enfermera','Ambulatorio de El Pilar'),
(13,'V-20123456','Freddy Rafael','Idrogo','0412-9900112','Guariquén, calle 3','freddy.idrogo@email.com','Chofer','Línea de transporte municipal'),
(14,'V-21234567','Neida Margarita','Nieves','0426-1122334','Calle La República, El Pilar','neida.nieves@email.com','Comerciante','Bodega La Fe'),
(15,'V-22345678','Wilmer Alexander','Zabala','0416-2233446','Barrio Bolívar, sector alto','wilmer.zabala@email.com','Electricista','Autoempleado'),
(16,'V-3276123','marines','campos','04126576','san martin',NULL,NULL,NULL),
(17,'V-12345688','juan','prrez','04141234567','test address',NULL,NULL,NULL);
/*!40000 ALTER TABLE `representantes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `solicitudes_archivo`
--

DROP TABLE IF EXISTS `solicitudes_archivo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_archivo` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) NOT NULL,
  `expediente_id` bigint(20) unsigned NOT NULL,
  `solicitante_id` bigint(20) unsigned NOT NULL,
  `solicitante_nombre` varchar(255) DEFAULT NULL,
  `cargo` varchar(255) DEFAULT NULL,
  `caso` varchar(255) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `fecha_solicitud` date DEFAULT NULL,
  `fecha_prestamo` date DEFAULT NULL,
  `fecha_devolucion` date DEFAULT NULL,
  `ubicacion_archivo` varchar(255) DEFAULT NULL,
  `ubicacion_estante` varchar(255) DEFAULT NULL,
  `ubicacion_nivel` varchar(255) DEFAULT NULL,
  `ubicacion_caja` varchar(255) DEFAULT NULL,
  `documentos_solicitados` text DEFAULT NULL,
  `estatus` enum('Pendiente','En proceso','Completado','Rechazado','Disponible','Reservado','Prestado','Devuelto','En consulta','Extraviado','En digitalización') NOT NULL DEFAULT 'Pendiente',
  `observaciones` text DEFAULT NULL,
  `fecha_entrega` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `solicitudes_archivo_codigo_unique` (`codigo`),
  KEY `solicitudes_archivo_expediente_id_foreign` (`expediente_id`),
  KEY `solicitudes_archivo_solicitante_id_foreign` (`solicitante_id`),
  CONSTRAINT `solicitudes_archivo_expediente_id_foreign` FOREIGN KEY (`expediente_id`) REFERENCES `expedientes` (`id`),
  CONSTRAINT `solicitudes_archivo_solicitante_id_foreign` FOREIGN KEY (`solicitante_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_archivo`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `solicitudes_archivo` WRITE;
/*!40000 ALTER TABLE `solicitudes_archivo` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes_archivo` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `nombre_usuario` varchar(255) NOT NULL,
  `rol` varchar(255) NOT NULL DEFAULT 'consejero',
  `nombre_visible` varchar(255) DEFAULT NULL,
  `correo` varchar(255) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `pin` varchar(255) DEFAULT NULL,
  `pin_configurado` tinyint(1) NOT NULL DEFAULT 0,
  `telefono` varchar(255) DEFAULT NULL,
  `cargo` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_correo_unique` (`correo`),
  UNIQUE KEY `usuarios_nombre_usuario_unique` (`nombre_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES
(1,'Administrador','admin','administrador','Administrador','admin@sicep.com','$2y$12$b.yGSLQJdyyzqMDT2z2haeHRaxdtlNPv8.653D5FCUXS0fO9HSrz6','$2y$12$hIkUW2wuDZmcydz5jlrMeus35NNzvhIxAqBi2k5vhjvtWW0us3t06',1,'04161234567','Administrador',1),
(2,'Supervisor','supervisor','supervisor','Supervisor','supervisor@sicep.com','$2y$12$zRGeJDC2nl34i.KNEsIF.OBALLvU3PaOk1xvrQidZy4bi9ulyhboG','$2y$12$1LRgcRt4qGpZsdTuIqMai.4Q4L2tp7IERMCL75ud5Q1bsq5iP20oe',1,'04241234567','Supervisor',1),
(3,'Consejero','consejero','consejero','Consejero','consejero@sicep.com','$2y$12$K8uIwFYk2IDWBPYw1hnoJ.4rSw6FMFsacewNKns4LuGvWonyp66qa','$2y$12$6IdSkUDfSWtXvvJV.3B0F.nl7pxLDoSNhVocHwFqAPacvglfBMvhC',1,'04121234567','Consejero',1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-10-20 23:24:25
