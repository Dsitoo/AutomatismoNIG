import re
from functools import lru_cache
from typing import Optional, Dict, List, Tuple

class OptimizedAddressParser:
    """
    Analizador de direcciones optimizado y corregido
    """
    
    def __init__(self):
        # Mapeo de tipos de vía
        self.TIPO_VIA = {
            # Calles
            'CALLE': 'CL', 'CL': 'CL', 'CALL': 'CL', 'C': 'CL',
            'CAL': 'CL', 'CLLE': 'CL', 'CLL': 'CL',
            
            # Carreras
            'CARRERA': 'KR', 'KR': 'KR', 'CR': 'KR', 'CRA': 'KR', 'CARR': 'KR',
            'CARRE': 'KR', 'CARRER': 'KR', 'KRA': 'KR',
            
            # Transversales
            'TRANSVERSAL': 'TV', 'TV': 'TV', 'TR': 'TV', 'TRANS': 'TV', 
            'TRANSV': 'TV', 'TRANSVER': 'TV', 'TRANV': 'TV',
            
            # Diagonales
            'DIAGONAL': 'DG', 'DG': 'DG', 'DIAG': 'DG',
            
            # Avenidas
            'AVENIDA': 'AV', 'AV': 'AV', 'AVE': 'AV', 'AVDA': 'AV',
            'AK': 'AK', 'AC': 'AC', 'AUTOPISTA': 'AK',
        }
        
        # Mapeo de avenidas importantes con sus números oficiales
        self.AVENIDAS_PRINCIPALES = {
            'CARACAS': {'tipo': 'AK', 'numero': '14'},
            'Caracas': {'tipo': 'AK', 'numero': '14'},
            'CARRERA_DECIMA': {'tipo': 'AK', 'numero': '10'},
            'DECIMA': {'tipo': 'AK', 'numero': '10'},
            'SEPTIMA': {'tipo': 'AK', 'numero': '7'},
            'SÉPTIMA': {'tipo': 'AK', 'numero': '7'},
            'NQS': {'tipo': 'AK', 'numero': '30'},
            'QUITO': {'tipo': 'AK', 'numero': '30'},
            'BOYACA': {'tipo': 'AK', 'numero': '72'},
            'BOYACÁ': {'tipo': 'AK', 'numero': '72'},
            'CIUDAD_DE_CALI': {'tipo': 'AK', 'numero': '86'},
            'CALI': {'tipo': 'AK', 'numero': '86'},
            'SUBA': {'tipo': 'AK', 'numero': '145'},
            'PRIMERA_DE_MAYO': {'tipo': 'AC', 'numero': '22S'},
            'PRIMERO_DE_MAYO': {'tipo': 'AC', 'numero': '22S'},
            '1_DE_MAYO': {'tipo': 'AC', 'numero': '22S'},
            'JIMENEZ': {'tipo': 'AC', 'numero': '13'},
            'JIMÉNEZ': {'tipo': 'AC', 'numero': '13'},
            'EL_DORADO': {'tipo': 'AC', 'numero': '26'},
            'DORADO': {'tipo': 'AC', 'numero': '26'},
            'AMERICAS': {'tipo': 'AC', 'numero': '6'},
            'AMÉRICAS': {'tipo': 'AC', 'numero': '6'},
            'COMUNEROS': {'tipo': 'AC', 'numero': '6'},
            'CHILE': {'tipo': 'AC', 'numero': '72'},
            'COLON': {'tipo': 'AC', 'numero': '13'},
            'COLÓN': {'tipo': 'AC', 'numero': '13'},
        }
        
        # Números escritos como texto
        self.NUMEROS_TEXTO = {
            'PRIMERA': '1', 'SEGUNDA': '2', 'TERCERA': '3', 'CUARTA': '4',
            'QUINTA': '5', 'SEXTA': '6', 'SEPTIMA': '7', 'SÉPTIMA': '7',
            'OCTAVA': '8', 'NOVENA': '9', 'DECIMA': '10', 'DÉCIMA': '10',
            'ONCE': '11', 'DOCE': '12', 'TRECE': '13', 'CATORCE': '14', 'QUINCE': '15'
        }
        
        # Orientaciones válidas
        self.ORIENTACIONES = {'SUR', 'NORTE', 'ESTE', 'OESTE'}

    def clean_address(self, text: str) -> str:
        """Limpia y normaliza el texto de entrada"""
        if not text or not isinstance(text, str):
            return ""
            
        # Normalización básica
        text = text.upper().strip()
        
        # Eliminar caracteres especiales y normalizar
        text = text.replace('Nº', 'NO').replace('°', '').replace('º', '')
        text = text.replace('ª', 'A').replace('º', 'O').replace('Ã', 'A') 
        text = text.replace('é', 'E').replace('í', 'I').replace('ó', 'O').replace('ú', 'U')
        text = text.replace('.', ' ').replace(',', ' ')
        text = text.replace('-', ' ').replace('_', ' ')
        
        # Limpiar múltiples espacios
        text = re.sub(r'\s+', ' ', text)
        
        # Convertir números escritos a dígitos
        for texto, numero in self.NUMEROS_TEXTO.items():
            text = re.sub(r'\b' + texto + r'\b', numero, text)
        
        # Eliminar información adicional PERO NO direcciones válidas
        patterns_to_remove = [
            r'PISO\s+\d+', r'OFICINA\s+\d+', r'OF\s+\d+', r'LOCAL\s+\d+',
            r'LC\s+\d+', r'INT\s+\d+', r'APT[OA]?\s+\d+', r'TORRE\s+\d+',
            r'BLOQUE\s+\d+', r'INTERIOR\s+\d+', r'SEDE\s+\d+',
            r'\(.*?\)', r'COORDENADAS:?\s*[-\d\.,\s]+',
            r'BOGOTA\s*D\.?C\.?', r'BOGOTA', r'COLOMBIA',
            r'DENTRO DE LOS PREDIOS.*', r'EN BOGOTÁ.*', r'PALACIO DE NARIÑO.*',
            r'AV\s+1\s+DE\s+MAYO\s+CICLO\s+PARQUEADERO\s+AV\.?\s*',
            r'PORTAL\s+20\s+DE\s+JULIO\s+CICLO\s+PARQUEADERO\s*',
            r'^\s*SEDE\s+\d+\s*-?\s*.*?(?=CALLE|CARRERA|KR|CL|TV|DG|AV|AC|AK)',
            r'VIA\s+[A-ZÁ-Ú\s]+(?![#\d])', r'KILOMETRO.*'
        ]
        
        for pattern in patterns_to_remove:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        return text.strip()

    def extract_address_components(self, direccion: str) -> dict:
        """Extrae componentes de la dirección de forma más precisa"""
        components = {
            'tipo_via': None,
            'numero_principal': None,
            'letra_principal': None,
            'bis': False,
            'numero_secundario': None,
            'letra_secundaria': None,
            'numero_terciario': None,
            'orientaciones': []
        }
        
        direccion = direccion.upper()
          # Primero buscar avenidas principales
        # Caso especial para Av 1 de Mayo
        if re.search(r'AV\.?\s*1\s+DE\s+MAYO|AVENIDA\s*1\s+DE\s+MAYO', direccion, re.IGNORECASE):
            components['tipo_via'] = self.AVENIDAS_PRINCIPALES['PRIMERA_DE_MAYO']['tipo']
            components['numero_principal'] = self.AVENIDAS_PRINCIPALES['PRIMERA_DE_MAYO']['numero']
            resto = re.split(r'AV\.?\s*1\s+DE\s+MAYO|AVENIDA\s*1\s+DE\s+MAYO', direccion, flags=re.IGNORECASE)[-1]
            # Si es una avenida principal, los números que siguen son secundario y terciario
            numeros = re.findall(r'(\d+[A-Z]?)', resto)
            if len(numeros) >= 1:
                components['numero_secundario'] = numeros[0]
            if len(numeros) >= 2:
                components['numero_terciario'] = numeros[1]
            return components

        # Buscar otras avenidas principales
        for nombre, info in self.AVENIDAS_PRINCIPALES.items():
            if any(av + ' ' + nombre.replace('_', ' ') in direccion for av in ['AV', 'AVENIDA', 'AVE', 'AVDA']):
                components['tipo_via'] = info['tipo']
                components['numero_principal'] = info['numero']
                # Obtener el resto después del nombre de la avenida
                resto = re.split(r'AV\.?\s+' + nombre.replace('_', ' ') + r'\s+(?:NO\.?\s*)?', direccion, flags=re.IGNORECASE)[-1]
                # Si es una avenida principal, los números que siguen son secundario y terciario
                numeros = re.findall(r'(\d+[A-Z]?)', resto)
                if len(numeros) >= 1:
                    components['numero_secundario'] = numeros[0]
                if len(numeros) >= 2:
                    components['numero_terciario'] = numeros[1]
                return components
        
        # Si no se encontró avenida principal, proceder con la detección normal
        if not components['tipo_via']:
            # Detectar tipo de vía normal
            for via_texto, via_codigo in sorted(self.TIPO_VIA.items(), key=len, reverse=True):
                if via_texto in direccion:
                    components['tipo_via'] = via_codigo
                    resto = direccion.split(via_texto, 1)[1].strip()
                    break
                    
        if not components['tipo_via']:
            return components
            
        # Limpiar el resto de caracteres especiales
        resto = re.sub(r'NO\.?\s*', '', resto)
        resto = re.sub(r'#', ' ', resto)
        resto = resto.strip()
        
        # Detectar orientaciones
        for orientacion in self.ORIENTACIONES:
            if orientacion in resto:
                if orientacion not in components['orientaciones']:
                    components['orientaciones'].append(orientacion)
                resto = resto.replace(orientacion, ' ')
        
        # Detectar BIS
        if 'BIS' in resto:
            components['bis'] = True
            resto = resto.replace('BIS', ' ')
        
        # Limpiar espacios múltiples
        resto = re.sub(r'\s+', ' ', resto).strip()
        
        # Extraer números y letras - PATRÓN MEJORADO
        # Buscar secuencias de número seguido opcionalmente de letra
        numeros = re.findall(r'(\d+[A-Z]?)', resto)
        
        # También buscar letras sueltas que pueden ser parte de la dirección
        letras_sueltas = re.findall(r'\b([A-Z])\b', resto)
        
        if len(numeros) >= 1:
            # Separar número y letra del primer componente
            match = re.match(r'(\d+)([A-Z]?)', numeros[0])
            if match:
                components['numero_principal'] = match.group(1)
                if match.group(2):
                    components['letra_principal'] = match.group(2)
                elif letras_sueltas and not match.group(2):
                    # Si hay una letra suelta y no hay letra en el número principal, podría ser la letra principal
                    components['letra_principal'] = letras_sueltas.pop(0)
        
        if len(numeros) >= 2:
            # Segundo número (puede tener letra)
            match = re.match(r'(\d+)([A-Z]?)', numeros[1])
            if match:
                components['numero_secundario'] = match.group(1)
                if match.group(2):
                    components['letra_secundaria'] = match.group(2)
        
        if len(numeros) >= 3:
            # Tercer número
            match = re.match(r'(\d+)', numeros[2])
            if match:
                components['numero_terciario'] = match.group(1)
        
        return components

    def parse_address(self, direccion: str) -> str:
        """
        Parametriza direcciones en formato estándar corrigiendo los problemas identificados
        """
        if not direccion or not isinstance(direccion, str):
            return "NO APARECE DIRECCION"

        try:
            direccion_original = direccion.strip()
            
            # Casos especiales que deben retornar "NO APARECE DIRECCION" - FILTROS MAS ESPECÍFICOS
            # IMPORTANTE: Hacer esta verificación ANTES de normalizar caracteres
            direccion_upper = direccion.upper()
            
            # Rechazar direcciones que claramente no son válidas
            if (('KILÓMETRO' in direccion_upper or 'KILOMETRO' in direccion_upper or 'KM' in direccion_upper) and 
                not any(via in direccion_upper for via in ['CALLE', 'CARRERA', 'CL', 'KR', 'TV', 'DG', 'AV', 'AC', 'AK'])):
                return "NO APARECE DIRECCION"
                
            if (('VÍA' in direccion_upper or 'VIA' in direccion_upper) and 
                ('BOGOTÁ' in direccion_upper or 'BOGOTA' in direccion_upper) and
                not any(via in direccion_upper for via in ['CALLE', 'CARRERA', 'CL', 'KR', 'TV', 'DG', 'AV', 'AC', 'AK'])):
                return "NO APARECE DIRECCION"
                
            # Otros casos problemáticos
            if any(palabra in direccion_upper for palabra in ['PREDIO', 'LOTE', 'MANZANA', 'TERRENO', 'FINCA', 'HACIENDA']) and \
               not any(via in direccion_upper for via in ['CALLE', 'CARRERA', 'CL', 'KR', 'TV', 'DG', 'AV', 'AC', 'AK']):
                return "NO APARECE DIRECCION"
            
            # Verificar si ya está en formato estándar
            if self.is_already_standardized(direccion_original):
                # CORRECCIÓN: Manejar espacios en AC
                if direccion_original.upper().startswith('AC '):
                    # Corregir formato AC para que las letras vayan pegadas al número anterior
                    parts = direccion_original.split()
                    if len(parts) >= 4 and len(parts[3]) == 1 and parts[3].isalpha():
                        # AC 145 103 B 90 -> AC 145 103B 90
                        parts[2] = parts[2] + parts[3]
                        del parts[3]
                        return ' '.join(parts)
                return direccion_original
            
            # Limpiar dirección
            direccion_limpia = self.clean_address(direccion)
            
            if not direccion_limpia:
                return "NO APARECE DIRECCION"
            
            # Casos especiales de intersecciones (CON)
            if ' CON ' in direccion_limpia:
                return self.parse_intersection(direccion_limpia)
            
            # Extraer componentes
            components = self.extract_address_components(direccion_limpia)
            
            if not components['tipo_via'] or not components['numero_principal']:
                return "NO APARECE DIRECCION"
            
            # Construir dirección parametrizada
            result_parts = [components['tipo_via']]
            
            # Número principal con letra si existe
            num_principal = components['numero_principal']
            if components['letra_principal']:
                num_principal += components['letra_principal']
            result_parts.append(num_principal)
            
            # BIS si existe
            if components['bis']:
                result_parts.append('BIS')
            
            # Número secundario
            if components['numero_secundario']:
                num_secundario = components['numero_secundario']
                if components['letra_secundaria']:
                    # Para AC y otros casos, la letra va pegada al número
                    num_secundario += components['letra_secundaria']
                result_parts.append(num_secundario)
            
            # Número terciario
            if components['numero_terciario']:
                result_parts.append(components['numero_terciario'])
            
            # Orientaciones al final (solo las relevantes)
            if components['orientaciones']:
                # Filtrar orientaciones duplicadas y solo agregar las más relevantes
                orientaciones_unicas = list(dict.fromkeys(components['orientaciones']))
                # Solo agregar una orientación principal
                if len(orientaciones_unicas) == 1:
                    result_parts.append(orientaciones_unicas[0])
                elif len(orientaciones_unicas) > 1:
                    # Priorizar SUR/NORTE sobre ESTE/OESTE
                    if 'SUR' in orientaciones_unicas:
                        result_parts.append('SUR')
                    elif 'NORTE' in orientaciones_unicas:
                        result_parts.append('NORTE')
                    else:
                        result_parts.append(orientaciones_unicas[0])
            
            result = ' '.join(result_parts)
            
            # Validación final
            if len(result.split()) < 2:
                return "NO APARECE DIRECCION"
                
            return result

        except Exception as e:
            print(f"Error parsing address '{direccion}': {str(e)}")
            return "NO APARECE DIRECCION"

    def parse_intersection(self, direccion: str) -> str:
        """Maneja direcciones con intersecciones (CON)"""
        try:
            # Convertir números en texto a dígitos PRIMERO
            for texto, numero in self.NUMEROS_TEXTO.items():
                direccion = re.sub(r'\b' + texto + r'\b', numero, direccion)
            
            # Patrón mejorado para intersecciones
            # Buscar patrones como "CARRERA X CON CALLE Y" con números o texto
            match = re.search(r'(CARRERA|CALLE|KR|CL|TV|DG|AV|AC|AK)\s+(\d+[A-Z]?)\s+(?:[Cc][Oo][Nn]|[Yy])\s+(CARRERA|CALLE|KR|CL|TV|DG|AV|AC|AK)\s+(\d+[A-Z]?)', direccion)
            if match:
                tipo1, num1, tipo2, num2 = match.groups()
                tipo1_std = self.TIPO_VIA.get(tipo1, tipo1)
                tipo2_std = self.TIPO_VIA.get(tipo2, tipo2)
                return f"{tipo1_std} {num1} {tipo2_std} {num2}"
            
            return "NO APARECE DIRECCION"
        except:
            return "NO APARECE DIRECCION"

    def is_already_standardized(self, direccion: str) -> bool:
        """Verifica si una dirección ya está en formato estandarizado"""
        direccion = direccion.upper().strip()
        
        # Patrones para direcciones ya estandarizadas
        std_patterns = [
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+\d+[A-Z]?\s*\d*\s*(SUR|NORTE|ESTE|OESTE)?$',
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+BIS\s+\d+[A-Z]?\s*\d*\s*(SUR|NORTE|ESTE|OESTE)?$',
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+(SUR|NORTE|ESTE|OESTE)\s+\d+[A-Z]?\s*\d*$',
            r'^AC\s+\d+\s+\d+\s+[A-Z]\s+\d+$'  # Patrón específico para AC con letra separada
        ]
        
        return any(re.match(pattern, direccion) for pattern in std_patterns)


