# Guía para Corregir Errores de CSV

## Error: "bare " in non-quoted-field"

Este error ocurre cuando hay comillas dobles (") mal formateadas en el archivo CSV.

### Problemas comunes:
1. **Comillas sin cerrar**: `"Juan Perez, 30, Madrid`
2. **Comillas dentro del texto**: `Juan "El Genio" Perez, 30, Madrid`
3. **Mezcla de comillas**: `"Juan Perez", 30, 'Madrid'`

### Soluciones:

#### 1. Eliminar todas las comillas:
```csv
Juan Perez,30,Madrid,Ingeniero de software
Maria Garcia,25,Barcelona,Diseñadora UX
```

#### 2. Si necesitas usar comillas, hazlo correctamente:
```csv
"Juan Perez",30,"Madrid","Ingeniero de software"
"Maria Garcia",25,"Barcelona","Diseñadora UX"
```

#### 3. Para texto con comillas internas, duplica las comillas:
```csv
"Juan ""El Genio"" Perez",30,"Madrid","Ingeniero de software"
```

## Recomendaciones generales:

1. **Usa un editor de texto simple** como Notepad++ o Visual Studio Code
2. **Evita Microsoft Excel** para crear CSVs (puede añadir formato extraño)
3. **Guarda en UTF-8** para evitar problemas de codificación
4. **Revisa el archivo** línea por línea si hay errores
5. **Mantén el formato simple**: `valor1,valor2,valor3`

## Archivo de ejemplo correcto:
Usa el archivo `ejemplo-csv-correcto.csv` como referencia.

## Si el problema persiste:
1. Abre tu CSV en un editor de texto
2. Busca comillas dobles (") mal formateadas
3. Elimínalas o corrígelas según las soluciones arriba
4. Guarda el archivo y vuelve a intentar
