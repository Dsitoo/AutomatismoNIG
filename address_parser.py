import re
from functools import lru_cache
from typing import Optional, Dict, List, Tuple, Union
import pandas as pd

class OptimizedAddressParser:
    
    def __init__(self):
        self.MAPEO_TIPOS_VIA = {
            'CALLE': 'CL', 'CL': 'CL', 'CALL': 'CL', 'CAL': 'CL',
            'CLLE': 'CL', 'CLL': 'CL', 'C': 'CL',
            'CARRERA': 'KR', 'KR': 'KR', 'CR': 'KR', 'CRA': 'KR',
            'CARR': 'KR', 'K': 'KR', 'KRA': 'KR',
            'DIAGONAL': 'DG', 'DG': 'DG', 'DIAG': 'DG',
            'TRANSVERSAL': 'TV', 'TV': 'TV', 'TR': 'TV', 'TRANS': 'TV',
            'AVENIDA CALLE': 'AC', 'AC': 'AC', 'AV CALLE': 'AC', 
            'AV CL': 'AC', 'AVENIDA CL': 'AC', 'AVDA CALLE': 'AC',
            'AVENIDA CARRERA': 'AK', 'AK': 'AK', 'AV CARRERA': 'AK',
            'AV CR': 'AK', 'AVENIDA CR': 'AK', 'AVDA CARRERA': 'AK',
            'AUTOPISTA': 'AK', 'AUTOP': 'AK'
        }
        
        self.AVENIDAS_PRINCIPALES = {
            'EL DORADO': {'tipo': 'AC', 'numero': '26'},
            'DORADO': {'tipo': 'AC', 'numero': '26'},
            'ELDORADO': {'tipo': 'AC', 'numero': '26'},
            'AMERICAS': {'tipo': 'AC', 'numero': '6'},
            'LAS AMERICAS': {'tipo': 'AC', 'numero': '6'},
            'CENTENARIO': {'tipo': 'AC', 'numero': '13'},
            'JIMENEZ': {'tipo': 'AC', 'numero': '19'},
            'JIMÉNEZ': {'tipo': 'AC', 'numero': '19'},
            'PRIMERA DE MAYO': {'tipo': 'AC', 'numero': '22', 'sufijo': 'SUR'},
            'SEPTIMA': {'tipo': 'AK', 'numero': '7'},
            'SÉPTIMA': {'tipo': 'AK', 'numero': '7'},
            'DECIMA': {'tipo': 'AK', 'numero': '10'},
            'DÉCIMA': {'tipo': 'AK', 'numero': '10'},
            'CARACAS': {'tipo': 'AK', 'numero': '14'},
            'NQS': {'tipo': 'AK', 'numero': '30'},
            'NORTE QUITO SUR': {'tipo': 'AK', 'numero': '30'},
            'SUBA': {'tipo': 'AK', 'numero': '91'},
            'BOYACA': {'tipo': 'AK', 'numero': '72'},
            'BOYACÁ': {'tipo': 'AK', 'numero': '72'},
            'CIUDAD DE CALI': {'tipo': 'AK', 'numero': '86'},
            'CIUDAD DE QUITO': {'tipo': 'AK', 'numero': '30'},
            'CRISTOBAL COLON': {'tipo': 'AK', 'numero': '22'},
            'CRISTÓBAL COLÓN': {'tipo': 'AK', 'numero': '22'},
            'AUTOPISTA NORTE': {'tipo': 'AK', 'numero': '45'},
            'AUTOPISTA SUR': {'tipo': 'AK', 'numero': '27'},
            'CIRCUNVALAR': {'tipo': 'AK', 'numero': '2'},
            'PRIMERA': {'tipo': 'AK', 'numero': '1'},
            'SEGUNDA': {'tipo': 'AK', 'numero': '2'},
            'TERCERA': {'tipo': 'AK', 'numero': '3'},
            'CUARTA': {'tipo': 'AK', 'numero': '4'},
            'QUINTA': {'tipo': 'AK', 'numero': '5'},
            'SEXTA': {'tipo': 'AK', 'numero': '6'},
            'OCTAVA': {'tipo': 'AK', 'numero': '8'},
            'NOVENA': {'tipo': 'AK', 'numero': '9'},
            'ONCE': {'tipo': 'AK', 'numero': '11'},
            'DOCE': {'tipo': 'AK', 'numero': '12'},
            'TRECE': {'tipo': 'AK', 'numero': '13'},
            'QUINCE': {'tipo': 'AK', 'numero': '15'},
            'DIECISEIS': {'tipo': 'AK', 'numero': '16'},
            'DIECISIETE': {'tipo': 'AK', 'numero': '17'},
            'DIECIOCHO': {'tipo': 'AK', 'numero': '18'},
            'DIECINUEVE': {'tipo': 'AK', 'numero': '19'},
            'VEINTE': {'tipo': 'AK', 'numero': '20'}
        }
        
        self.NUMEROS_PALABRAS = {
            'PRIMERA': '1', 'SEGUNDO': '2', 'SEGUNDA': '2', 'TERCERA': '3',
            'CUARTA': '4', 'QUINTA': '5', 'SEXTA': '6', 'SEPTIMA': '7',
            'SÉPTIMA': '7', 'OCTAVA': '8', 'NOVENA': '9', 'DECIMA': '10',
            'DÉCIMA': '10'
        }
        
        self.ABREVIATURAS_NUMERO = {'N', 'NO', 'NUM', 'NRO', 'NUMERO', '#'}
        self.ELEMENTOS_ESPECIALES = {'BIS'}

    def parametrizar_direccion(self, direccion: str) -> Dict:
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
            tipo_direccion = self._detectar_tipo_direccion(direccion)
            
            if tipo_direccion == "interseccion":
                return self._procesar_interseccion(direccion)
            
            direccion_procesada = self._limpiar_direccion_agresiva(direccion)
            resultado['direccion_limpia'] = direccion_procesada
            
            if not direccion_procesada:
                resultado['errores'].append("Dirección vacía después de limpieza")
                resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
                return resultado
            
            direccion_util = self._extraer_direccion_util(direccion_procesada)
            
            if not direccion_util:
                resultado['errores'].append("No se encontró dirección válida")
                resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
                return resultado
            
            info_via = self._detectar_avenida_especifica(direccion_util)
            
            elementos_secuenciales = self._extraer_elementos_preservando_posicion(
                direccion_util, info_via['tipo'], info_via.get('numero_avenida')
            )
            
            numeros_encontrados = [elem for elem in elementos_secuenciales if elem['tipo'] == 'numero']
            if len(numeros_encontrados) < 2:
                resultado['errores'].append("Dirección debe tener al menos 2 números")
                resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
                return resultado
            
            direccion_final = self._construir_direccion_con_avenida_especifica(info_via, elementos_secuenciales)
            
            resultado['direccion_parametrizada'] = direccion_final
            resultado['valida'] = True
            
            resultado['componentes'] = {
                'tipo_via': info_via['tipo'],
                'numero_via': info_via.get('numero_avenida') or (numeros_encontrados[0]['valor'] if numeros_encontrados else None),
                'via_generadora': numeros_encontrados[0]['valor'] if info_via.get('numero_avenida') else (numeros_encontrados[1]['valor'] if len(numeros_encontrados) > 1 else None),
                'distancia': numeros_encontrados[1]['valor'] if info_via.get('numero_avenida') else (numeros_encontrados[2]['valor'] if len(numeros_encontrados) > 2 else None),
                'sufijos': [elem['valor'] for elem in elementos_secuenciales if elem['tipo'] in ['orientacion', 'especial']]
            }
            
        except Exception as e:
            resultado['errores'].append(f"Error: {str(e)}")
            resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
        
        return resultado
    
    def _detectar_tipo_direccion(self, direccion: str) -> str:
        direccion_upper = direccion.upper()
        
        patron_interseccion_con = r'(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+\d+[A-Zª]*\s+(CON|X)\s+(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+\d+[A-Zª]*'
        patron_interseccion_palabras = r'(CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SEPTIMA|SÉPTIMA|OCTAVA|NOVENA|DECIMA|DÉCIMA)\s+(CON|X)\s+(CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SEPTIMA|SÉPTIMA|OCTAVA|NOVENA|DECIMA|DÉCIMA)'
        patron_interseccion_x = r'(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+\d+[A-Z]*\s*X?\s*(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+\d+[A-Z]*'
        patron_x_pegada = r'\d+[A-Z]*X\d+[A-Z]*'
        
        if (re.search(patron_interseccion_con, direccion_upper) or 
            re.search(patron_interseccion_palabras, direccion_upper) or
            re.search(patron_interseccion_x, direccion_upper) or 
            re.search(patron_x_pegada, direccion_upper)):
            tipos_via_encontrados = re.findall(r'(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)', direccion_upper)
            if len(tipos_via_encontrados) >= 2:
                return "interseccion"
        
        return "normal"
    
    def _procesar_interseccion(self, direccion: str) -> Dict:
        resultado = {
            'direccion_original': direccion,
            'direccion_limpia': '',
            'direccion_parametrizada': '',
            'componentes': {},
            'errores': [],
            'valida': False,
            'tipo': 'interseccion'
        }
        
        direccion_limpia = self._limpiar_direccion_agresiva_interseccion(direccion)
        resultado['direccion_limpia'] = direccion_limpia
        
        patron_con = r'(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(\d+[A-Zª]*)\s+CON\s+(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(\d+[A-Zª]*)'
        patron_palabras = r'(CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SEPTIMA|SÉPTIMA|OCTAVA|NOVENA|DECIMA|DÉCIMA)\s+(CON|X)\s+(CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SEPTIMA|SÉPTIMA|OCTAVA|NOVENA|DECIMA|DÉCIMA)'
        patron_x = r'(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(\d+[A-Z]*)\s+(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(\d+[A-Z]*)\s*([A-Z]*)'
        
        match = (re.search(patron_con, direccion_limpia.upper()) or 
                re.search(patron_palabras, direccion_limpia.upper()) or
                re.search(patron_x, direccion_limpia.upper()))
        
        if match:
            if len(match.groups()) == 4:
                tipo1, num1, tipo2, num2 = match.groups()
                sufijo = ''
            elif len(match.groups()) == 5 and match.groups()[2] in ['CON', 'X']:
                tipo1, num1, conector, tipo2, num2 = match.groups()
                sufijo = ''
            else:
                tipo1, num1, tipo2, num2, sufijo = match.groups()
            
            if num1 in self.NUMEROS_PALABRAS:
                num1 = self.NUMEROS_PALABRAS[num1]
            if num2 in self.NUMEROS_PALABRAS:
                num2 = self.NUMEROS_PALABRAS[num2]
            
            num1 = self._normalizar_numero_ordinales(num1)
            num2 = self._normalizar_numero_ordinales(num2)
            
            tipo1_norm = self.MAPEO_TIPOS_VIA.get(tipo1, tipo1)
            tipo2_norm = self.MAPEO_TIPOS_VIA.get(tipo2, tipo2)
            
            direccion_param = f"{tipo1_norm} {num1} {tipo2_norm} {num2}"
            if sufijo:
                direccion_param += f" {sufijo}"
            
            resultado['direccion_parametrizada'] = direccion_param
            resultado['valida'] = True
            
            resultado['componentes'] = {
                'via_principal': {'tipo': tipo1_norm, 'numero': num1},
                'via_interseccion': {'tipo': tipo2_norm, 'numero': num2},
                'sufijo': sufijo if sufijo else None
            }
        else:
            resultado['errores'].append("No se pudo procesar la intersección")
            resultado['direccion_parametrizada'] = "DIRECCION NO VALIDA"
        
        return resultado
    
    def _limpiar_direccion_agresiva_interseccion(self, direccion: str) -> str:
        direccion = str(direccion).upper().strip()
        
        direccion = re.sub(r'\s*-\s*', ' ', direccion)
        direccion = re.sub(r'EN\s+BOGOT[AÁ].*', '', direccion)
        direccion = re.sub(r'DENTRO\s+DE\s+LOS\s+PREDIOS.*', '', direccion)
        direccion = re.sub(r'DEL\s+PALACIO.*', '', direccion)
        
        direccion = re.sub(r'\s+', ' ', direccion).strip()
        
        return direccion
    
    def _normalizar_numero_ordinales(self, numero: str) -> str:
        numero = numero.replace('ª', 'A')
        return numero
    
    def _limpiar_direccion_agresiva(self, direccion: str) -> str:
        direccion = str(direccion).upper().strip()
        
        direccion = re.sub(r'-?\s*EXTERNO\s+\d+', '', direccion)
        direccion = re.sub(r'\s*X\s*', ' ', direccion)
        direccion = re.sub(r'(\d+[A-Z]*)X(\d+)', r'\1 \2', direccion)
        direccion = re.sub(r'COORDENADAS:\s*[\d\.\-\s,]+', ' ', direccion)
        
        direccion = re.sub(r'^.*?(PARQUEADERO|CICLO)\s+', '', direccion)
        
        direccion = re.sub(r'(\d+)([A-Z])([A-Z]+)', r'\1\2 \3', direccion)
        
        patrones_inmuebles = [
            r'\s+L\s+\d+(\s+\d+)*',
            r'\s+CC\s+[\w\.]+',
            r'\s+C\.[\w]+',
            r'PISO\s*\d+', r'PI\s*\d+', r'PIS:\s*\d+', 
            r'OFICINA\s*\d+', r'OF\s*\d+', r'APARTAMENTO\s*\d+', r'LOCAL\s*\d+',
            r'EDIFICIO\s+[\w\s]+', r'TORRE\s+[\w\s]+', r'BLOQUE\s+[\w\s]+',
            r'BARRIO\s+[\w\s]+', r'DATA\s+CENTER\s+\w+',
            r'MÓDULO\s+[A-Z]', r'MODULO\s+[A-Z]',
            r'PORTAL\s+[\w\s]+', r'CENTRO\s+[\w\s]+',
            r'\s+AD\s+\d+', r'\s+AP\s+\d+', r'\s+OF\s+\d+', r'\s+LC\s+\d+'
        ]
        
        for patron in patrones_inmuebles:
            direccion = re.sub(patron, ' ', direccion, flags=re.IGNORECASE)
        
        direccion = re.sub(r'BOGOT[AÁ]\s*(D\.?C\.?)?(\s*[-/]\s*\w+)?', ' ', direccion, flags=re.IGNORECASE)
        direccion = re.sub(r'COLOMBIA\s*', ' ', direccion, flags=re.IGNORECASE)
        direccion = re.sub(r'SYC\s+\w+', ' ', direccion, flags=re.IGNORECASE)
        
        direccion = re.sub(r'N[º°]\.?\s*', ' ', direccion)
        direccion = re.sub(r'NO\.\s*', ' ', direccion)
        direccion = re.sub(r'#\s*', ' ', direccion)
        direccion = re.sub(r'\s*[-/]\s*', ' ', direccion)
        direccion = re.sub(r'AV\.', 'AVENIDA', direccion)
        direccion = re.sub(r'AVDA\.', 'AVENIDA', direccion)
        
        direccion = re.sub(r'\s+', ' ', direccion).strip()
        
        return direccion
    
    def _detectar_interseccion(self, direccion: str) -> str:
        direccion_upper = direccion.upper()
        
        patron1 = r'(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(\d+[A-Z]*)\s+(KR|CL|DG|TV|AC|AK|CARRERA|CALLE|DIAGONAL|TRANSVERSAL)\s+(\d+[A-Z]*)\s*([A-Z]*)'
        match1 = re.search(patron1, direccion_upper)
        if match1:
            tipo1, num1, tipo2, num2, sufijo = match1.groups()
            nueva_direccion = f"{tipo1} {num1} {tipo2} {num2}"
            if sufijo:
                nueva_direccion += f" {sufijo}"
            return nueva_direccion
        
        return direccion
    
    def _extraer_direccion_util(self, direccion: str) -> str:
        direccion = self._detectar_interseccion(direccion)
        
        patrones_direccion = [
            r'(KR|CL|DG|TV|AC|AK)\s+\d+[A-Z]*\s+(KR|CL|DG|TV|AC|AK)\s+\d+',
            r'(AVENIDA|AV|AVDA)\s+(EL\s+DORADO|DORADO|AMERICAS|LAS\s+AMERICAS|SEPTIMA|BOYACA|CARACAS|SUBA)',
            r'(AVENIDA|AV|AVDA)\s+\d+',
            r'(AVENIDA\s+CARRERA|AVENIDA\s+CALLE|AVENIDA)\s+\w+.*?\d+',
            r'(CARRERA|CALLE|TRANSVERSAL|DIAGONAL|AUTOPISTA)\s+\d+',
            r'(AK|AC|KR|CL|TV|DG|CR|CRA)\s+\d+',
        ]
        
        for patron in patrones_direccion:
            match = re.search(patron, direccion, re.IGNORECASE)
            if match:
                inicio_direccion = match.start()
                direccion_util = direccion[inicio_direccion:]
                direccion_util = self._eliminar_duplicacion_texto(direccion_util)
                return direccion_util
        
        match = re.search(r'\b(CL|KR|CR|CRA|CALLE|CARRERA|TV|DG|AC|AK|AVENIDA|TRANSVERSAL|DIAGONAL|AUTOPISTA)\b.*?\d+', direccion, re.IGNORECASE)
        if match:
            return direccion[match.start():]
        
        return direccion
    
    def _eliminar_duplicacion_texto(self, direccion: str) -> str:
        direccion_upper = direccion.upper()
        
        tipos_via = ['AVENIDA', 'CLL', 'CL', 'KR', 'CR', 'CRA', 'CALLE', 'CARRERA', 'TV', 'DG', 'AC', 'AK', 'AUTOPISTA']
        
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
        
        if len(posiciones_tipos) > 1:
            posiciones_tipos.sort(key=lambda x: x['posicion'])
            
            inicio = posiciones_tipos[0]['posicion']
            fin = posiciones_tipos[1]['posicion']
            
            primera_direccion = direccion[inicio:fin].strip()
            primera_direccion = re.sub(r'[\.#\-\s]+$', '', primera_direccion)
            
            primera_parte_numeros = re.findall(r'\d+[A-Z]*', primera_direccion.upper())
            segunda_parte = direccion[fin:].strip()
            segunda_parte_numeros = re.findall(r'\d+[A-Z]*', segunda_parte.upper())
            
            numeros_similares = len(set(primera_parte_numeros) & set(segunda_parte_numeros))
            if numeros_similares > 0:
                return primera_direccion
        
        return direccion
    
    def _detectar_avenida_especifica(self, direccion: str) -> Dict:
        direccion_upper = direccion.upper()
        info_via = {'tipo': None, 'numero_avenida': None, 'sufijo': None}
        
        for nombre, info in self.AVENIDAS_PRINCIPALES.items():
            patron = rf'\b(AVENIDA|AV|AVDA)\.?\s+{re.escape(nombre)}\b'
            if re.search(patron, direccion_upper):
                info_via['tipo'] = info['tipo']
                info_via['numero_avenida'] = info['numero']
                if 'sufijo' in info:
                    info_via['sufijo'] = info['sufijo']
                return info_via
        
        match_avenida_numero = re.search(r'\b(AVENIDA|AV|AVDA)\.?\s+(\d+)', direccion_upper)
        if match_avenida_numero:
            numero = match_avenida_numero.group(2)
            info_via['tipo'] = 'AK'
            info_via['numero_avenida'] = numero
            return info_via
        
        tipos_ordenados = [
            ('AVENIDA CARRERA', 'AK'), ('AVENIDA CALLE', 'AC'),
            ('TRANSVERSAL', 'TV'), ('DIAGONAL', 'DG'),
            ('AUTOPISTA', 'AK'), ('CARRERA', 'KR'), ('CALLE', 'CL'),
            ('AVENIDA', 'AK'), ('AVDA', 'AK'), ('AV', 'AK'),
            ('AK', 'AK'), ('AC', 'AC'), ('TV', 'TV'), ('DG', 'DG'),
            ('KR', 'KR'), ('CL', 'CL'), ('CRA', 'KR'), ('CR', 'KR')
        ]
        
        for tipo_texto, tipo_codigo in tipos_ordenados:
            if re.search(rf'\b{re.escape(tipo_texto)}\.?\b', direccion_upper):
                info_via['tipo'] = tipo_codigo
                return info_via
        
        info_via['tipo'] = 'CL'
        return info_via
    
    def _es_abreviatura_numero(self, token: str) -> bool:
        return token.upper() in self.ABREVIATURAS_NUMERO
    
    def _es_elemento_especial(self, token: str) -> bool:
        return token.upper() in self.ELEMENTOS_ESPECIALES
    
    def _es_letra_valida_para_numero(self, token: str) -> bool:
        token_upper = token.upper()
        
        if self._es_abreviatura_numero(token_upper):
            return False
        
        if self._es_elemento_especial(token_upper):
            return False
        
        if token_upper in ['SUR', 'ESTE', 'NORTE', 'OESTE']:
            return False
        
        if token_upper == 'X':
            return False
        
        if token_upper == 'L':
            return False
        
        if re.match(r'^[A-Z]$', token_upper):
            return True
        
        return False
    
    def _extraer_elementos_preservando_posicion(self, direccion: str, tipo_via: str, numero_avenida: str = None) -> List[Dict]:
        elementos_secuenciales = []
        
        direccion_sin_tipo = direccion
        
        if numero_avenida:
            patron_avenida = rf'^(AVENIDA|AV|AVDA)\.?\s+.*?(?=\d+)'
            direccion_sin_tipo = re.sub(patron_avenida, '', direccion_sin_tipo, flags=re.IGNORECASE)
        else:
            patron_tipo_via = rf'^{re.escape(tipo_via)}\.?\s+'
            direccion_sin_tipo = re.sub(patron_tipo_via, '', direccion_sin_tipo, flags=re.IGNORECASE)
        
        match_numeros = re.search(r'\d+', direccion_sin_tipo)
        if match_numeros:
            inicio_numeros = match_numeros.start()
            direccion_sin_tipo = direccion_sin_tipo[inicio_numeros:]
        
        tokens = direccion_sin_tipo.split()
        
        numeros_vistos = set()
        orientaciones_vistas = set()
        especiales_vistos = set()
        numeros_procesados = 0
        max_numeros_principales = 3
        
        i = 0
        while i < len(tokens):
            token = tokens[i].upper()
            
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
            
            if self._es_abreviatura_numero(token):
                i += 1
                continue
            
            if re.search(r'\d', token):
                if numeros_procesados >= max_numeros_principales:
                    break
                
                numero_completo = None
                saltos = 0
                
                if 'BIS' in token:
                    numero_completo = token
                    if (i + 1 < len(tokens) and self._es_letra_valida_para_numero(tokens[i + 1])):
                        numero_completo += tokens[i + 1].upper()
                        saltos = 1
                
                elif re.match(r'^\d+[A-Z]*$', token):
                    if (i + 1 < len(tokens) and self._es_letra_valida_para_numero(tokens[i + 1])):
                        numero_completo = token + tokens[i + 1].upper()
                        saltos = 1
                    else:
                        numero_completo = token
                
                elif re.match(r'^\d+$', token):
                    if (i + 1 < len(tokens) and self._es_letra_valida_para_numero(tokens[i + 1])):
                        numero_completo = token + tokens[i + 1].upper()
                        saltos = 1
                    else:
                        numero_completo = token
                
                if numero_completo:
                    numero_normalizado = self._normalizar_numero(numero_completo)
                    if numero_normalizado not in numeros_vistos:
                        elementos_secuenciales.append({
                            'tipo': 'numero',
                            'valor': numero_completo,
                            'posicion': i
                        })
                        numeros_vistos.add(numero_normalizado)
                        numeros_procesados += 1
                
                i += 1 + saltos
                continue
            
            elif self._es_letra_valida_para_numero(token):
                if elementos_secuenciales:
                    for j in range(len(elementos_secuenciales) - 1, -1, -1):
                        if elementos_secuenciales[j]['tipo'] == 'numero':
                            ultimo_numero = elementos_secuenciales[j]['valor']
                            if re.match(r'^\d+', ultimo_numero):
                                numero_combinado = ultimo_numero + token
                                numero_normalizado = self._normalizar_numero(numero_combinado)
                                
                                numeros_vistos.discard(self._normalizar_numero(ultimo_numero))
                                elementos_secuenciales[j]['valor'] = numero_combinado
                                numeros_vistos.add(numero_normalizado)
                                break
            
            i += 1
        
        return elementos_secuenciales
    
    def _normalizar_numero(self, numero: str) -> str:
        return re.sub(r'\s+', '', numero.upper())
    
    def _construir_direccion_con_avenida_especifica(self, info_via: Dict, elementos_secuenciales: List[Dict]) -> str:
        partes = [info_via['tipo']]
        
        if info_via.get('numero_avenida'):
            partes.append(info_via['numero_avenida'])
        
        if info_via.get('sufijo'):
            partes.append(info_via['sufijo'])
        
        elementos_ordenados = sorted(elementos_secuenciales, key=lambda x: x['posicion'])
        
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
    
    casos_prueba_completos = [
        ("AVENIDA 19 NO. 104 - 72", "AK 19 104 72"),
        ("AVENIDA 68 NO. 38 A - 15 SUR", "AK 68 38A 15 SUR"),
        ("Carrera octava con Calle octava en Bogotá D.C., dentro de los predios del Palacio de Nariño.", "KR 8 CL 8"),
        ("Dg. 40a Bis #15-2", "DG 40A BIS 15 2"),
        ("JUAN PABLO II CICLO PARQUEADERO CARRERA 18NBISB # 67C-40", "KR 18N BIS B 67C 40"),
        ("CL 24C SUR 48 94 L 1006 1007 1008 1009 1010 1016 CC C.TUNAL", "CL 24C SUR 48 94"),
        ("CR 13 81 37", "KR 13 81 37"),
        ("KR 78A X DG 76 S - EXTERNO 3094", "KR 78A DG 76S"),
        ("Kr 55 X Cl 153 - EXTERNO 127", "KR 55 CL 153"),
        ("DG 78AX 76S 3094", "DG 78A 76S"),
        ("CL 45 X KR 23A SUR", "CL 45 KR 23A SUR"),
        ("Av El Dorado 68C 61 Of206 - SYC Bogotá", "AC 26 68C 61"),
        ("Avenida 19. # 98-01 Edificio Torre 100", "AK 19 98 01"),
        ("Av. Carrera 86 No.43-55 Sur (Portal Américas) Módulo D", "AK 86 43 55 SUR"),
        ("AVENIDA SEPTIMA 45 23 67", "AK 7 45 23 67"),
        ("AV BOYACA 72 34 56", "AK 72 34 56"),
        ("AVENIDA CARACAS 14 89 12", "AK 14 89 12"),
        ("CL 111 A BIS SUR 4 A 41 ESTE", "CL 111A BIS SUR 4A 41 ESTE"),
        ("TV 123A BIS 45 67 NORTE", "TV 123A BIS 45 67 NORTE"),
        ("KR 55 153 127", "KR 55 153 127"),
        ("CALLE 45 23 67", "CL 45 23 67"),
        ("DIAGONAL 78 56 34", "DG 78 56 34")
    ]
    
    print("🚀 PRUEBAS DEL PARSER CORREGIDO FINAL")
    print("=" * 80)
    print("Formato: Original → Resultado Obtenido (Esperado)")
    print("-" * 80)
    
    casos_exitosos = 0
    total_casos = len(casos_prueba_completos)
    
    for i, (direccion_original, esperado) in enumerate(casos_prueba_completos, 1):
        resultado = parser.parametrizar_direccion(direccion_original)
        obtenido = resultado['direccion_parametrizada']
        
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
            if resultado['errores']:
                print(f"    🔍 Errores: {', '.join(resultado['errores'])}")
            if 'tipo' in resultado:
                print(f"    📍 Tipo: {resultado.get('tipo', 'normal')}")
        print()
    
    print("=" * 80)
    print(f"🎯 RESUMEN: {casos_exitosos}/{total_casos} casos exitosos ({casos_exitosos/total_casos*100:.1f}%)")
    
    if casos_exitosos == total_casos:
        print("🎉 ¡TODOS LOS CASOS PASARON!")
    else:
        print(f"⚠️  {total_casos - casos_exitosos} casos requieren ajustes")