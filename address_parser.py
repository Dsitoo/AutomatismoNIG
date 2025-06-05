import re
from functools import lru_cache
from typing import Optional, Dict, List, Tuple

class OptimizedAddressParser:
    """
    Analizador de direcciones optimizado para manejo de alto volumen
    con soporte completo para el sistema de direcciones de Bogotá
    """
    
    def __init__(self):
        # Mapeo completo de tipos de vía con todas las variaciones
        self.TIPO_VIA = {
            # Calles
            'CALLE': 'CL', 'CL': 'CL', 'CLL': 'CL', 'CLLE': 'CL', 'C': 'CL',
            'CALL': 'CL', 'CAL': 'CL', 'CALL.': 'CL', 'CL.': 'CL',
            
            # Carreras
            'CARRERA': 'KR', 'KR': 'KR', 'CRA': 'KR', 'CR': 'KR', 'K': 'KR',
            'CARR': 'KR', 'CARRE': 'KR', 'CRA.': 'KR', 'CR.': 'KR',
            
            # Transversales
            'TRANSVERSAL': 'TV', 'TV': 'TV', 'TRANSV': 'TV', 'TRANS': 'TV',
            'TR': 'TV', 'TV.': 'TV', 'TRAV': 'TV',
            
            # Diagonales
            'DIAGONAL': 'DG', 'DG': 'DG', 'DIAG': 'DG', 'DG.': 'DG',
            'D': 'DG', 'DIAGON': 'DG',
            
            # Avenidas
            'AVENIDA': 'AV', 'AV': 'AV', 'AV.': 'AV', 'AVE': 'AV',
            'AVEN': 'AV', 'AVENI': 'AV',
            
            # Avenidas especiales
            'AK': 'AK', 'AC': 'AC'
        }
        
        # Orientaciones válidas
        self.ORIENTACIONES = {'SUR', 'NORTE', 'ESTE', 'OESTE', 'S', 'N', 'E', 'O'}
        
        # Avenidas especiales con sus equivalencias
        self.AVENIDAS_ESPECIALES = {
            r'(?:AV\.?\s+)?EL\s+DORADO': 'AC 26',
            r'(?:AV\.?\s+)?CARACAS': 'AK 14',
            r'(?:AV\.?\s+)?BOYACA': 'AK 72',
            r'(?:AV\.?\s+)?NQS': 'AK 30',
            r'(?:AV\.?\s+)?SUBA': 'AV SUBA',
            r'(?:AV\.?\s+)?AMERICAS': 'AC 6',
            r'(?:AV\.?\s+)?CHILE': 'AC 72',
            r'(?:AV\.?\s+)?JIMENEZ': 'AC 13'
        }
        
        # Patrones precompilados para mayor eficiencia
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Precompila todos los patrones regex para optimizar rendimiento"""
        
        # Patrón principal optimizado con grupos nombrados
        tipo_via_pattern = '|'.join(re.escape(k) for k in sorted(self.TIPO_VIA.keys(), key=len, reverse=True))
        
        self.main_pattern = re.compile(
            rf'''
            (?P<tipo_via>{tipo_via_pattern})
            \.?\s*
            (?P<num1>\d+)
            (?P<letra1>[A-Z])?
            \s*
            (?P<bis>BIS)?
            \s*
            (?P<orient1>SUR|NORTE|ESTE|OESTE|S|N|E|O)?
            \s*
            (?:[#NnOo\.\-\s]*|NO\.?\s*|N[°º]?\s*)
            (?P<num2>\d+)
            (?P<letra2>[A-Z])?
            \s*
            (?:[\-\.]?\s*)?
            (?P<num3>\d+)?
            (?P<letra3>[A-Z])?
            \s*
            (?P<orient2>SUR|NORTE|ESTE|OESTE|S|N|E|O)?
            ''', 
            re.VERBOSE | re.IGNORECASE
        )
        
        # Patrón para limpiar texto
        self.clean_pattern = re.compile(r'[^\w\s#\-\.\°º]')
        self.space_pattern = re.compile(r'\s+')
        
        # Patrones para avenidas especiales
        self.special_av_patterns = {
            name: re.compile(pattern, re.IGNORECASE) 
            for pattern, name in self.AVENIDAS_ESPECIALES.items()
        }
        
        # Patrón para extraer información adicional (pisos, etc.)
        self.extra_info_pattern = re.compile(
            r'(?:PISO?|PI|P)\.?\s*\d+|'
            r'(?:OFICINA?|OF)\.?\s*\d+|'
            r'(?:LOCAL|LC|L)\.?\s*\d+|'
            r'(?:INTERIOR|INT)\.?\s*\d+|'
            r'(?:APARTAMENTO|APTO|APT)\.?\s*\d+',
            re.IGNORECASE
        )
    
    @lru_cache(maxsize=10000)
    def clean_text(self, text: str) -> str:
        """Limpia y normaliza el texto de entrada con caché para optimización"""
        if not text:
            return ""
            
        text = text.upper().strip()
        # Reemplazar caracteres especiales comunes
        text = text.replace('Nº', ' N ').replace('°', ' ').replace('º', ' ')
        # Limpiar caracteres no deseados
        text = self.clean_pattern.sub('', text)
        # Normalizar espacios
        text = self.space_pattern.sub(' ', text)
        return text.strip()
    
    def handle_special_avenues(self, direccion: str) -> Optional[str]:
        """Maneja avenidas especiales como El Dorado, Caracas, etc."""
        for pattern, replacement in self.special_av_patterns.items():
            if pattern.search(direccion):
                # Extraer números si existen
                numbers = re.findall(r'\d+[A-Z]?', direccion)
                if len(numbers) >= 2:
                    return f"{self.AVENIDAS_ESPECIALES[pattern.pattern]} {numbers[0]} {numbers[1]}"
                elif len(numbers) == 1:
                    return f"{self.AVENIDAS_ESPECIALES[pattern.pattern]} {numbers[0]}"
                else:
                    return self.AVENIDAS_ESPECIALES[pattern.pattern]
        return None
    
    def normalize_orientation(self, orient: str) -> str:
        """Normaliza las orientaciones a formato estándar"""
        if not orient:
            return ""
        orient = orient.upper()
        mapping = {'S': 'SUR', 'N': 'NORTE', 'E': 'ESTE', 'O': 'OESTE'}
        return mapping.get(orient, orient)
    
    def extract_coordinates(self, direccion: str) -> Tuple[str, Optional[str]]:
        """Extrae coordenadas del texto si existen"""
        coord_pattern = re.compile(r'COORDENADAS?[:\s]*(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)', re.IGNORECASE)
        match = coord_pattern.search(direccion)
        if match:
            coords = f"COORD: {match.group(1)}, {match.group(2)}"
            cleaned_address = coord_pattern.sub('', direccion).strip()
            return cleaned_address, coords
        return direccion, None
    
    def parse_complex_address(self, direccion: str) -> Optional[str]:
        """Maneja direcciones complejas que no siguen el patrón estándar"""
        # Convertir abreviaciones comunes
        direccion = direccion.upper().replace(' X ', ' CON ')
        direccion = direccion.replace('AK', 'AVENIDA CARRERA')
        direccion = direccion.replace('AC', 'AVENIDA CALLE')
        
        # Patrones para intersecciones
        intersection_pattern = re.compile(
            r'''
            (?P<via1>(?:CALLE|CARRERA|AVENIDA|TRANSVERSAL|DIAGONAL)\s+\d+[A-Z]?\s*(?:SUR|NORTE|ESTE|OESTE)?)|
            (?P<via1_short>(?:CL|KR|AV|TV|DG)\s+\d+[A-Z]?\s*(?:SUR|NORTE|ESTE|OESTE)?)
            \s+(?:CON|Y)\s+
            (?P<via2>(?:CALLE|CARRERA|AVENIDA|TRANSVERSAL|DIAGONAL)\s+\d+[A-Z]?\s*(?:SUR|NORTE|ESTE|OESTE)?)|
            (?P<via2_short>(?:CL|KR|AV|TV|DG)\s+\d+[A-Z]?\s*(?:SUR|NORTE|ESTE|OESTE)?)
            ''',
            re.VERBOSE
        )
        
        match = intersection_pattern.search(direccion)
        if match:
            via1 = match.group('via1') or match.group('via1_short')
            via2 = match.group('via2') or match.group('via2_short')
            
            if via1 and via2:
                # Normalizar abreviaciones
                via1 = self._normalize_via(via1)
                via2 = self._normalize_via(via2)
                return f"{via1} X {via2}"
        
        return None

    def _normalize_via(self, via: str) -> str:
        """Normaliza el formato de la vía"""
        parts = via.split()
        if not parts:
            return via
            
        # Normalizar tipo de vía
        tipo = parts[0]
        tipo_norm = self.TIPO_VIA.get(tipo, tipo)
        
        # Reconstruir la vía normalizada
        return ' '.join([tipo_norm] + parts[1:])

    def validate_result(self, result: str) -> bool:
        """Valida que el resultado cumpla con el formato requerido"""
        if not result or result == "NO APARECE DIRECCION":
            return False
            
        parts = result.split()
        if len(parts) < 2:  # Mínimo tipo de vía y un número
            return False
            
        # Verificar tipo de vía
        if parts[0] not in self.TIPO_VIA.values():
            return False
            
        # Verificar que hay al menos un número
        has_number = any(part.replace('BIS', '').replace('SUR', '').replace('NORTE', '')
                        .replace('ESTE', '').replace('OESTE', '').isdigit() 
                        for part in parts[1:])
        return has_number

    def parse_address(self, direccion: str) -> str:
        """
        Parametriza direcciones siguiendo el formato estándar:
        - Solo componentes estructurales (tipo vía, números)
        - Elimina información adicional (pisos, locales, etc.)
        - Formato: TIPO_VIA NUMERO1 [BIS] NUMERO2 NUMERO3 [ORIENTACION]
        """
        if not direccion or not isinstance(direccion, str):
            return "NO APARECE DIRECCION"
            
        try:
            # Limpiar y normalizar
            direccion = self.clean_text(direccion)
            
            # Buscar patrones de dirección usando regex mejorado
            pattern = re.compile(r'''
                # Tipo de vía con sus variantes
                (?P<tipo_via>CALLE|CL|CARRERA|KR|CR|CRA|DIAGONAL|DG|TRANSVERSAL|TV|AVENIDA|AV|AK|AC)
                [.\s]+
                # Número principal con posible letra y BIS
                (?P<num1>\d+[A-Z]?)
                (?P<bis>\s+BIS)?
                # Orientación opcional después del primer número
                (?P<orient1>\s+(?:NORTE|SUR|ESTE|OESTE))?
                # Separadores variables
                [.\s#\-]+
                # Segundo número con posible letra
                (?P<num2>\d+[A-Z]?)
                # Separador opcional para tercer número
                (?:[-\s]+
                # Tercer número opcional
                (?P<num3>\d+))?
                # Orientación final opcional
                (?P<orient2>\s+(?:NORTE|SUR|ESTE|OESTE))?
            ''', re.VERBOSE | re.IGNORECASE)
            
            match = pattern.search(direccion)
            if not match:
                return "NO APARECE DIRECCION"
            
            # Construir dirección parametrizada
            components = []
            
            # 1. Tipo de vía normalizado
            tipo_via = self.TIPO_VIA.get(match.group('tipo_via').upper(), 'NO APARECE DIRECCION')
            components.append(tipo_via)
            
            # 2. Primer número
            if match.group('num1'):
                components.append(match.group('num1').upper())
            
            # 3. BIS si existe
            if match.group('bis'):
                components.append('BIS')
            
            # 4. Primera orientación si existe
            if match.group('orient1'):
                components.append(match.group('orient1').strip().upper())
            
            # 5. Segundo número
            if match.group('num2'):
                components.append(match.group('num2').upper())
            
            # 6. Tercer número
            if match.group('num3'):
                components.append(match.group('num3'))
            
            # 7. Segunda orientación si existe
            if match.group('orient2'):
                components.append(match.group('orient2').strip().upper())
            
            result = ' '.join(components)
            return result if self.validate_result(result) else "NO APARECE DIRECCION"
            
        except Exception as e:
            print(f"Error parsing '{direccion}': {str(e)}")
            return "NO APARECE DIRECCION"

    def batch_parse(self, direcciones: List[str]) -> List[str]:
        """Procesa múltiples direcciones de forma optimizada"""
        return [self.parse_address(dir) for dir in direcciones]


# Ejemplo de uso optimizado para alto volumen
if __name__ == "__main__":
    parser = OptimizedAddressParser()
    
    # Ejemplos de prueba
    test_addresses = [
        "Transversal 18Bis # 38-41 piso 2",
        "Calle 146B # 90-26",
        "AV EL DORADO NO. 66 - 63",
        "Carrera 13 #54-74 2° piso",
        "CALLE 137D SUR #11 A 1 BOGOTA 4.469745490754561. -74.12529716131037",
        "Kr 54 X Cl 138 EXT. 1100",
        "Av. Caracas No. 1 - 13"
    ]
    
    print("Pruebas del parser optimizado:")
    print("-" * 50)
    for addr in test_addresses:
        result = parser.parse_address(addr)
        print(f"{addr[:50]:<50} -> {result}")