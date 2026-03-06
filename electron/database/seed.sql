-- ============================================================
-- SEED: AGENCIES
-- ============================================================
INSERT INTO agencies (name) VALUES
    ('AGUADULCE'),
    ('CHIRIQUI'),
    ('OJO DE AGUA'),
    ('CAPIRA'),
    ('DESPACHO - OJO DE AGUA')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED: WAREHOUSES
-- ============================================================
INSERT INTO warehouses (code, name, agency_id, type) VALUES
    -- AGUADULCE
    ('34', 'ALM - 02-RUTA 01', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'RUTA'),
    ('35', 'ALM - 02-RUTA 02', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'RUTA'),
    ('36', 'ALM - 02-RUTA 03', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'RUTA'),
    ('37', 'ALM - 02-RUTA 04', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'RUTA'),
    ('38', 'ALM - 02-RUTA 05', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'RUTA'),
    ('70', 'ALM - 02-RUTA-06', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'RUTA'),
    ('42', 'VENTA - AGUADULCE', (SELECT id FROM agencies WHERE name='AGUADULCE'), 'PRINCIPAL'),

    -- CHIRIQUI
    ('29', 'ALM - 04-RUTA 01', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('30', 'ALM - 04-RUTA 02', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('31', 'ALM - 04-RUTA 03', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('32', 'ALM - 04-RUTA 04', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('33', 'ALM - 04-RUTA 05', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('41', 'ALM - 04-RUTA 06', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('45', 'ALM - 04-RUTA 07', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('58', 'ALM - 04-RUTA 08', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('59', 'ALM - 04-RUTA 09', (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'RUTA'),
    ('39', 'VENTA - CHIRIQUI',  (SELECT id FROM agencies WHERE name='CHIRIQUI'), 'PRINCIPAL'),

    -- OJO DE AGUA
    ('6',  'ALM - 08-RUTA 01', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('7',  'ALM - 08-RUTA 02', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('8',  'ALM - 08-RUTA 03', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('9',  'ALM - 08-RUTA 04', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('10', 'ALM - 08-RUTA 05', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('11', 'ALM - 08-RUTA 06', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('12', 'ALM - 08-RUTA 07', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('13', 'ALM - 08-RUTA 08', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('14', 'ALM - 08-RUTA 09', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('15', 'ALM - 08-RUTA 10', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('16', 'ALM - 08-RUTA 11', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('17', 'ALM - 08-RUTA 12', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('18', 'ALM - 08-RUTA 13', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('19', 'ALM - 08-RUTA 14', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('43', 'ALM - 08-RUTA 15', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('57', 'ALM - 08-RUTA 16', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('20', 'ALM - 08-RUTA 17', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('21', 'ALM - 08-RUTA 18', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('22', 'ALM - 08-RUTA 19', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('24', 'ALM - 08-RUTA 20', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('23', 'ALM - 08-RUTA 21', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('25', 'ALM - 08-RUTA 22', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('26', 'ALM - 08-RUTA 23', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('5',  'ALM - 08-RUTA 27', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('27', 'ALM - OTROS INGRESOS', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'RUTA'),
    ('1',  'PRODUCCION - OJO DE AGUA', (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'PRODUCCION'),
    ('2',  'VENTA - OJO DE AGUA',      (SELECT id FROM agencies WHERE name='OJO DE AGUA'), 'PRINCIPAL'),

    -- DESPACHO - OJO DE AGUA
    ('4',  'ALM - 08-RUTA 25', (SELECT id FROM agencies WHERE name='DESPACHO - OJO DE AGUA'), 'RUTA'),
    ('46', 'ALM - 08-RUTA 26', (SELECT id FROM agencies WHERE name='DESPACHO - OJO DE AGUA'), 'RUTA'),
    ('52', 'ALMACEN - GALORES', (SELECT id FROM agencies WHERE name='DESPACHO - OJO DE AGUA'), 'PRINCIPAL'),

    -- CAPIRA
    ('60', 'ALM - 13-RUTA 01',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('61', 'ALM - 13-RUTA 02',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('62', 'ALM - 13-RUTA 03',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('63', 'ALM - 13-RUTA 04',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('64', 'ALM - 13-RUTA 05',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('66', 'ALM - 13-RUTA 06',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('67', 'ALM - 13-RUTA 07',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('68', 'ALM - 13-RUTA 08',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('69', 'ALM - 13-RUTA 09',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'RUTA'),
    ('48', 'ALMACEN - CAPIRA',    (SELECT id FROM agencies WHERE name='CAPIRA'), 'PRINCIPAL'),
    ('49', 'PRODUCCION - CAPIRA', (SELECT id FROM agencies WHERE name='CAPIRA'), 'PRODUCCION')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED: PRODUCTS
-- ============================================================
INSERT INTO products (code, name) VALUES
    ('1010', 'POLLO PANAMA (KG)'),
    ('1021', 'ROSTY GRANDE (KG)'),
    ('1022', 'ROSTY CHICO (KG)'),
    ('1023', 'PAVIPOLLO (KG)'),
    ('1031', 'GALLINA GRANDE (KG)'),
    ('1032', 'GALLINA CHICA (KG)'),
    ('1040', 'GALLO (KG)'),
    ('2010', 'PECHUGA (KG)'),
    ('2011', 'FILETE DE PECHUGA (KG)'),
    ('2012', 'FILETITO DE PECHUGA (KG)'),
    ('2020', 'MUSLOS (KG)'),
    ('2030', 'MUSLO-ENCUENTRO (KG)'),
    ('2040', 'ENCUENTRO (KG)'),
    ('2041', 'FILETE ENCUENTRO (KG)'),
    ('2050', 'ALAS (KG)'),
    ('2060', 'PICADILLO (KG)'),
    ('2070', 'PICADO (KG)'),
    ('3010', 'CABEZAS (KG)'),
    ('3020', 'HIGADO (KG)'),
    ('3030', 'MOLLEJAS (KG)'),
    ('3031', 'MOLLEJAS GALLINA (KG)'),
    ('3040', 'PATITAS (KG)'),
    ('3041', 'PATITAS DE GALLINA (KG)'),
    ('3051', 'PESCUEZO S/PIEL (KG)'),
    ('3052', 'PESCUEZO C/PIEL (KG)'),
    ('3053', 'PESCUEZO GALLINA (KG)'),
    ('3054', 'PESCUEZO GALLO (KG)'),
    ('4010', 'HUEVOS SUELTOS'),
    ('4012', 'HUEVOS GRANDES (CARTON)'),
    ('4013', 'HUEVOS GRANDES (CAJA)'),
    ('4021', 'HUEVOS MEDIANOS (CARTON)'),
    ('4022', 'HUEVOS MEDIANOS (CAJA)'),
    ('4031', 'HUEVOS CHICOS (CARTON)'),
    ('4032', 'HUEVOS CHICOS (CAJA)'),
    ('4041', 'HUEVOS BLANCOS (CARTON)'),
    ('4042', 'HUEVOS BLANCOS (CAJA)'),
    ('4050', 'HUEVOS ROTOS (CAJA)'),
    ('4051', 'HUEVOS ROTOS (CARTON)'),
    ('4061', 'HUEVOS EMP MED (DOC)'),
    ('4062', 'HUEVOS EMP MED (CAJA)'),
    ('4070', 'HUEVOS EMP. GRANDE (CAJA)'),
    ('4080', 'HUEVOS JUMBOS (CAJA)'),
    ('4081', 'HUEVOS JUMBOS (CARTON)'),
    ('5000', 'OTROS AVICOLAS 1'),
    ('5001', 'OTROS AVICOLAS 2'),
    ('NC08', 'DIFERENCIA DE PRECIOS')
ON CONFLICT (code) DO NOTHING;
