import re 
from functools import lru_cache
from typing import Optional, Dict, List, Tuple

class OptimizedAddressParser:
    """
    Analizador de direcciones optimizado y corregido con patrones mejorados
    """
    
    def __init__(self):
        # Mapeo de tipos de vía - AMPLIADO
        self.TIPO_VIA = {
            # Calles - más variaciones
            'CALLE': 'CL', 'CL': 'CL', 'CALL': 'CL', 'C': 'CL',
            'CAL': 'CL', 'CLLE': 'CL', 'CLL': 'CL', 'CALL.': 'CL',
            'CLE': 'CL', 'CALLLE': 'CL', 'CALE': 'CL',
            
            # Carreras - más variaciones
            'CARRERA': 'KR', 'KR': 'KR', 'CR': 'KR', 'CRA': 'KR', 'CARR': 'KR',
            'CARRE': 'KR', 'CARRER': 'KR', 'KRA': 'KR', 'CARRET': 'KR',
            'CARRER.': 'KR', 'CARRERA.': 'KR', 'KRR': 'KR',
            
            # Transversales - más variaciones
            'TRANSVERSAL': 'TV', 'TV': 'TV', 'TR': 'TV', 'TRANS': 'TV', 
            'TRANSV': 'TV', 'TRANSVER': 'TV', 'TRANV': 'TV', 'TRANSVERSAL.': 'TV',
            'TRANSVERS': 'TV', 'TRANSV.': 'TV', 'TRAV': 'TV',
            
            # Diagonales - más variaciones
            'DIAGONAL': 'DG', 'DG': 'DG', 'DIAG': 'DG', 'DIAGONAL.': 'DG',
            'DIAGON': 'DG', 'DIAG.': 'DG',
            
            # Avenidas - más variaciones
            'AVENIDA': 'AV', 'AV': 'AV', 'AVE': 'AV', 'AVDA': 'AV',
            'AK': 'AK', 'AC': 'AC', 'AUTOPISTA': 'AK', 'AVENIDA.': 'AV',
            'AV.': 'AV', 'AVE.': 'AV', 'AVDA.': 'AV', 'AVEN': 'AV',
        }
        
        # Mapeo de avenidas importantes con sus números oficiales
        self.AVENIDAS_PRINCIPALES = {
            'CARACAS': {'tipo': 'AK', 'numero': '14'},
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
        
        # Números escritos como texto - AMPLIADO
        self.NUMEROS_TEXTO = {
            'PRIMERA': '1', 'SEGUNDA': '2', 'TERCERA': '3', 'CUARTA': '4',
            'QUINTA': '5', 'SEXTA': '6', 'SEPTIMA': '7', 'SÉPTIMA': '7',
            'OCTAVA': '8', 'NOVENA': '9', 'DECIMA': '10', 'DÉCIMA': '10',
            'ONCE': '11', 'DOCE': '12', 'TRECE': '13', 'CATORCE': '14', 'QUINCE': '15',
            'DIECISEIS': '16', 'DIECISIETE': '17', 'DIECIOCHO': '18', 'DIECINUEVE': '19',
            'VEINTE': '20', 'VEINTIUNO': '21', 'VEINTIDOS': '22', 'VEINTITRES': '23',
            'PRIMER': '1', 'SEGUNDO': '2', 'TERCER': '3', 'CUARTO': '4',
            'QUINTO': '5', 'SEXTO': '6', 'SEPTIMO': '7', 'OCTAVO': '8',
            'NOVENO': '9', 'DECIMO': '10'
        }
        
        # Orientaciones válidas - AMPLIADO
        self.ORIENTACIONES = {
            'SUR', 'NORTE', 'ESTE', 'OESTE', 'S', 'N', 'E', 'O'
        }
        
        # Mapeo de orientaciones abreviadas
        self.ORIENTACION_MAP = {
            'S': 'SUR', 'N': 'NORTE', 'E': 'ESTE', 'O': 'OESTE'
        }
        
        self.direcciones_procesadas = []  # Guardar (original, parametrizada)

    def clean_address(self, text: str) -> str:
        """Limpia y normaliza el texto de entrada - MEJORADO"""
        if not text or not isinstance(text, str):
            return ""
        text = text.upper().strip()
        # Normalizar caracteres especiales
        text = text.replace('Nº', 'NO').replace('N°', 'NO').replace('°', '').replace('º', '')
        text = text.replace('ª', 'A').replace('º', 'O').replace('Ã', 'A') 
        text = text.replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        text = text.replace('Á', 'A').replace('Ñ', 'N')
        text = text.replace('.', ' ').replace(',', ' ')
        text = text.replace('-', ' ').replace('_', ' ')
        text = text.replace('#', ' ').replace('/', ' ')
        # Normalizar BIS y variaciones
        text = re.sub(r'\bBIS\b|\bBIZ\b|\bVIS\b', 'BIS', text)
        # Separar orientaciones pegadas a números
        text = re.sub(r'(\d+)(SUR|NORTE|ESTE|OESTE|S|N|E|O)\b', r'\1 \2', text)
        # Convertir números escritos a dígitos
        for texto, numero in self.NUMEROS_TEXTO.items():
            text = re.sub(r'\b' + texto + r'\b', numero, text)
        # Eliminar palabras irrelevantes y referencias
        patterns_to_remove = [
            r'EXT\s*\d*', r'EXTERNO\s*\d*', r'ID\s*\d*', r'SENTIDO\s+[A-Z\s-]+', r'POR\s+',
            r'\bSENTIDO\b', r'\bEXTERNO\b', r'\bID\b', r'\bEXT\b', r'\bPOR\b',
            r'\(.*?\)', r'\[.*?\]', r'\bSENTIDO\s+SUR\s*-\s*NORTE\b',
            r'\bSENTIDO\s+NORTE\s*-\s*SUR\b', r'\bSENTIDO\s+OESTE\s*-\s*ESTE\b',
            r'\bSENTIDO\s+ESTE\s*-\s*OESTE\b',
        ]
        for pattern in patterns_to_remove:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        # Unificar separadores de intersección
        text = re.sub(r'\bX\b', ' CON ', text)
        text = re.sub(r'\bPOR\b', ' CON ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def extract_address_components(self, direccion: str) -> dict:
        """Extrae componentes de la dirección de forma más precisa - MEJORADO"""
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
        # Caso especial para Av 1 de Mayo - MEJORADO
        if re.search(r'AV\.?\s*1\s+DE\s+MAYO|AVENIDA\s*1\s+DE\s+MAYO|PRIMERA\s+DE\s+MAYO', direccion, re.IGNORECASE):
            components['tipo_via'] = self.AVENIDAS_PRINCIPALES['PRIMERA_DE_MAYO']['tipo']
            components['numero_principal'] = self.AVENIDAS_PRINCIPALES['PRIMERA_DE_MAYO']['numero']
            resto = re.split(r'AV\.?\s*1\s+DE\s+MAYO|AVENIDA\s*1\s+DE\s+MAYO|PRIMERA\s+DE\s+MAYO', direccion, flags=re.IGNORECASE)[-1]
            # Si es una avenida principal, los números que siguen son secundario y terciario
            numeros = re.findall(r'(\d+[A-Z]?)', resto)
            if len(numeros) >= 1:
                components['numero_secundario'] = numeros[0]
            if len(numeros) >= 2:
                components['numero_terciario'] = numeros[1]
            return components

        # Buscar otras avenidas principales - MEJORADO
        for nombre, info in self.AVENIDAS_PRINCIPALES.items():
            patron_nombre = nombre.replace('_', r'\s+')
            if re.search(r'(?:AV|AVENIDA|AVE|AVDA)\.?\s+' + patron_nombre, direccion, re.IGNORECASE):
                components['tipo_via'] = info['tipo']
                components['numero_principal'] = info['numero']
                resto = re.split(r'(?:AV|AVENIDA|AVE|AVDA)\.?\s+' + patron_nombre + r'\s+(?:NO\.?\s*)?', direccion, flags=re.IGNORECASE)[-1]
                numeros = re.findall(r'(\d+[A-Z]?)', resto)
                if len(numeros) >= 1:
                    components['numero_secundario'] = numeros[0]
                if len(numeros) >= 2:
                    components['numero_terciario'] = numeros[1]
                return components
        
        # Si no se encontró avenida principal, proceder con la detección normal - MEJORADO
        if not components['tipo_via']:
            # Detectar tipo de vía normal - buscar el más largo primero para evitar conflictos
            for via_texto, via_codigo in sorted(self.TIPO_VIA.items(), key=len, reverse=True):
                # Usar búsqueda con límites de palabra para evitar coincidencias parciales
                if re.search(r'\b' + re.escape(via_texto) + r'\.?\b', direccion):
                    components['tipo_via'] = via_codigo
                    resto = re.split(r'\b' + re.escape(via_texto) + r'\.?\s*', direccion, 1)[1].strip()
                    break
                    
        if not components['tipo_via']:
            return components
            
        # Limpiar el resto de caracteres especiales
        resto = re.sub(r'NO\.?\s*', '', resto)
        resto = re.sub(r'#', ' ', resto)
        resto = resto.strip()
        
        # Detectar orientaciones - MEJORADO
        orientaciones_encontradas = []
        for orientacion in self.ORIENTACIONES:
            if re.search(r'\b' + orientacion + r'\b', resto):
                orientacion_std = self.ORIENTACION_MAP.get(orientacion, orientacion)
                if orientacion_std not in orientaciones_encontradas:
                    orientaciones_encontradas.append(orientacion_std)
                resto = re.sub(r'\b' + orientacion + r'\b', ' ', resto)
        
        components['orientaciones'] = orientaciones_encontradas
        
        # Detectar BIS - MEJORADO
        if re.search(r'\bBIS\b', resto):
            components['bis'] = True
            resto = re.sub(r'\bBIS\b', ' ', resto)
        
        # Limpiar espacios múltiples
        resto = re.sub(r'\s+', ' ', resto).strip()
        
        # Extraer números y letras - PATRÓN MEJORADO
        # Primero extraer todos los componentes númericos/alfanuméricos
        componentes = re.findall(r'(\d+[A-Z]?|[A-Z](?=\s|\d|$))', resto)
        
        # Procesar componentes encontrados
        idx = 0
        if idx < len(componentes):
            # Primer componente: número principal
            match = re.match(r'(\d+)([A-Z]?)', componentes[idx])
            if match:
                components['numero_principal'] = match.group(1)
                if match.group(2):
                    components['letra_principal'] = match.group(2)
                idx += 1
            elif componentes[idx].isalpha() and len(componentes[idx]) == 1:
                # Letra suelta al inicio podría ser parte del número principal anterior
                pass
        
        # Si hay una letra suelta después del número principal y no se asignó letra
        if idx < len(componentes) and not components['letra_principal']:
            if componentes[idx].isalpha() and len(componentes[idx]) == 1:
                components['letra_principal'] = componentes[idx]
                idx += 1
        
        # Segundo componente: número secundario
        if idx < len(componentes):
            match = re.match(r'(\d+)([A-Z]?)', componentes[idx])
            if match:
                components['numero_secundario'] = match.group(1)
                if match.group(2):
                    components['letra_secundaria'] = match.group(2)
                idx += 1
        
        # Si hay una letra suelta después del número secundario
        if idx < len(componentes) and not components['letra_secundaria']:
            if componentes[idx].isalpha() and len(componentes[idx]) == 1:
                components['letra_secundaria'] = componentes[idx]
                idx += 1
        
        # Tercer componente: número terciario
        if idx < len(componentes):
            match = re.match(r'(\d+)', componentes[idx])
            if match:
                components['numero_terciario'] = match.group(1)
        
        return components

    def parse_address(self, direccion: str) -> str:
        """
        Parametriza direcciones en formato estándar corrigiendo los problemas identificados - MEJORADO
        """
        if not direccion or not isinstance(direccion, str):
            self.direcciones_procesadas.append((direccion, "NO APARECE DIRECCION"))
            return "NO APARECE DIRECCION"

        try:
            direccion_original = direccion.strip()
            
            # Casos especiales que deben retornar "NO APARECE DIRECCION" - FILTROS MAS ESPECÍFICOS
            direccion_upper = direccion.upper()
            
            # Rechazar direcciones que claramente no son válidas - MEJORADO
            if (('KILÓMETRO' in direccion_upper or 'KILOMETRO' in direccion_upper or 
                 re.search(r'\bKM\s+\d+', direccion_upper)) and 
                not any(via in direccion_upper for via in ['CALLE', 'CARRERA', 'CL', 'KR', 'TV', 'DG', 'AV', 'AC', 'AK'])):
                return "NO APARECE DIRECCION"
                
            if (('VÍA' in direccion_upper or 'VIA' in direccion_upper) and 
                ('BOGOTÁ' in direccion_upper or 'BOGOTA' in direccion_upper) and
                not any(via in direccion_upper for via in ['CALLE', 'CARRERA', 'CL', 'KR', 'TV', 'DG', 'AV', 'AC', 'AK'])):
                return "NO APARECE DIRECCION"
                
            # Otros casos problemáticos - AMPLIADO
            palabras_problematicas = ['PREDIO', 'LOTE', 'MANZANA', 'TERRENO', 'FINCA', 'HACIENDA', 
                                    'VEREDA', 'CORREGIMIENTO', 'MUNICIPIO']
            if any(palabra in direccion_upper for palabra in palabras_problematicas) and \
               not any(via in direccion_upper for via in ['CALLE', 'CARRERA', 'CL', 'KR', 'TV', 'DG', 'AV', 'AC', 'AK']):
                return "NO APARECE DIRECCION"
            
            # Verificar si ya está en formato estándar
            if self.is_already_standardized(direccion_original):
                result = self.fix_standardized_format(direccion_original)
                self.direcciones_procesadas.append((direccion_original, result))
                return result
            
            # Limpiar dirección
            direccion_limpia = self.clean_address(direccion)
            
            if not direccion_limpia:
                self.direcciones_procesadas.append((direccion_original, "NO APARECE DIRECCION"))
                return "NO APARECE DIRECCION"
            
            # Casos especiales de intersecciones (CON/Y) - MEJORADO
            if re.search(r'\s(?:CON|Y)\s', direccion_limpia, re.IGNORECASE):
                result = self.parse_intersection(direccion_limpia)
                self.direcciones_procesadas.append((direccion_original, result))
                return result
            
            # Extraer componentes
            components = self.extract_address_components(direccion_limpia)
            
            if not components['tipo_via'] or not components['numero_principal']:
                self.direcciones_procesadas.append((direccion_original, "NO APARECE DIRECCION"))
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
                    # Para la mayoría de casos, la letra va pegada al número
                    num_secundario += components['letra_secundaria']
                result_parts.append(num_secundario)
            
            # Número terciario
            if components['numero_terciario']:
                result_parts.append(components['numero_terciario'])
            
            # Orientaciones al final (solo las relevantes) - MEJORADO
            if components['orientaciones']:
                # Filtrar orientaciones duplicadas y solo agregar las más relevantes
                orientaciones_unicas = []
                for orient in components['orientaciones']:
                    if orient not in orientaciones_unicas:
                        orientaciones_unicas.append(orient)
                
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
                self.direcciones_procesadas.append((direccion_original, "NO APARECE DIRECCION"))
                return "NO APARECE DIRECCION"
            
            self.direcciones_procesadas.append((direccion_original, result))
            return result

        except Exception as e:
            print(f"Error parsing address '{direccion}': {str(e)}")
            self.direcciones_procesadas.append((direccion, "NO APARECE DIRECCION"))
            return "NO APARECE DIRECCION"

    def fix_standardized_format(self, direccion: str) -> str:
        """Corrige formatos ya estandarizados pero con espacios incorrectos"""
        direccion = direccion.upper().strip()
        
        # Corregir caso AC con letra separada: "AC 145 103 B 90" -> "AC 145 103B 90"
        if direccion.startswith('AC '):
            parts = direccion.split()
            if len(parts) >= 4 and len(parts[3]) == 1 and parts[3].isalpha():
                parts[2] = parts[2] + parts[3]
                del parts[3]
                return ' '.join(parts)
        
        # Otros casos similares pueden agregarse aquí
        return direccion

    def parse_intersection(self, direccion: str) -> str:
        """Maneja direcciones con intersecciones (CON/Y/X/POR) y números adicionales"""
        try:
            for texto, numero in self.NUMEROS_TEXTO.items():
                direccion = re.sub(r'\b' + texto + r'\b', numero, direccion)
            # Unificar separadores
            direccion = re.sub(r'\b(X|POR|CON|Y)\b', ' CON ', direccion)
            # Buscar dos vías y dos números principales
            pattern = r'(CARRERA|CALLE|KR|CL|TV|DG|AV|AC|AK)\.?\s*(\d+[A-Z]?)\s*CON\s*(CARRERA|CALLE|KR|CL|TV|DG|AV|AC|AK)\.?\s*(\d+[A-Z]?)(.*)'
            match = re.search(pattern, direccion)
            if match:
                tipo1, num1, tipo2, num2, resto = match.groups()
                tipo1_std = self.TIPO_VIA.get(tipo1.upper(), tipo1)
                tipo2_std = self.TIPO_VIA.get(tipo2.upper(), tipo2)
                num1_std = self.NUMEROS_TEXTO.get(num1.upper(), num1)
                num2_std = self.NUMEROS_TEXTO.get(num2.upper(), num2)
                # Buscar números y orientaciones adicionales en resto
                adicionales = re.findall(r'(\d+[A-Z]?)', resto)
                orientaciones = re.findall(r'\b(SUR|NORTE|ESTE|OESTE)\b', resto)
                result = f"{tipo1_std} {num1_std} {tipo2_std} {num2_std}"
                for ad in adicionales:
                    result += f" {ad}"
                if orientaciones:
                    result += f" {orientaciones[0]}"
                return result.strip()
            # Si solo hay una vía y varios números
            pattern2 = r'(CARRERA|CALLE|KR|CL|TV|DG|AV|AC|AK)\.?\s*(\d+[A-Z]?)(.*)'
            match2 = re.search(pattern2, direccion)
            if match2:
                tipo, num, resto = match2.groups()
                tipo_std = self.TIPO_VIA.get(tipo.upper(), tipo)
                num_std = self.NUMEROS_TEXTO.get(num.upper(), num)
                adicionales = re.findall(r'(\d+[A-Z]?)', resto)
                orientaciones = re.findall(r'\b(SUR|NORTE|ESTE|OESTE)\b', resto)
                result = f"{tipo_std} {num_std}"
                for ad in adicionales:
                    result += f" {ad}"
                if orientaciones:
                    result += f" {orientaciones[0]}"
                return result.strip()
            return "NO APARECE DIRECCION"
        except:
            return "NO APARECE DIRECCION"

    def is_already_standardized(self, direccion: str) -> bool:
        """Verifica si una dirección ya está en formato estandarizado - MEJORADO"""
        direccion = direccion.upper().strip()
        
        # Patrones para direcciones ya estandarizadas - MÁS COMPLETOS
        std_patterns = [
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+\d+[A-Z]?\s*\d*\s*(SUR|NORTE|ESTE|OESTE)?$',
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+BIS\s+\d+[A-Z]?\s*\d*\s*(SUR|NORTE|ESTE|OESTE)?$',
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+(SUR|NORTE|ESTE|OESTE)\s+\d+[A-Z]?\s*\d*$',
            r'^AC\s+\d+\s+\d+\s+[A-Z]\s+\d+$',  # Patrón específico para AC con letra separada
            r'^(CL|KR|TV|DG|AK|AC)\s+\d+[A-Z]?\s+\d+[A-Z]?\s+\d+[A-Z]?\s*(SUR|NORTE|ESTE|OESTE)?$'  # Con 3 números
        ]
        
        return any(re.match(pattern, direccion) for pattern in std_patterns)

    def get_direcciones_procesadas(self):
        return self.direcciones_procesadas


# Función de prueba con los casos problemáticos - AMPLIADA
if __name__ == "__main__":
    parser = OptimizedAddressParser()
    
    test_cases = [
        # Casos originales
        ("AC 145 103 B 90", "AC 145 103B 90"),
        ("Kr 5 A # 30D - 25 S", "KR 5A 30D 25 SUR"),
        ("Carrera octava con Calle octava en Bogotá D.C.", "KR 8 CL 8"),
        ("PORTAL 20 DE JULIO CICLO PARQUEADERO CARRERA 5A # 31SUR- 00", "KR 5A 31 SUR"),
        ("AV 1 DE MAYO CICLO PARQUEADERO AV. CARRERA 10 # 19SUR-00", "KR 10 19 SUR"),
        ("Carrera 10 No. 1 - 66 sur", "KR 10 1 66 SUR"),
        ("Kilómetro 14 vía Bogotá Mosquera", "NO APARECE DIRECCION"),
        ("Carrera 8ª con calle 7ª", "KR 8A CL 7A"),
        ("Calle 42 No.15-23", "CL 42 15 23"),
        ("SEDE 8 - Liceo Julio César García Calle 12 N.3-50", "CL 12 3 50"),
        ("Transversal 18Bis # 38-41 piso 2", "TV 18 BIS 38 41"),
        ("Calle 146B # 90-26", "CL 146B 90 26"),
        ("Calle 17 SUR # 18-49", "CL 17 SUR 18 49"),
        ("Carrera 13 #54-74 2° piso", "KR 13 54 74"),
        
        # Casos adicionales para mejor cobertura
        ("Carrera 7A No. 20-07", "KR 7A 20 07"),
        ("Calle 26 # 13-19 Torre A Piso 15", "CL 26 13 19"),
        ("Transversal 27 bis # 42-15", "TV 27 BIS 42 15"),
        ("Diagonal 15 B sur # 20-35", "DG 15B SUR 20 35"),
        ("AV Caracas # 45-67", "AK 14 45 67"),
        ("Avenida Séptima # 32-16", "AK 7 32 16"),
        ("Calle 72 con Carrera 11", "CL 72 KR 11"),
        ("Carrera 15 # 93-07 Oficina 201", "KR 15 93 07"),
        ("CL 100 # 19A-36 Apto 304", "CL 100 19A 36"),
        ("Carrera 9 bis # 74-08", "KR 9 BIS 74 08"),
        ("Transversal 48 # 16-85 sur", "TV 48 16 85 SUR"),
        ("Diagonal 40A # 16-46", "DG 40A 16 46"),
        ("Calle 53 # 10-60/68", "CL 53 10 60"),
        ("Carrera 11A # 75-00 int 2", "KR 11A 75 00"),
        ("AC 26 # 59-51", "AC 26 59 51"),
        ("Carrera 7 # 40-62 Mezz", "KR 7 40 62"),
        ("Calle 116 # 7-15 Torre 1", "CL 116 7 15"),
        ("Transversal 93 # 53-32 Piso 6", "TV 93 53 32"),
        ("Diagonal 109 # 15-55 Local 3", "DG 109 15 55"),
        ("Carrera 54 # 127-46 norte", "KR 54 127 46 NORTE"),
        ("Calle 170 # 54-01 Conjunto Res", "CL 170 54 01"),
        ("Transversal 23 # 97-50 Casa 15", "TV 23 97 50"),
        ("Carrera 68D # 24B-10", "KR 68D 24B 10"),
        ("Calle 45 sur # 13-31", "CL 45 SUR 13 31"),
        ("Diagonal 34 # 5-18 este", "DG 34 5 18 ESTE"),
        ("Carrera 10 # 27-91 Edif Torre Central", "KR 10 27 91"),
        ("Calle 85 # 19C-25 Barrio Chapinero", "CL 85 19C 25"),
        ("Transversal 8 # 45-12 Localidad Usaquén", "TV 8 45 12"),
        ("AK 30 # 45-03", "AK 30 45 03"),  # NQS
        ("Autopista Norte # 106-38", "AK 106 38"),
        ("Carrera décima # 20-30", "KR 10 20 30"),
        ("Calle primera # 8-15", "CL 1 8 15"),
        ("Carrera segunda bis # 10-20", "KR 2 BIS 10 20"),
        ("Cll 50 # 11-18", "CL 50 11 18"),  # Abreviación mal escrita
        ("Crr 85 # 47-89", "KR 85 47 89"),  # Abreviación mal escrita
        ("Transv 15 # 23-45", "TV 15 23 45"),  # Abreviación
        ("Diag 67 # 11-23", "DG 67 11 23"),  # Abreviación
        ("Av 19 # 103-62", "AV 19 103 62"),
        ("Carr 7 # 17-01", "KR 7 17 01"),  # Abreviación
        ("Cal 134 # 7-83", "CL 134 7 83"),  # Abreviación mal escrita
        ("Carrera 7A No. 20-07-", "KR 7A 20 07"),  # Caso específico del problema
        ("Vía a Suba Km 5", "NO APARECE DIRECCION"),  # Caso inválido
        ("Predio La Esperanza", "NO APARECE DIRECCION"),  # Caso inválido
        ("Lote 15 Manzana C", "NO APARECE DIRECCION"),  # Caso inválido
        ("Finca El Paraíso", "NO APARECE DIRECCION"),  # Caso inválido
    ]
    
    print("Pruebas del parser corregido y mejorado:")
    print("=" * 90)
    
    errores = 0
    total = len(test_cases)
    
    for i, (direccion, esperado) in enumerate(test_cases, 1):
        resultado = parser.parse_address(direccion)
        status = "✓" if resultado == esperado else "✗"
        
        if resultado != esperado:
            errores += 1
        
        print(f"[{i:2d}/{total}] {status} {direccion:<55} -> {resultado}")
        if resultado != esperado:
            print(f"        Esperado: {esperado}")
        print()
    
    print("=" * 90)
    print(f"Resultados: {total - errores}/{total} casos correctos ({((total-errores)/total)*100:.1f}%)")
    if errores > 0:
        print(f"Errores: {errores} casos necesitan revisión")
    
    # Casos adicionales de prueba específicos para los problemas mencionados
    print("\n" + "=" * 90)
    print("CASOS ESPECÍFICOS PARA PROBLEMAS DETECTADOS:")
    print("=" * 90)
    
    casos_especificos = [
        ("Carrera 7A No. 20-07-", "KR 7A 20 07"),  # Problema específico
        ("Carrera 7A No. 20-07", "KR 7A 20 07"),   # Sin guión final
        ("Kr 5 A # 30D - 25 S", "KR 5A 30D 25 SUR"),  # Espacios problemáticos
        ("Carrera octava con Calle octava", "KR 8 CL 8"),  # Intersección con texto
        ("CALLE 146B # 90-26", "CL 146B 90 26"),  # Letras pegadas
        ("AC 145 103 B 90", "AC 145 103B 90"),  # Espacios en AC
        ("Transversal 18Bis # 38-41", "TV 18 BIS 38 41"),  # Bis pegado
        ("Calle 17 SUR # 18-49", "CL 17 SUR 18 49"),  # Orientación en medio
    ]
    
    for i, (direccion, esperado) in enumerate(casos_especificos, 1):
        resultado = parser.parse_address(direccion)
        status = "✓" if resultado == esperado else "✗"
        
        print(f"[{i}] {status} {direccion:<50} -> {resultado}")
        if resultado != esperado:
            print(f"      Esperado: {esperado}")
        print()