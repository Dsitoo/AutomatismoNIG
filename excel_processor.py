import pandas as pd
import numpy as np
from pathlib import Path
import time
from datetime import datetime
from typing import Optional, Dict, List, Tuple
import logging
import re
import unicodedata
from openpyxl import load_workbook
from address_parser import OptimizedAddressParser

class ExcelAddressProcessor:
    """
    Procesador optimizado para archivos Excel con direcciones - PRESERVA FORMATO
    """
    
    def __init__(self, log_level: str = 'INFO'):
        self.parser = OptimizedAddressParser()
        self.setup_logging(log_level)
        self.processed_count = 0
        self.error_count = 0
        self.stats = {
            'total_rows': 0,
            'processed': 0,
            'errors': 0,
            'empty_addresses': 0,
            'processing_time': 0
        }
    
    def setup_logging(self, level: str):
        """Configurar logging solo en consola, sin archivo .log"""
        log_level = getattr(logging, level.upper(), logging.INFO)
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def validate_file(self, file_path: str) -> Tuple[bool, str]:
        """Validar archivo"""
        path = Path(file_path)
        
        if not path.exists():
            return False, f"El archivo {file_path} no existe"
        
        if not path.suffix.lower() in ['.xlsx', '.xls']:
            return False, f"El archivo debe ser Excel (.xlsx o .xls)"
        
        try:
            pd.read_excel(file_path, nrows=1)
            return True, "Archivo válido"
        except Exception as e:
            return False, f"Error leyendo el archivo: {str(e)}"
    
    def detect_address_column(self, df: pd.DataFrame) -> Optional[str]:
        """Detectar columna de direcciones"""
        possible_names = [
            'Dirección principal', 'direccion principal', 'DIRECCION PRINCIPAL',
            'Direccion', 'direccion', 'DIRECCION',
            'Dirección', 'direccion', 'DIRECCION',
            'Address', 'address', 'ADDRESS',
            'Dir', 'dir', 'DIR'
        ]
        
        for col in df.columns:
            if str(col).strip() in possible_names:
                return col
        
        # Buscar por contenido
        for col in df.columns:
            if df[col].dtype == 'object':
                sample = df[col].dropna().head(5)
                if len(sample) > 0:
                    sample_text = ' '.join(sample.astype(str).str.upper())
                    if any(word in sample_text for word in ['CALLE', 'CL', 'CARRERA', 'KR', 'CRA']):
                        self.logger.info(f"Columna de direcciones detectada: {col}")
                        return col
        
        return None

    def normalize_colname(self, colname: str) -> str:
        """Normaliza el nombre de columna quitando tildes y pasando a minúsculas"""
        return ''.join(c for c in unicodedata.normalize('NFD', colname)
                       if unicodedata.category(c) != 'Mn').lower()

    def process_excel_file_preserve_format(self, file_path: str = "Backlog250525-filtradocobertura.xlsx", 
                                         show_progress: bool = True) -> bool:
        """
        Procesar archivo Excel PRESERVANDO TODO EL FORMATO ORIGINAL
        SOLO modifica el contenido de las celdas de parametrización
        """
        try:
            # Validar archivo
            is_valid, message = self.validate_file(file_path)
            if not is_valid:
                self.logger.error(message)
                return False
            
            print(f"🔄 Procesando archivo: {file_path}")
            print("⚠️  MODO PRESERVACIÓN DE FORMATO - Solo se editará el contenido de celdas")
            
            # Usar openpyxl para preservar formato
            workbook = load_workbook(file_path)
            worksheet = workbook.active
            
            # También leer con pandas para facilitar la detección de columnas
            df = pd.read_excel(file_path)
            
            # Detectar columna de direcciones
            address_col = self.detect_address_column(df)
            if not address_col:
                self.logger.error("No se pudo detectar la columna de direcciones")
                return False
            
            # Encontrar índice de la columna de direcciones
            address_col_idx = None
            for idx, col in enumerate(df.columns):
                if col == address_col:
                    address_col_idx = idx
                    break
            
            if address_col_idx is None:
                self.logger.error("No se pudo encontrar el índice de la columna de direcciones")
                return False
            
            # Detectar columna de parametrización
            param_col_name = None
            param_col_idx = None
            target_col = self.normalize_colname('Prametrización')
            for idx, col in enumerate(df.columns):
                norm_col = self.normalize_colname(str(col).replace('"','').replace("'",''))
                if norm_col == target_col:
                    param_col_name = col
                    param_col_idx = idx
                    break
            
            if not param_col_name:
                print("No se encontró columna de parametrización automáticamente.")
                print("Columnas disponibles:")
                for i, col in enumerate(df.columns):
                    print(f"  {chr(65+i)}: {col}")
                print("Por favor, ingrese la letra de la columna de parametrización (ejemplo: Z): ", end='')
                col_letter = input().strip().upper()
                param_col_idx = ord(col_letter) - ord('A')
                if 0 <= param_col_idx < len(df.columns):
                    param_col_name = df.columns[param_col_idx]
                    print(f"Columna seleccionada: {param_col_name}")
                else:
                    self.logger.error("Letra de columna inválida.")
                    return False
            
            print(f"📍 Columna de direcciones: {address_col} (columna {chr(65+address_col_idx)})")
            print(f"🎯 Columna de parametrización: {param_col_name} (columna {chr(65+param_col_idx)})")
            
            # Procesar direcciones y crear diccionario de parametrización
            valid_addresses = df[address_col].fillna("").astype(str)
            self.parser.direcciones_procesadas = []
            
            print("🔄 Procesando direcciones...")
            for i, addr in enumerate(valid_addresses):
                if show_progress and i % 100 == 0:
                    progress = (i / len(valid_addresses)) * 100
                    print(f"   Progreso: {progress:.1f}% ({i}/{len(valid_addresses)})")
                self.parser.parse_address(addr)
            
            procesadas = self.parser.get_direcciones_procesadas()
            dict_param = {orig: param for orig, param in procesadas}
            
            # SOLO modificar el contenido de las celdas de parametrización
            print("✏️  Actualizando celdas de parametrización...")
            modificadas = 0
            vaciadas = 0
            
            # Iterar sobre las filas de datos (saltando el header)
            for row_idx in range(2, len(df) + 2):  # openpyxl usa índices base 1, y fila 1 es header
                # Obtener la dirección original
                direccion_cell = worksheet.cell(row=row_idx, column=address_col_idx + 1)
                direccion_original = str(direccion_cell.value or "").strip()
                
                if not direccion_original:
                    continue
                
                # Obtener la parametrización
                parametrizada = dict_param.get(direccion_original, "NO APARECE DIRECCION")
                
                # Celda de parametrización
                param_cell = worksheet.cell(row=row_idx, column=param_col_idx + 1)
                
                # Aplicar las reglas:
                if parametrizada == "NO APARECE DIRECCION" or parametrizada == direccion_original:
                    # Dejar la celda vacía (no necesita cambios o no se puede parametrizar)
                    if param_cell.value is not None:
                        param_cell.value = None
                        vaciadas += 1
                else:
                    # Reemplazar con la versión corregida
                    param_cell.value = parametrizada
                    modificadas += 1
            
            # Guardar el archivo SIN cambiar formato
            print("💾 Guardando cambios...")
            workbook.save(file_path)
            workbook.close()
            
            # Resumen final
            print(f"\n{'='*60}")
            print("✅ PROCESAMIENTO COMPLETADO")
            print(f"{'='*60}")
            print(f"📁 Archivo: {file_path}")
            print(f"📊 Total direcciones procesadas: {len(valid_addresses)}")
            print(f"✏️  Celdas modificadas: {modificadas}")
            print(f"🧹 Celdas vaciadas: {vaciadas}")
            print(f"🎨 Formato original preservado: ✅")
            print(f"{'='*60}")
            
            return True
                
        except Exception as e:
            self.logger.error(f"Error procesando archivo: {str(e)}")
            return False

    def process_excel_file(self, file_path: str = "Backlog250525-filtradocobertura.xlsx", 
                          show_progress: bool = True) -> bool:
        """
        Método alias para mantener compatibilidad - llama al método principal
        """
        return self.process_excel_file_preserve_format(file_path, show_progress)


# Código para ejecutar el procesamiento
if __name__ == "__main__":
    processor = ExcelAddressProcessor()
    
    # Procesar el archivo PRESERVANDO FORMATO
    success = processor.process_excel_file("Backlog250525-filtradocobertura.xlsx")
    
    if success:
        print("\n✅ Procesamiento completado exitosamente")
        print("🎨 El formato original se ha preservado completamente")
    else:
        print("\n❌ Error en el procesamiento")