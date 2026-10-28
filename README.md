# LASAC Inspecciones

App mobile-first para recibir bateas e inspeccionar unidades con evidencia fotográfica.
Es independiente del DMS (`grupo-lasac-admin`) pero usa **la misma base Supabase** (proyecto
"Administracion Contable"): lee `unidades` y escribe `bateas`, `inspecciones_unidad`,
`inspeccion_fotos` y `danios_unidad`. El schema lo aporta la migración 058 del DMS.

## Correr

```bash
cp .env.local.example .env.local   # completar URL y anon key de Supabase
npm install
npm run dev
```

Login: mismo usuario y clave que el DMS (Supabase Auth compartido).
En el celular: abrir la URL en Chrome/Safari → "Agregar a pantalla de inicio" (es PWA).

## Rutas

| Ruta | Qué hace |
|---|---|
| `/` | Bateas: KPIs, filtros por estado / origen / marca / destino |
| `/bateas/nueva` | Alta de batea y unidades que viajan |
| `/bateas/[id]` | Detalle del viaje, inspeccionar cada unidad |
| `/inspeccion/[id]` | Inspección guiada desde el celular |
| `/unidades` | Buscar una unidad, ver historial, abrir inspección de traslado / test drive / pre-entrega |
| `/danios` | Reclamos y daños por transportista |

---


**Problema que resuelve:** aparecen roturas en el stock sin evidencia de cuándo se produjeron
(batea, descarga, playón, traslado interno). Sin fotos al recibir, el reclamo al transportista
o a fábrica se cae y el costo lo absorbe la concesionaria.

## Regla única

> Ninguna unidad pasa de `en_transito` a `stock_fisico` sin una inspección de recepción cerrada.

La guarda vive en la base (`trg_unidades_exigir_inspeccion`). Se puede apagar desde
`config_financiera.exigir_inspeccion_recepcion = false` si hace falta un período de transición.

## Flujo

1. **Nueva batea** (`/bateas/nueva`): origen (Buenos Aires / interna / otro), sucursal destino,
   marca, transportista, chofer + DNI, patentes, remito, fechas. Se cargan las unidades que viajan
   (las compradas pasan a "en tránsito").
2. **Llegó la batea** → botón "Llegó: empezar recepción".
3. **Inspeccionar cada unidad desde el celular** (`/inspeccion/[id]`):
   - Datos: km, combustible, chofer, remito, **remito con reservas**.
   - Fotos obligatorias por zona, solo desde la cámara (`capture="environment"`). Cada foto guarda
     hora del dispositivo, GPS, tamaño y **SHA-256** del archivo original. El bucket `inspecciones`
     es privado y no permite update ni delete desde la app: la evidencia no se toca.
   - Checklist por zona (OK / Daño / N/A).
   - Daños con catálogo AIAG/ECG: **área + tipo + gravedad** (ej. `03-12-2` = paragolpes
     delantero, rayón, 2,5–7,5 cm). Todo daño necesita al menos una foto.
   - Faltantes (segunda llave, manual, rueda de auxilio…).
   - Firma del chofer en pantalla.
   - **Cerrar**: la inspección queda inmutable, la unidad pasa a stock físico con `fecha_arribo`,
     y la batea se cierra cuando no quedan unidades pendientes.
4. **Reclamos** (`/danios`): por cada daño se sigue responsable (transporte /
   fábrica / interno), estado del reclamo, N° de expediente, monto estimado y recuperado.
5. **Por transportista** (`/danios?vista=transportistas`): viajes, unidades, daños, tasa de daño
   y plata recuperada por empresa, origen, marca y destino. Es lo que se lleva a la negociación.

Desde la ficha de cada unidad (`/unidades/[id]`) se ve el historial de inspecciones y daños, y se
puede abrir una inspección de traslado interno, test drive o pre-entrega: eso arma la cadena de
custodia después de la recepción.

## Protocolo de recepción (para pegar en el playón)

1. Remito: VIN y cantidad coinciden.
2. Foto de la batea cargada **antes** de bajar nada.
3. Por unidad: VIN, frente, 4 esquinas en ¾, 2 laterales, trasera, techo, parabrisas, odómetro.
   Video 360° de 60 segundos si hay luz.
4. Revisar con luz de costado: paragolpes, zócalos, techo, parabrisas, llantas.
5. Interior: tapizados, tablero, kit, auxilio, manuales, llaves.
6. Daño → foto general + primer plano → cargarlo con zona/tipo/gravedad.
7. Daño → escribir en el remito **"Recibido con reservas: [daño, ubicación]"** y que firme el chofer.
8. Firma del chofer en el celular. Cerrar inspección.

Tiempo estimado: 6–8 minutos por unidad.

## KPIs

| KPI | Fórmula | Objetivo |
|---|---|---|
| Recepciones con inspección | unidades con inspección cerrada / unidades arribadas | 100% |
| Tasa de daño por transportista | daños atribuidos a transporte / unidades transportadas | < 5% |
| Daños detectados en recepción vs. después | daños con `batea_id` / total daños | > 80% |
| Recupero | `monto_recuperado` / `monto_estimado` (responsable = transporte) | > 60% |

## Tablas

`bateas`, `bateas_unidades`, `inspecciones_unidad`, `inspeccion_fotos`, `danios_unidad`,
vistas `vw_bateas_historial` y `vw_danios_por_transportista`, RPC `cerrar_inspeccion`.
Migración `058_logistica_bateas_inspecciones.sql` en el repo del DMS (`grupo-lasac-admin`).

## Referencias

- Códigos de daño AIAG / ECG: <https://www.ecgassociation.eu/publications-and-reports/aiag-damage-codes/>
- Captura guiada por silueta (idea para una v2): `monkvision/monkjs`, paquete `@monkvision/sights`.
- Firma en canvas: `szimek/signature_pad` (acá se implementó una versión mínima propia).
