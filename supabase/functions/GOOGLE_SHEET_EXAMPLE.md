# Ejemplo de Google Sheet para Testing

## URL de ejemplo para pruebas
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
```

Este es un Google Sheet público de ejemplo de Google que contiene datos de estudiantes.

## Estructura de datos esperada:
```
Name        | Gender | Class Level | Home State | Major               | Extracurricular Activity
------------|--------|-------------|------------|---------------------|------------------------
Alexandra   | Female | 4. Senior   | CA         | English             | Drama Club
Andrew      | Male   | 1. Freshman | SD         | Math                | Lacrosse
Anna        | Female | 1. Freshman | NC         | Art                 | Key Club
```

## Para crear tu propio Google Sheet de prueba:

1. **Crear un nuevo Google Sheet**
   - Ve a https://sheets.google.com
   - Crea un nuevo sheet
   - Agrega datos de ejemplo (primera fila como headers)

2. **Configurar permisos públicos**
   - Clic en "Compartir" (botón azul en la esquina superior derecha)
   - Cambiar "Restringido" a "Cualquier persona con el enlace"
   - Asegurar que el permiso sea "Viewer" (Ver)
   - Copiar el enlace

3. **Probar la URL**
   - La URL debe seguir el formato: `https://docs.google.com/spreadsheets/d/SHEET_ID/...`
   - Pegar la URL en tu configuración MindOp
   - Usar la página de pruebas para verificar que funciona

## Ejemplo de datos para tu sheet:

```csv
Producto,Precio,Stock,Categoria
Laptop,999.99,25,Electronica
Mouse,29.99,100,Accesorios
Teclado,79.99,50,Accesorios
Monitor,299.99,15,Electronica
Webcam,89.99,30,Accesorios
```

## Troubleshooting común:

- **Error "not publicly accessible"**: Verificar que el sheet esté compartido públicamente
- **Error "invalid URL format"**: Asegurar que la URL contenga `/spreadsheets/d/`
- **Datos vacíos**: Verificar que el sheet tenga contenido en la primera hoja
- **Caracteres especiales**: Asegurar que los datos estén en formato CSV válido