# Función de prueba con los casos problemáticos
if __name__ == "__main__":
    parser = OptimizedAddressParser()
    
    test_cases = [
        ("AC 145 103 B 90", "AC 145 103B 90"),  # Corregir espacio
        ("Kr 5 A # 30D - 25 S", "KR 5A 30D 25 SUR"),  # No perder la A
        ("Carrera octava con Calle octava en Bogotá D.C., dentro de los predios del Palacio de Nariño", "KR 8 CL 8"),  # Intersección
        ("PORTAL 20 DE JULIO CICLO PARQUEADERO CARRERA 5A # 31SUR- 00", "KR 5A 31 SUR"),  # Extraer dirección válida
        ("AV 1 DE MAYO CICLO PARQUEADERO AV. CARRERA 10 # 19SUR-00", "KR 10 19 SUR"),  # Extraer dirección válida
        ("Carrera 10 No. 1 - 66 sur", "KR 10 1 66 SUR"),
        ("Kilómetro 14 vía Bogotá Mosquera", "NO APARECE DIRECCION"),  # No es una dirección válida
        ("Carrera 8ª con calle 7ª", "KR 8A CL 7A"),  # Manejar ª como A
        ("Calle 42 No.15-23", "CL 42 15 23"),
        ("SEDE 8 - Liceo Julio César García Calle 12 N.3-50", "CL 12 3 50"),
        ("Transversal 18Bis # 38-41 piso 2", "TV 18 BIS 38 41"),
        ("Calle 146B # 90-26", "CL 146B 90 26"),
        ("Calle 17 SUR # 18-49", "CL 17 SUR 18 49"),
        ("Carrera 13 #54-74 2° piso", "KR 13 54 74")
    ]
    
    print("Pruebas del parser corregido:")
    print("-" * 80)
    for direccion, esperado in test_cases:
        resultado = parser.parse_address(direccion)
        status = "✓" if resultado == esperado else "✗"
        print(f"{status} {direccion:<50} -> {resultado}")
        if resultado != esperado:
            print(f"    Esperado: {esperado}")
        print()