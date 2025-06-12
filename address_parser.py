import re
from functools import lru_cache
from typing import Optional, Dict, List, Tuple, Union
import pandas as pd

class OptimizedAddressParser:
    
    def __init__(self):
        self.TIPOS_VIA_OFICIAL = {
            'CL': 'CALLE',
            'KR': 'CARRERA',
            'DG': 'DIAGONAL',
            'TV': 'TRANSVERSAL',
            'AC': 'AVENIDA CALLE',
            'AK': 'AVENIDA CARRERA'
        }
        
        self.MAPEO_TIPOS_VIA = {
            'CALLE': 'CL', 'CL': 'CL', 'CALL': 'CL', 'CAL': 'CL',
            'CLLE': 'CL', 'CLL': 'CL', 'C': 'CL',
            
            'CARRERA': 'KR', 'KR': 'KR', 'CR': 'KR', 'CRA': 'KR',
            'CARR': 'KR', 'K': 'KR', 'KRA': 'KR',
            
            'DIAGONAL': 'DG', 'DG': 'DG', 'DIAG': 'DG',
            
            'TRANSVERSAL': 'TV', 'TV': 'TV', 'TR': 'TV', 'TRANS': 'TV',
            
            'AVENIDA CALLE': 'AC', 'AC': 'AC', 'AV CALLE': 'AC', 
            'AV CL': 'AC', 'AVENIDA CL': 'AC',
            
            'AVENIDA CARRERA': 'AK', 'AK': 'AK', 'AV CARRERA': 'AK',
            'AV CR': 'AK', 'AVENIDA CR': 'AK', 'AUTOPISTA': 'AK'
        }
        
        self.AVENIDAS_ESPECIALES = {
            'EL DORADO': {'tipo': 'AC', 'numero': '26'},
            'DORADO': {'tipo': 'AC', 'numero': '26'},
            'NQS': {'tipo': 'AK', 'numero': '30'},
            'NORTE QUITO SUR': {'tipo': 'AK', 'numero': '30'},
            'CARACAS': {'tipo': 'AK', 'numero': '14'},
            'SEPTIMA': {'tipo': 'AK', 'numero': '7'},
            'BOYACA': {'tipo': 'AK', 'numero': '72'},
            'BOYACÁ': {'tipo': 'AK', 'numero': '72'},
            'CIUDAD DE CALI': {'tipo': 'AK', 'numero': '86'},
            'PRIMERA DE MAYO': {'tipo': 'AC', 'numero': '22', 'sufijo': 'SUR'},
            'AMERICAS': {'tipo': 'AC', 'numero': '6'},
            'LAS AMERICAS': {'tipo': 'AC', 'numero': '6'}
        }
        
        # Abreviaturas que significan "número" y deben eliminarse
        self.ABREVIATURAS_NUMERO = {'N', 'NO', 'NUM', 'NRO', 'NUMERO', '#'}
        
        # Elementos especiales que deben preservar su posición
        self.ELEMENTOS_ESPECIALES = {'BIS'}

    def parametrizar_direccion(self, direccion: str) -> Dict:
        """Parser completamente reescrito para manejar todos los casos problemáticos"""
        resultado = {
            'direccion_original': direccion,
            'direccion_limpia': '',
            'direccion_parametrizada': '',
            'componentes': {},
            'errores': [],
            'valida': False
        }
        
        if not direccion or str(direccion).strip() in ['', 'nan', 'None']:
            resultado['errores'].append("Dirección vacía")
            return resultado
        
        try:
            # PASO 1: Limpieza inicial agresiva
            direccion_procesada = self._limpiar_direccion_agresiva(direccion)
            resultado['direccion_limpia'] = direccion_procesada
            
            if not direccion_procesada:
                resultado['errores'].append("Dirección vacía después de limpieza")
                resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
                return resultado
            
            # PASO 2: Extraer la parte de dirección útil
            direccion_util = self._extraer_direccion_util(direccion_procesada)
            
            if not direccion_util:
                resultado['errores'].append("No se encontró dirección válida")
                resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
                return resultado
            
            # PASO 3: Detectar tipo de vía
            tipo_via = self._detectar_tipo_via_robusto(direccion_util)
            
            # PASO 4: Extraer elementos preservando posición original
            elementos_secuenciales = self._extraer_elementos_preservando_posicion(direccion_util, tipo_via)
            
            # PASO 5: Validar mínimo de elementos numéricos
            numeros_encontrados = [elem for elem in elementos_secuenciales if elem['tipo'] == 'numero']
            if len(numeros_encontrados) < 2:
                resultado['errores'].append("Dirección debe tener al menos 2 números")
                resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
                return resultado
            
            # PASO 6: Construir dirección final preservando posiciones
            direccion_final = self._construir_direccion_con_posiciones_preservadas(tipo_via, elementos_secuenciales)
            
            resultado['direccion_parametrizada'] = direccion_final
            resultado['valida'] = True
            
            # Componentes
            resultado['componentes'] = {
                'tipo_via': tipo_via,
                'numero_via': numeros_encontrados[0]['valor'] if numeros_encontrados else None,
                'via_generadora': numeros_encontrados[1]['valor'] if len(numeros_encontrados) > 1 else None,
                'distancia': numeros_encontrados[2]['valor'] if len(numeros_encontrados) > 2 else None,
                'sufijos': [elem['valor'] for elem in elementos_secuenciales if elem['tipo'] in ['orientacion', 'especial']]
            }
            
        except Exception as e:
            resultado['errores'].append(f"Error: {str(e)}")
            resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
        
        return resultado
    
    def _limpiar_direccion_agresiva(self, direccion: str) -> str:
        """Limpieza agresiva de la dirección eliminando texto innecesario"""
        direccion = str(direccion).upper().strip()
        
        # Eliminar coordenadas y texto técnico
        direccion = re.sub(r'COORDENADAS:\s*[\d\.\-\s,]+', ' ', direccion)
        
        # Eliminar referencias de inmuebles
        patrones_inmuebles = [
            r'PISO\s*\d+', r'PI\s*\d+', r'PIS:\s*\d+', 
            r'OFICINA\s*\d+', r'APARTAMENTO\s*\d+', r'LOCAL\s*\d+',
            r'EDIFICIO\s+\w+', r'TORRE\s+\w+', r'BLOQUE\s+\w+',
            r'BARRIO\s+[\w\s]+', r'DATA\s+CENTER\s+\w+',
            r'\s+AD\s+\d+', r'\s+AP\s+\d+', r'\s+OF\s+\d+', r'\s+LC\s+\d+'
        ]
        
        for patron in patrones_inmuebles:
            direccion = re.sub(patron, ' ', direccion, flags=re.IGNORECASE)
        
        # Eliminar referencias geográficas
        direccion = re.sub(r'BOGOT[AÁ]\s*(D\.?C\.?)?(\s*-\s*BOGOT[AÁ])?', ' ', direccion, flags=re.IGNORECASE)
        
        # Normalizar símbolos
        direccion = re.sub(r'N[º°]\.?\s*', ' ', direccion)
        direccion = re.sub(r'NO\.\s*', ' ', direccion)
        direccion = re.sub(r'#\s*', ' ', direccion)
        direccion = re.sub(r'\s*-\s*', ' ', direccion)
        
        # Normalizar espacios
        direccion = re.sub(r'\s+', ' ', direccion).strip()
        
        return direccion
    
    def _extraer_direccion_util(self, direccion: str) -> str:
        """Extrae solo la parte útil de la dirección, eliminando nombres largos al inicio"""
        # Buscar patrones de dirección válidos
        patron_direccion = r'(CL|KR|CR|CRA|CALLE|CARRERA|TV|DG|AC|AK|TRANSVERSAL|DIAGONAL|AVENIDA)\s+[\d\w\s]+'
        
        # Buscar la primera ocurrencia de un patrón de dirección
        match = re.search(patron_direccion, direccion, re.IGNORECASE)
        
        if match:
            # Extraer desde donde empieza la dirección hasta el final
            inicio_direccion = match.start()
            direccion_util = direccion[inicio_direccion:]
            
            # Eliminar texto duplicado (cuando se repite la misma dirección)
            direccion_util = self._eliminar_duplicacion_texto(direccion_util)
            
            return direccion_util
        
        return direccion
    
    def _eliminar_duplicacion_texto(self, direccion: str) -> str:
        """Elimina duplicación de texto preservando la primera estructura completa"""
        # Convertir a mayúsculas para análisis
        direccion_upper = direccion.upper()
        
        # Dividir por patrones de tipo de vía para detectar duplicación
        tipos_via = ['CLL', 'CL', 'KR', 'CR', 'CRA', 'CALLE', 'CARRERA', 'TV', 'DG', 'AC', 'AK']
        
        # Buscar todas las posiciones donde aparecen tipos de vía
        posiciones_tipos = []
        for tipo in tipos_via:
            pattern = rf'\b{re.escape(tipo)}\.?\s+'
            for match in re.finditer(pattern, direccion_upper):
                posiciones_tipos.append({
                    'tipo': tipo,
                    'posicion': match.start(),
                    'end': match.end(),
                    'texto': match.group()
                })
        
        # Si hay más de una ocurrencia de tipo de vía, analizar duplicación
        if len(posiciones_tipos) > 1:
            # Ordenar por posición
            posiciones_tipos.sort(key=lambda x: x['posicion'])
            
            # Tomar desde el primer tipo hasta antes del segundo
            inicio = posiciones_tipos[0]['posicion']
            fin = posiciones_tipos[1]['posicion']
            
            primera_direccion = direccion[inicio:fin].strip()
            
            # Limpiar símbolos al final de la primera dirección
            primera_direccion = re.sub(r'[\.#\-\s]+$', '', primera_direccion)
            
            # Verificar si realmente hay duplicación semántica
            # Extraer números de ambas partes para comparar
            primera_parte_numeros = re.findall(r'\d+[A-Z]*', primera_direccion.upper())
            segunda_parte = direccion[fin:].strip()
            segunda_parte_numeros = re.findall(r'\d+[A-Z]*', segunda_parte.upper())
            
            # Si hay números similares, es duplicación -> usar solo la primera
            numeros_similares = len(set(primera_parte_numeros) & set(segunda_parte_numeros))
            if numeros_similares > 0:
                return primera_direccion
            
            # Si no hay duplicación semántica, mantener todo
            return direccion
        
        return direccion
    
    def _detectar_tipo_via_robusto(self, direccion: str) -> str:
        """Detecta tipo de vía de manera robusta"""
        direccion_upper = direccion.upper()
        
        # Avenidas especiales primero
        for nombre, info in self.AVENIDAS_ESPECIALES.items():
            if nombre in direccion_upper:
                return info['tipo']
        
        # Tipos de vía en orden de especificidad
        tipos_ordenados = [
            ('AVENIDA CARRERA', 'AK'), ('AVENIDA CALLE', 'AC'),
            ('TRANSVERSAL', 'TV'), ('DIAGONAL', 'DG'),
            ('CARRERA', 'KR'), ('CALLE', 'CL'),
            ('AK', 'AK'), ('AC', 'AC'), ('TV', 'TV'), ('DG', 'DG'),
            ('KR', 'KR'), ('CL', 'CL'), ('CRA', 'KR'), ('CR', 'KR'),
            ('CLL', 'CL')
        ]
        
        for tipo_texto, tipo_codigo in tipos_ordenados:
            if re.search(rf'\b{re.escape(tipo_texto)}\.?\b', direccion_upper):
                return tipo_codigo
        
        return 'CL'  # Por defecto
    
    def _es_abreviatura_numero(self, token: str) -> bool:
        """Determina si un token es una abreviatura de 'número' que debe eliminarse"""
        return token.upper() in self.ABREVIATURAS_NUMERO
    
    def _es_elemento_especial(self, token: str) -> bool:
        """Determina si un token es un elemento especial que debe preservar su posición"""
        return token.upper() in self.ELEMENTOS_ESPECIALES
    
    def _es_letra_valida_para_numero(self, token: str, siguiente_token: str = None) -> bool:
        """
        Determina si una letra debe pegarse al número o eliminarse
        - Letras válidas: A, B, C, D, E, F, G, H, etc. (para direcciones como 74C, 18G)
        - Abreviaturas a eliminar: N, NO, NUM, NRO (significan "número")
        - Elementos especiales: BIS (se preservan en su posición)
        """
        token_upper = token.upper()
        
        # Si es abreviatura de número, no es válida
        if self._es_abreviatura_numero(token_upper):
            return False
        
        # Si es elemento especial, no se pega al número (se preserva en su posición)
        if self._es_elemento_especial(token_upper):
            return False
        
        # Si es orientación, no es letra para número
        if token_upper in ['SUR', 'ESTE', 'NORTE', 'OESTE']:
            return False
        
        # Si es una sola letra del alfabeto, probablemente es válida para el número
        if re.match(r'^[A-Z]$', token_upper):
            return True
        
        return False
    
    def _extraer_elementos_preservando_posicion(self, direccion: str, tipo_via: str) -> List[Dict]:
        """Extrae elementos manteniendo su posición original y preservando BIS y orientaciones"""
        elementos_secuenciales = []
        
        # Remover el tipo de vía del inicio
        direccion_sin_tipo = re.sub(rf'^{tipo_via}\.?\s+', '', direccion, flags=re.IGNORECASE)
        
        # Dividir en tokens manteniendo orden
        tokens = direccion_sin_tipo.split()
        
        # Sets para evitar duplicados
        numeros_vistos = set()
        orientaciones_vistas = set()
        especiales_vistos = set()
        
        i = 0
        while i < len(tokens):
            token = tokens[i].upper()
            
            # Verificar si es orientación
            if token in ['SUR', 'ESTE', 'NORTE', 'OESTE']:
                if token not in orientaciones_vistas:
                    elementos_secuenciales.append({
                        'tipo': 'orientacion',
                        'valor': token,
                        'posicion': i
                    })
                    orientaciones_vistas.add(token)
                i += 1
                continue
            
            # Verificar si es elemento especial (BIS)
            if self._es_elemento_especial(token):
                if token not in especiales_vistos:
                    elementos_secuenciales.append({
                        'tipo': 'especial',
                        'valor': token,
                        'posicion': i
                    })
                    especiales_vistos.add(token)
                i += 1
                continue
            
            # Verificar si es abreviatura de número (eliminar)
            if self._es_abreviatura_numero(token):
                i += 1
                continue
            
            # Verificar si es número con posibles letras
            if re.search(r'\d', token):
                numero_completo = None
                saltos = 0
                
                # Manejar números que ya contienen BIS
                if 'BIS' in token:
                    numero_completo = token
                    # Verificar si el siguiente token es una letra válida para BIS
                    if (i + 1 < len(tokens) and 
                        self._es_letra_valida_para_numero(tokens[i + 1])):
                        numero_completo += tokens[i + 1].upper()
                        saltos = 1
                
                # Números simples con letras ya incluidas
                elif re.match(r'^\d+[A-Z]*$', token):
                    # Verificar si el siguiente token es una letra válida
                    if (i + 1 < len(tokens) and 
                        self._es_letra_valida_para_numero(tokens[i + 1])):
                        numero_completo = token + tokens[i + 1].upper()
                        saltos = 1
                    else:
                        numero_completo = token
                
                # Números simples
                elif re.match(r'^\d+$', token):
                    # Verificar si el siguiente token es una letra válida
                    if (i + 1 < len(tokens) and 
                        self._es_letra_valida_para_numero(tokens[i + 1])):
                        numero_completo = token + tokens[i + 1].upper()
                        saltos = 1
                    else:
                        numero_completo = token
                
                # Agregar número si es válido y no duplicado
                if numero_completo:
                    numero_normalizado = self._normalizar_numero(numero_completo)
                    if numero_normalizado not in numeros_vistos:
                        elementos_secuenciales.append({
                            'tipo': 'numero',
                            'valor': numero_completo,
                            'posicion': i
                        })
                        numeros_vistos.add(numero_normalizado)
                
                i += 1 + saltos
                continue
            
            # Verificar si es letra individual válida que no se procesó
            elif self._es_letra_valida_para_numero(token):
                # Buscar el último número para intentar combinarlo
                if elementos_secuenciales:
                    for j in range(len(elementos_secuenciales) - 1, -1, -1):
                        if elementos_secuenciales[j]['tipo'] == 'numero':
                            ultimo_numero = elementos_secuenciales[j]['valor']
                            if re.match(r'^\d+$', ultimo_numero):
                                numero_combinado = ultimo_numero + token
                                numero_normalizado = self._normalizar_numero(numero_combinado)
                                
                                # Reemplazar el último número con la combinación
                                numeros_vistos.discard(self._normalizar_numero(ultimo_numero))
                                elementos_secuenciales[j]['valor'] = numero_combinado
                                numeros_vistos.add(numero_normalizado)
                                break
            
            i += 1
        
        return elementos_secuenciales
    
    def _normalizar_numero(self, numero: str) -> str:
        """Normaliza un número para comparación (elimina espacios, convierte a mayúsculas)"""
        return re.sub(r'\s+', '', numero.upper())
    
    def _construir_direccion_con_posiciones_preservadas(self, tipo_via: str, elementos_secuenciales: List[Dict]) -> str:
        """Construye la dirección final preservando las posiciones originales de todos los elementos"""
        partes = [tipo_via]
        
        # Ordenar elementos por su posición original
        elementos_ordenados = sorted(elementos_secuenciales, key=lambda x: x['posicion'])
        
        # Construir la dirección manteniendo el orden original
        for elemento in elementos_ordenados:
            partes.append(elemento['valor'])
        
        return ' '.join(partes)

    def procesar_lote_direcciones(self, direcciones: List[str]) -> pd.DataFrame:
        resultados = []
        
        for direccion in direcciones:
            resultado = self.parametrizar_direccion(direccion)
            resultados.append({
                'direccion_original': resultado['direccion_original'],
                'direccion_parametrizada': resultado['direccion_parametrizada'],
                'tipo_via': resultado['componentes'].get('tipo_via', ''),
                'numero_via': resultado['componentes'].get('numero_via', ''),
                'via_generadora': resultado['componentes'].get('via_generadora', ''),
                'distancia': resultado['componentes'].get('distancia', ''),
                'sufijos': ' '.join(resultado['componentes'].get('sufijos', [])),
                'valida': resultado['valida'],
                'errores': '; '.join(resultado['errores'])
            })
        
        return pd.DataFrame(resultados)

    def process_addresses_from_excel(self, excel_file: str, column_name: str):
        """Process addresses from Excel file and return parametrized addresses"""
        try:
            df = pd.read_excel(excel_file, sheet_name='GPON', engine='openpyxl')
            
            if column_name not in df.columns:
                print(f"❌ Columna '{column_name}' no encontrada")
                return []
            
            addresses = df[column_name].dropna().tolist()
            parametrized_addresses = []
            
            for address in addresses:
                if isinstance(address, str) and address.strip():
                    result = self.parametrizar_direccion(address)
                    if result['valida'] and result['direccion_parametrizada'] != "DIRECCION NO VALIDA":
                        parametrized_addresses.append(result['direccion_parametrizada'])
            
            return parametrized_addresses
            
        except Exception as e:
            print(f"❌ Error procesando Excel: {str(e)}")
            return []


