import re
from functools import lru_cache
from typing import Optional, Dict, List, Tuple
import pandas as pd

class OptimizedAddressParser:
    """
    Analizador de direcciones optimizado y corregido con patrones mejorados
    """
    def __init__(self):
        # Mapeo de tipos de vía - AMPLIADO        
        self.TIPO_VIA = {
            # Carreras - priorizar estas variaciones primero y ajustar orden
            'KR': 'KR',  # Poner KR primero para que tenga prioridad
            'CARRERA': 'KR', 'CR': 'KR','Cr': 'KR', 'CRA': 'KR', 'CARR': 'KR',
            'CARRE': 'KR', 'CARRER': 'KR', 'KRA': 'KR', 'CARRET': 'KR',
            'CARRER.': 'KR', 'CARRERA.': 'KR', 'KRR': 'KR', 'CR.': 'KR',
            'K': 'KR',   # Agregar K como variante de Carrera
            
            # Calles - después de carreras para evitar conflictos
            'CALLE': 'CL', 'CL': 'CL', 'CALL': 'CL', 'C/': 'CL',
            'CAL': 'CL', 'CLLE': 'CL', 'CLL': 'CL', 'CALL.': 'CL',
            'CLE': 'CL', 'CALLLE': 'CL', 'CALE': 'CL',
            
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
            'CARRERA DECIMA': {'tipo': 'AK', 'numero': '10'},
            'CARRERADECIMA': {'tipo': 'AK', 'numero': '10'},
            'DECIMA': {'tipo': 'AK', 'numero': '10'},
            'SEPTIMA': {'tipo': 'AK', 'numero': '7'},
            'NQS': {'tipo': 'AK', 'numero': '30'},
            'QUITO': {'tipo': 'AK', 'numero': '30'},
            'BOYACA': {'tipo': 'AK', 'numero': '72'},
            'BOYACÁ': {'tipo': 'AK', 'numero': '72'},
            'CIUDAD DE CALI': {'tipo': 'AK', 'numero': '86'},
            'CIUDADDECALI': {'tipo': 'AK', 'numero': '86'},
            'CALI': {'tipo': 'AK', 'numero': '86'},
            'SUBA': {'tipo': 'AK', 'numero': '145'},
            'PRIMERA DE MAYO': {'tipo': 'AC', 'numero': '22S'},
            'PRIMERO DE MAYO': {'tipo': 'AC', 'numero': '22S'},
            '1 DE MAYO': {'tipo': 'AC', 'numero': '22S'},
            'JIMENEZ': {'tipo': 'AC', 'numero': '13'},
            'JIMÉNEZ': {'tipo': 'AC', 'numero': '13'},
            'EL DORADO': {'tipo': 'AC', 'numero': '26'},
            'ELDORADO': {'tipo': 'AC', 'numero': '26'},
            'DORADO': {'tipo': 'AC', 'numero': '26'},
            'AMERICAS': {'tipo': 'AC', 'numero': '6'},
            'AMÉRICAS': {'tipo': 'AC', 'numero': '6'},
            'COMUNEROS': {'tipo': 'AC', 'numero': '6'},
            'CHILE': {'tipo': 'AC', 'numero': '72'},
            'COLON': {'tipo': 'AC', 'numero': '13'},
            'COLÓN': {'tipo': 'AC', 'numero': '13'},
            'CALLE19': {'tipo': 'AC', 'numero': '19'},
            'CALLE 19': {'tipo': 'AC', 'numero': '19'},
            'AVENIDA19': {'tipo': 'AC', 'numero': '19'},
            'AVENIDA 19': {'tipo': 'AC', 'numero': '19'},
            '19': {'tipo': 'AC', 'numero': '19'},
            'CALLE68': {'tipo': 'AC', 'numero': '68'},
            'CALLE 68': {'tipo': 'AC', 'numero': '68'},
            'AVENIDA68': {'tipo': 'AC', 'numero': '68'},
            'AVENIDA 68': {'tipo': 'AC', 'numero': '68'},
            '68': {'tipo': 'AC', 'numero': '68'},
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
        
        # Eliminar caracteres especiales al inicio (ej: š, ., etc.)
        text = re.sub(r'^[^A-Z0-9]+', '', text.upper().strip())
        
        # Normalizar caracteres especiales
        text = text.replace('Nº', 'NO').replace('N°', 'NO').replace('°', '').replace('º', '')
        text = text.replace('ª', 'A').replace('º', 'O').replace('Ã', 'A') 
        text = text.replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U')
        text = text.replace('Á', 'A').replace('Ñ', 'N')
        text = text.replace('.', ' ').replace(',', ' ')
        text = text.replace('-', ' ').replace('_', ' ')
        text = text.replace('#', ' ').replace('/', ' ')        # Pre-procesar tipos de vías antes de la limpieza general
        text = re.sub(r'\bAV\s*\.\s*', 'AVENIDA ', text)
        text = re.sub(r'\bAVDA\s*\.\s*', 'AVENIDA ', text)
        text = re.sub(r'\bAVE\s*\.\s*', 'AVENIDA ', text)
        text = re.sub(r'\bAV\s+', 'AVENIDA ', text)
        
        # Normalizar Carreras primero - con más variaciones y más específico
        text = re.sub(r'\bCR\s*\.?\s*(\d)', 'CARRERA \1', text)
        text = re.sub(r'\bCRA?\s*\.?\s*(\d)', 'CARRERA \1', text)
        text = re.sub(r'\bKR\s*\.?\s*(\d)', 'CARRERA \1', text)
        text = re.sub(r'\bCARR\s*\.?\s*(\d)', 'CARRERA \1', text)
        text = re.sub(r'\bCR\s+', 'CARRERA ', text)
        text = re.sub(r'\bCRA\s+', 'CARRERA ', text)
        text = re.sub(r'\bK\s*\.?\s*(\d)', 'CARRERA \1', text)
        
        # Luego Calles
        text = re.sub(r'\bCL\s*\.?\s*', 'CALLE ', text)
        text = re.sub(r'\bCALL\s*\.?\s*', 'CALLE ', text)
        text = re.sub(r'\bC/\s*', 'CALLE ', text)

        # Normalizar BIS y variaciones
        text = re.sub(r'\bBIS\b|\bBIZ\b|\bVIS\b', 'BIS', text)
        
        # Separar orientaciones pegadas a números
        text = re.sub(r'(\d+)(SUR|NORTE|ESTE|OESTE|S|N|E|O)\b', r'\1 \2', text)
        text = re.sub(r'(\d+)([A-Z])\b(?!\s*[A-Z])', r'\1 \2', text)
        
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
            r'\bBODEGA\b', r'\bINT\b', r'\bINTERIOR\b', r'\bLOTE\b', r'\bPISO\b',
            r'\bPI\b', r'\bAPTO\b', r'\bAPARTAMENTO\b', r'\bTORRE\b', r'\bEDIF\b',
            r'\bEDIFICIO\b', r'\bOFICINA\b', r'\bCASA\b', r'\bCONJUNTO\b',
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

        if not direccion or not isinstance(direccion, str):
            return components

        direccion = direccion.upper()
        resto = direccion

        # Pre-procesar las variaciones de Avenida
        direccion = re.sub(r'\bAV\s*\.\s*', 'AVENIDA ', direccion)
        direccion = re.sub(r'\bAVDA\s*\.\s*', 'AVENIDA ', direccion)
        direccion = re.sub(r'\bAVE\s*\.\s*', 'AVENIDA ', direccion)

        # Caso especial para Av 1 de Mayo
        if re.search(r'AV\.?\s*1\s+DE\s+MAYO|AVENIDA\s*1\s+DE\s+MAYO|PRIMERA\s+DE\s+MAYO', direccion, re.IGNORECASE):
            components['tipo_via'] = 'AC'
            components['numero_principal'] = '22S'
            resto = re.split(r'AV\.?\s*1\s+DE\s+MAYO|AVENIDA\s*1\s+DE\s+MAYO|PRIMERA\s+DE\s+MAYO', direccion, flags=re.IGNORECASE)[-1]
            numeros = re.findall(r'(\d+[A-Z]?)', resto)
            if len(numeros) >= 1:
                components['numero_secundario'] = numeros[0]
            if len(numeros) >= 2:
                components['numero_terciario'] = numeros[1]
            return components

        # Buscar otras avenidas principales
        for nombre, info in self.AVENIDAS_PRINCIPALES.items():
            patron_nombre = nombre.strip()
            patterns = [
                rf'(AVENIDA|AV|AVE|AVDA)\.?\s*{patron_nombre}\s*(NO\.?|#|\.|-|\s)*(\d+[A-Z]?)',
                rf'(AVENIDA|AV|AVE|AVDA)\.?\s+(\d+)\s*{patron_nombre}' if nombre in ['19', '68'] else None,
                rf'\b{patron_nombre}\b\s*(NO\.?|#|\.|-|\s)*(\d+[A-Z]?)'
            ]

            for pattern in patterns:
                if pattern is None:
                    continue
                match = re.search(pattern, direccion, re.IGNORECASE)
                if match:
                    components['tipo_via'] = info['tipo']
                    components['numero_principal'] = info['numero']
                    resto = direccion[match.end():]
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
                if re.search(r'\b' + re.escape(via_texto) + r'\.?\b', direccion):
                    components['tipo_via'] = via_codigo
                    resto = re.split(r'\b' + re.escape(via_texto) + r'\.?\s*', direccion, 1)[1].strip()
                    break

        # Si aún no se encontró tipo de vía, buscar avenidas simples
        if not components['tipo_via']:
            av_pattern = r'(AV|AVENIDA|AVE|AVDA)\.?\s+(\d+[A-Z]?)'
            av_match = re.search(av_pattern, direccion)
            if av_match:
                components['tipo_via'] = 'AV'
                components['numero_principal'] = av_match.group(2)
                resto = direccion[av_match.end():].strip()

        # Limpiar el resto de caracteres especiales
        resto = re.sub(r'NO\.?\s*', '', resto)
        resto = re.sub(r'#', ' ', resto)
        resto = resto.strip()

        # Detectar orientaciones
        orientaciones_encontradas = []
        for orientacion in self.ORIENTACIONES:
            if re.search(r'\b' + orientacion + r'\b', resto):
                orientacion_std = self.ORIENTACION_MAP.get(orientacion, orientacion)
                if orientacion_std not in orientaciones_encontradas:
                    orientaciones_encontradas.append(orientacion_std)
                resto = re.sub(r'\b' + orientacion + r'\b', ' ', resto)

        components['orientaciones'] = orientaciones_encontradas

        # Detectar BIS
        if re.search(r'\bBIS\b', resto):
            components['bis'] = True
            resto = re.sub(r'\bBIS\b', ' ', resto)

        # Limpiar espacios múltiples
        resto = re.sub(r'\s+', ' ', resto).strip()

        # Extraer números y letras
        componentes = re.findall(r'(\d+[A-Z]?|[A-Z](?=\s|\d|$))', resto)

        # Procesar componentes encontrados
        for idx, comp in enumerate(componentes):
            if idx == 0 and not components['numero_principal']:
                match = re.match(r'(\d+)([A-Z]?)', comp)
                if match:
                    components['numero_principal'] = match.group(1)
                    if match.group(2):
                        components['letra_principal'] = match.group(2)
            elif idx == 1 or (idx == 0 and components['numero_principal']):
                match = re.match(r'(\d+)([A-Z]?)', comp)
                if match:
                    components['numero_secundario'] = match.group(1)
                    if match.group(2):
                        components['letra_secundaria'] = match.group(2)
            elif idx == 2:
                match = re.match(r'(\d+)', comp)
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

        direccion_original = direccion.strip()
        direccion_upper = direccion.upper()

        # Casos especiales que deseas permitir manualmente:
        if direccion_upper.startswith("AV CR 68 X 13"):
            self.direcciones_procesadas.append((direccion_original, "AK 68 KR 13 NORTE"))
            return "AK 68 KR 13 NORTE"
        if "AUTOPISTA NORTE 127 87" in direccion_upper:
            self.direcciones_procesadas.append((direccion_original, "AK 127 87"))
            return "AK 127 87"
        if "TOBERIN 2 AUTOPISTA NORTE" in direccion_upper:
            self.direcciones_procesadas.append((direccion_original, "AK 165 00"))
            return "AK 165 00"
        if "CALLE 79 SUR # 5 F ESTE 50" in direccion_upper:
            self.direcciones_procesadas.append((direccion_original, "CL 79 SUR 5F 50 ESTE"))
            return "CL 79 SUR 5F 50 ESTE"

        # Continuar con el parser original
        resultado = self._parse_address_core(direccion_original)
        # Siempre guardar la dirección original y la parametrizada, aunque sea vacía
        self.direcciones_procesadas.append((direccion_original, resultado))
        return resultado

    def _parse_address_core(self, direccion: str) -> str:
        """Núcleo del parser de direcciones - MEJORADO"""
        direccion = self.clean_address(direccion)
        
        # Si la dirección ya está estandarizada, devolverla tal cual
        if self.is_already_standardized(direccion):
            self.direcciones_procesadas.append((direccion, direccion))
            return direccion
        
        components = self.extract_address_components(direccion)
        
        # Construir dirección parametrizada
        direccion_parametrizada = []
        if components['tipo_via']:
            direccion_parametrizada.append(components['tipo_via'])
        if components['numero_principal']:
            direccion_parametrizada.append(components['numero_principal'])
        if components['letra_principal']:
            direccion_parametrizada.append(components['letra_principal'])
        if components['bis']:
            direccion_parametrizada.append('BIS')
        if components['numero_secundario']:
            direccion_parametrizada.append(components['numero_secundario'])
        if components['letra_secundaria']:
            direccion_parametrizada.append(components['letra_secundaria'])
        if components['numero_terciario']:
            direccion_parametrizada.append(components['numero_terciario'])
        if components['orientaciones']:
            direccion_parametrizada.append(' '.join(components['orientaciones']))
        
        resultado = ' '.join(direccion_parametrizada).strip()
        
        # Guardar dirección procesada
        self.direcciones_procesadas.append((direccion, resultado))
        
        return resultado

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
            
            # Detectar carreras primero
            carrera_pattern = r'\b(CR|CRA?|KR|K|CARRERA)\s*\.?\s*(\d+)'
            direccion = re.sub(carrera_pattern, lambda m: f"KR {m.group(2)}", direccion)
            
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

    def get_direcciones_procesadas(self, file_path):
        # Specify the engine explicitly
        df = pd.read_excel(file_path, engine='openpyxl')
        # Process the dataframe to extract addresses
        direcciones = df['Parametrización'].dropna().tolist()
        return [(idx, direccion) for idx, direccion in enumerate(direcciones)]

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