if __name__ == "__main__":
    parser = OptimizedAddressParser()
    
    # Casos problemáticos específicos incluyendo el caso de BIS
    casos_problematicos = [
        ("YANACONA MUYU KAWSAY TV 17 B 77 A 74 SUR", "TV 17B 77A 74 SUR"),
        ("COLINA DE LOS SUEÑOS KR 54 47 A 18 SUR", "KR 54 47A 18 SUR"),
        ("DEJANDO-HUELLA CL 91 C SUR 18 H 20", "CL 91C SUR 18H 20"),
        ("EL REFUGIO CL 48 P BIS C SUR 5 10", "CL 48P BIS C SUR 5 10"),
        ("WOUNAANH CHAAIN JAU DI BAUR DO KR 18 G 72 D 15 SUR", "KR 18G 72D 15 SUR"),
        ("KR 7 CL 74 21 PIS:2 8 9", "KR 7 74 21 8 9"),
        ("CL 83 SUR 13 33 ESTE  calle 83 sur No. 13-33 Este", "CL 83 SUR 13 33 ESTE"),
        ("cl 6 D nº 4-42", "CL 6D 4 42"),
        ("CL 74 C SUR 14 40 ESTE  CLL. 74C SUR No.14-40 ESTE", "CL 74C SUR 14 40 ESTE"),
        ("AVENIDA CARRERA 86 N 43 # 55 SUR", "AK 86 43 55 SUR"),
        ("CL 111 A BIS SUR 4 A 41 ESTE", "CL 111A BIS SUR 4A 41 ESTE"),  # NUEVO CASO CRÍTICO
        ("KR 45 BIS 23 15", "KR 45 BIS 23 15"),  # Caso adicional con BIS
        ("AC 26 BIS 12 34 ESTE", "AC 26 BIS 12 34 ESTE")  # Otro caso con BIS
    ]
    
    print("🔧 PRUEBAS DE CASOS PROBLEMÁTICOS - CON PRESERVACIÓN DE BIS")
    print("=" * 110)
    print("Formato: Original → Resultado Obtenido (Esperado)")
    print("-" * 110)
    
    casos_exitosos = 0
    total_casos = len(casos_problematicos)
    
    for i, (direccion_original, esperado) in enumerate(casos_problematicos, 1):
        resultado = parser.parametrizar_direccion(direccion_original)
        obtenido = resultado['direccion_parametrizada']
        
        # Normalizar para comparación
        esperado_norm = ' '.join(esperado.split())
        obtenido_norm = ' '.join(obtenido.split())
        
        coincide = esperado_norm == obtenido_norm
        estado = "✅" if coincide else "❌"
        
        if coincide:
            casos_exitosos += 1
        
        print(f"{i:2d}. {estado} {direccion_original}")
        print(f"    → {obtenido}")
        print(f"    ✓ {esperado}")
        
        if not coincide:
            print(f"    ⚠️  DIFERENCIA DETECTADA")
            print(f"    📝 Dirección limpia: '{resultado['direccion_limpia']}'")
            if resultado['errores']:
                print(f"    🔍 Errores: {', '.join(resultado['errores'])}")
        print()
    
    print("=" * 110)
    print(f"📊 RESUMEN: {casos_exitosos}/{total_casos} casos corregidos exitosamente")
    
    if casos_exitosos == total_casos:
        print("🎉 ¡TODOS LOS CASOS PROBLEMÁTICOS SOLUCIONADOS!")
        print("🎯 Incluyendo los casos críticos:")
        print("   'CL 111 A BIS SUR 4 A 41 ESTE' → 'CL 111A BIS SUR 4A 41 ESTE'")
        print("   'AVENIDA CARRERA 86 N 43 # 55 SUR' → 'AK 86 43 55 SUR'")
        print("   'CL 74 C SUR 14 40 ESTE' → 'CL 74C SUR 14 40 ESTE'")
        print("🔤 Diferenciación correcta:")
        print("   - Letras válidas: '111 A' → '111A' (se pegan)")
        print("   - BIS: mantiene su posición original")
        print("   - Abreviaturas: '86 N' → '86' (N se elimina)")
        print("   - Orientaciones: en su posición original")
    else:
        print("⚠️  Algunos casos necesitan ajustes adicionales")
    
    print("\n🧪 PRUEBAS ADICIONALES DE VERIFICACIÓN")
    print("-" * 60)
    
    casos_adicionales = [
        "AC 32 16 87",
        "Carrera 7 17 01 Piso 3 - Bogota", 
        "KR 8 9 83",
        "CARRERA 15 # 92 - 70 OFICINA 401",
        "AVENIDA SEPTIMA 45 23",
        "CL 45 SUR 12 34 ESTE",
        "KR 86 N 43 55",  # Caso específico con N
        "CL 74 C 14 40",   # Caso específico con letra válida
        "CL 12 BIS 34 56 SUR",  # Caso específico con BIS
        "AC 45 A BIS ESTE 23 67"  # Caso complejo con BIS y orientaciones
    ]
    
    for i, direccion in enumerate(casos_adicionales, 1):
        resultado = parser.parametrizar_direccion(direccion)
        estado = "✅" if resultado['valida'] else "❌"
        
        print(f"{i}. {estado} {direccion}")
        print(f"   → {resultado['direccion_parametrizada']}")